import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaClientManager } from "../tenancy/prisma-client-manager.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import * as bcrypt from "bcrypt";
import { Response } from "express";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prismaClientManager: PrismaClientManager
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, name, password, companySlug } = registerDto;

    // Check if user already exists
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      // If user exists AND has a password, conflict.
      // If user exists but NO password (phantom), we activate them.
      if (user.password && user.password.length > 0) {
        throw new ConflictException("User with this email already exists");
      }

      // Activate phantom user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          password: hashedPassword,
        },
      });
    } else {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });
    }

    // Handle Company Join logic if slug provided
    if (companySlug) {
      await this.handleCompanyJoin(user.id, email, companySlug);
    }

    return {
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  private async handleCompanyJoin(userId: string, email: string, slug: string) {
    try {
      const tenantPrisma = await this.prismaClientManager.getClient(slug);

      const company = await tenantPrisma.company.findFirst();
      if (!company) return; // Slug might be invalid, ignore silently or warn

      // Check if membership exists (e.g. from Invite)
      const existingMember = await tenantPrisma.companyUser.findUnique({
        where: { userId_companyId: { userId, companyId: company.id } },
      });

      if (existingMember) {
        // If already invited (PENDING), activate them
        // Role is already set by invite
        if (existingMember.status === "PENDING") {
          await tenantPrisma.companyUser.update({
            where: { userId_companyId: { userId, companyId: company.id } },
            data: { status: "APPROVED" }, // Auto-approve if they register with correct code?
            // Wait, requirements: "ketika email yang dia daftarkan sudah ada di list member yang statusnya pending invitation maka saat register nya berhasil... dia sudah punya company"
            // "role nya adalah role yang diset admin saat menambahkan user"
            // So yes, Auto-Approve invited users.
          });
        }
      } else {
        // Not invited, but user wants to join.
        // "kalau dia tidak ada di list member... status nya pending... admin assign role"
        await tenantPrisma.companyUser.create({
          data: {
            userId,
            companyId: company.id,
            status: "PENDING",
            role: "FINANCE", // Placeholder, Admin must set real role on approval
          },
        });
      }
    } catch (e) {
      console.error("Failed to handle company join", e);
      // Don't block registration if company join fails
    }
  }

  async login(loginDto: LoginDto, response: Response) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        companyUsers: {
          where: {
            status: "APPROVED",
          },
          include: {
            company: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Get user's first approved company (if any)
    const userCompany = user.companyUsers[0];

    if (!userCompany) {
      // User has no companies yet - still return tokens but with empty company context
      const tokens = await this.generateTokens(
        user.id,
        user.email,
        user.name,
        "",
        []
      );
      this.setTokenCookies(response, tokens);

      return {
        message: "Login successful - no company assigned yet",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        needsCompany: true,
      };
    }

    // Generate tokens with company context
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.name,
      userCompany.companyId,
      [userCompany.role]
    );

    // Update refresh token in database
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken },
    });

    // Set HTTP-only cookies
    this.setTokenCookies(response, tokens);

    return {
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      company: {
        id: userCompany.company.id,
        name: userCompany.company.name,
        slug: userCompany.company.slug,
      },
      role: userCompany.role,
    };
  }

  async refreshTokens(userId: string, companyId: string, response: Response) {
    // Get user's role in the company
    const companyUser = await this.prisma.companyUser.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
    });

    if (!companyUser) {
      throw new UnauthorizedException("Invalid token");
    }

    // Get user info
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User not found");

    // Generate new tokens
    const tokens = await this.generateTokens(
      userId,
      user.email,
      user.name,
      companyId,
      [companyUser.role]
    );

    // Update refresh token in database
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });

    // Set HTTP-only cookies
    this.setTokenCookies(response, tokens);

    return { message: "Tokens refreshed successfully" };
  }

  async logout(userId: string, response: Response) {
    // Clear refresh token from database
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });

    // Clear cookies
    response.clearCookie("access_token");
    response.clearCookie("refresh_token");

    return { message: "Logged out successfully" };
  }

  private async generateTokens(
    userId: string,
    email: string,
    name: string,
    companyId: string,
    roles: string[]
  ) {
    const accessTokenPayload = {
      sub: userId,
      email,
      name,
      company: companyId,
      roles,
    };

    const refreshTokenPayload = {
      sub: userId,
      email,
      name,
      company: companyId,
    };

    const accessToken = await this.jwtService.signAsync(accessTokenPayload, {
      secret: this.configService.get("JWT_ACCESS_SECRET"),
      expiresIn: this.configService.get("JWT_ACCESS_EXPIRATION") || "7d",
    });

    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      secret: this.configService.get("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.get("JWT_REFRESH_EXPIRATION") || "30d",
    });

    return { accessToken, refreshToken };
  }

  private setTokenCookies(
    response: Response,
    tokens: { accessToken: string; refreshToken: string }
  ) {
    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : ("lax" as const), // 'lax' for cross-port dev
      path: "/",
    };

    // Set access token cookie (7 days)
    response.cookie("access_token", tokens.accessToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set refresh token cookie (30 days)
    response.cookie("refresh_token", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
}
