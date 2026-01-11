import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { RegistryPrismaService } from "./registry-prisma.service";
import { PrismaClientManager } from "./prisma-client-manager.service";
import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";
import * as crypto from "crypto";

const execAsync = promisify(exec);

interface CreateTenantDto {
  slug: string;
  name: string;
  plan?: "STARTER" | "BUSINESS" | "ENTERPRISE";
}

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(
    private registryPrisma: RegistryPrismaService,
    private prismaClientManager: PrismaClientManager
  ) {}

  /**
   * Provision new tenant database
   */
  async provisionTenant(data: CreateTenantDto): Promise<string> {
    const { slug, name, plan = "STARTER" } = data;

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new BadRequestException(
        "Slug must contain only lowercase letters, numbers, and hyphens"
      );
    }

    // Check if tenant already exists
    const existing = await this.registryPrisma.tenant.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException(
        `Tenant with slug '${slug}' already exists`
      );
    }

    // Generate database credentials
    const dbName = `nusa_journal_${slug.replace(/-/g, "_")}`;
    const dbUsername = `tenant_${slug.replace(/-/g, "_")}`;
    const dbPassword = this.generateSecurePassword();

    this.logger.log(`Starting provisioning for tenant: ${slug}`);

    // Create tenant record in PROVISIONING status
    const tenant = await this.registryPrisma.tenant.create({
      data: {
        slug,
        name,
        dbHost: process.env.TENANT_DB_HOST || "localhost",
        dbPort: parseInt(process.env.TENANT_DB_PORT || "5432"),
        dbName,
        dbUsername,
        dbPassword: this.encrypt(dbPassword),
        status: "PROVISIONING",
        plan,
      },
    });

    try {
      // Log activity
      await this.logActivity(tenant.id, "PROVISIONING_STARTED", "PENDING");

      // Step 1: Create database
      await this.createDatabase(dbName, dbUsername, dbPassword);
      await this.logActivity(tenant.id, "DATABASE_CREATED", "SUCCESS");

      // Step 2: Run migrations
      await this.runMigrations(tenant);
      await this.logActivity(tenant.id, "MIGRATIONS_COMPLETED", "SUCCESS");

      // Step 3: Seed initial data
      await this.seedTenantDatabase(tenant);
      await this.logActivity(tenant.id, "SEEDING_COMPLETED", "SUCCESS");

      // Update status to ACTIVE
      await this.registryPrisma.tenant.update({
        where: { id: tenant.id },
        data: { status: "ACTIVE" },
      });

      await this.logActivity(tenant.id, "PROVISIONING_COMPLETED", "SUCCESS");

      this.logger.log(`✅ Tenant '${slug}' provisioned successfully`);

      return tenant.id;
    } catch (error) {
      this.logger.error(`Failed to provision tenant '${slug}':`, error);

      // Log error and update status
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.logActivity(
        tenant.id,
        "PROVISIONING_FAILED",
        "FAILED",
        errorMessage
      );

      await this.registryPrisma.tenant.update({
        where: { id: tenant.id },
        data: { status: "SUSPENDED" },
      });

      // Cleanup: Drop database if it was created
      try {
        await this.dropDatabase(dbName, dbUsername);
      } catch (cleanupError) {
        this.logger.error("Cleanup failed:", cleanupError);
      }

      throw error;
    }
  }

  /**
   * Create PostgreSQL database and user
   */
  private async createDatabase(
    dbName: string,
    username: string,
    password: string
  ): Promise<void> {
    this.logger.log(`Creating database: ${dbName}`);

    const masterDbUrl =
      process.env.DATABASE_URL || process.env.REGISTRY_DATABASE_URL;

    if (!masterDbUrl) {
      throw new Error("Master database URL not configured");
    }

    // Create PostgreSQL user
    try {
      await execAsync(
        `PGPASSWORD='${this.getMasterPassword()}' psql -h ${this.getMasterHost()} -U ${this.getMasterUser()} -d postgres -c "CREATE USER ${username} WITH PASSWORD '${password}';"`
      );
      this.logger.log(`Created user: ${username}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (!errorMsg.includes("already exists")) {
        throw error;
      }
      this.logger.warn(`User ${username} already exists, continuing...`);
    }

    // Create database
    try {
      await execAsync(
        `PGPASSWORD='${this.getMasterPassword()}' psql -h ${this.getMasterHost()} -U ${this.getMasterUser()} -d postgres -c "CREATE DATABASE ${dbName} OWNER ${username};"`
      );
      this.logger.log(`Created database: ${dbName}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (!errorMsg.includes("already exists")) {
        throw error;
      }
      this.logger.warn(`Database ${dbName} already exists, continuing...`);
    }

    // Grant privileges
    await execAsync(
      `PGPASSWORD='${this.getMasterPassword()}' psql -h ${this.getMasterHost()} -U ${this.getMasterUser()} -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${username};"`
    );
  }

  /**
   * Run Prisma migrations on tenant database
   */
  private async runMigrations(tenant: any): Promise<void> {
    this.logger.log(`Running migrations for: ${tenant.slug}`);

    await this.registryPrisma.tenant.update({
      where: { id: tenant.id },
      data: { status: "MIGRATING" },
    });

    const dbPassword = this.decrypt(tenant.dbPassword);
    const databaseUrl = `postgresql://${tenant.dbUsername}:${encodeURIComponent(dbPassword)}@${tenant.dbHost}:${tenant.dbPort}/${tenant.dbName}?schema=public`;

    // Run Prisma migrations
    // Run Prisma migrations
    // Ensure we use the same Node version as the running process (bypass npx)
    const nodeExec = process.execPath;
    const prismaCli = require("path").join(
      process.cwd(),
      "node_modules",
      "prisma",
      "build",
      "index.js"
    );

    // Command: node path/to/prisma/build/index.js migrate deploy
    const command = `DATABASE_URL="${databaseUrl}" "${nodeExec}" "${prismaCli}" migrate deploy`;

    this.logger.log(`Executing migration: ${command}`);

    await execAsync(command, {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    this.logger.log(`Migrations completed for: ${tenant.slug}`);
  }

  /**
   * Seed tenant database with initial data
   */
  private async seedTenantDatabase(tenant: any): Promise<void> {
    this.logger.log(`Seeding database for: ${tenant.slug}`);

    // Get tenant Prisma client
    const prisma = await this.prismaClientManager.getClient(tenant.slug);

    // TODO: Seed default Chart of Accounts template
    // TODO: Seed default tax configurations
    // TODO: Create first accounting period

    this.logger.log(`Seeding completed for: ${tenant.slug}`);
  }

  /**
   * Drop database (for cleanup on provisioning failure)
   */
  private async dropDatabase(dbName: string, username: string): Promise<void> {
    this.logger.warn(`Dropping database: ${dbName}`);

    try {
      await execAsync(
        `PGPASSWORD='${this.getMasterPassword()}' psql -h ${this.getMasterHost()} -U ${this.getMasterUser()} -d postgres -c "DROP DATABASE IF EXISTS ${dbName};"`
      );

      await execAsync(
        `PGPASSWORD='${this.getMasterPassword()}' psql -h ${this.getMasterHost()} -U ${this.getMasterUser()} -d postgres -c "DROP USER IF EXISTS ${username};"`
      );
    } catch (error) {
      this.logger.error("Error dropping database:", error);
    }
  }

  /**
   * Log tenant activity
   */
  private async logActivity(
    tenantId: string,
    action: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    await this.registryPrisma.tenantActivity.create({
      data: {
        tenantId,
        action,
        status,
        errorMessage,
      },
    });
  }

  /**
   * Generate secure random password
   */
  private generateSecurePassword(): string {
    return crypto.randomBytes(32).toString("base64").slice(0, 40);
  }

  /**
   * Encrypt password (same as PrismaClientManager)
   */
  private encrypt(text: string): string {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(
      process.env.ENCRYPTION_KEY ||
        "default-key-change-this-in-prod".padEnd(32, "0")
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  }

  /**
   * Decrypt password
   */
  private decrypt(encrypted: string): string {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(
      process.env.ENCRYPTION_KEY ||
        "default-key-change-this-in-prod".padEnd(32, "0")
    );
    const parts = encrypted.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // Helper methods to parse master database URL
  private getMasterHost(): string {
    const url = process.env.REGISTRY_DATABASE_URL || process.env.DATABASE_URL;
    const match = url?.match(/@([^:]+):/);
    return match ? match[1] : "localhost";
  }

  private getMasterUser(): string {
    const url = process.env.REGISTRY_DATABASE_URL || process.env.DATABASE_URL;
    const match = url?.match(/:\/\/([^:]+):/);
    return match ? match[1] : "postgres";
  }

  private getMasterPassword(): string {
    const url = process.env.REGISTRY_DATABASE_URL || process.env.DATABASE_URL;
    const match = url?.match(/:\/\/[^:]+:([^@]+)@/);
    return match ? match[1] : "";
  }
}
