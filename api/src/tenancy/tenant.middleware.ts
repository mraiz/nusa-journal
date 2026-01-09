import { Injectable, NestMiddleware, NotFoundException, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaClientManager } from './prisma-client-manager.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prismaClientManager: PrismaClientManager) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip tenant middleware for certain routes
    const skipRoutes = ['/health', '/auth/register', '/auth/login'];
    if (skipRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    // Extract tenant slug from URL
    // Use originalUrl to be safe against path rewriting/mounting issues
    // Format: /:tenantSlug/rest/of/path
    const rawPath = req.originalUrl.split('?')[0];
    const pathSegments = rawPath.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
      // Allow root path or other non-tenant paths to proceed (handled by other controllers)
      return next();
    }

    const tenantSlug = pathSegments[0];

    // Validate tenant slug format (lowercase, alphanumeric, hyphens)
    if (!/^[a-z0-9-]+$/.test(tenantSlug)) {
      throw new BadRequestException('Invalid tenant slug format');
    }

    try {
      // Get tenant-specific Prisma client
      const tenantPrisma = await this.prismaClientManager.getClient(tenantSlug);

      // Attach to request for use in controllers/services
      (req as any).tenantSlug = tenantSlug;
      (req as any).tenantPrisma = tenantPrisma;

      next();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Tenant '${tenantSlug}' not found or inactive`);
      }
      console.error(`[TenantMiddleware] Error processing tenant '${tenantSlug}':`, error);
      // DEBUG: Return actual error to client
      throw new BadRequestException(`Tenant Middleware Error: ${(error as any).message || error}`);
    }
  }
}
