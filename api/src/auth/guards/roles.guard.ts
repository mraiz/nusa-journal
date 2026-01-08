import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // Check Tenant Context first
    if (request.tenantPrisma) {
       const tenantPrisma = request.tenantPrisma;
       
       // Find user in tenant DB by email
       // We use email because ID might differ between Registry and Tenant
       const tenantUser = await tenantPrisma.user.findUnique({
         where: { email: user.email },
       });

       if (!tenantUser) {
         // User not found in this tenant
         console.warn(`[RolesGuard] User ${user.email} not found in tenant DB`);
         return false;
       }

       // Check CompanyUser membership
       const membership = await tenantPrisma.companyUser.findFirst({
         where: {
           userId: tenantUser.id,
           status: 'APPROVED',
         },
       });

       if (!membership) {
         console.warn(`[RolesGuard] User ${user.email} found but has no active membership`);
         return false;
       }

       // Check if role matches
       const hasTenantRole = requiredRoles.includes(membership.role);
       if (!hasTenantRole) {
          console.warn(`[RolesGuard] User ${user.email} has role ${membership.role}, required: ${requiredRoles}`);
       }
       return hasTenantRole;
    }

    // Global Context fallback
    if (!user.roles) {
       throw new ForbiddenException('Access denied');
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
