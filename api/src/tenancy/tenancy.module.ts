import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { RegistryPrismaService } from './registry-prisma.service';
import { PrismaClientManager } from './prisma-client-manager.service';
import { TenantPrismaService } from './tenant-prisma.service';
import { TenantProvisioningService } from './tenant-provisioning.service';

@Global()
@Module({
  providers: [
    RegistryPrismaService,
    PrismaClientManager,
    TenantPrismaService,
    TenantProvisioningService,
  ],
  exports: [
    RegistryPrismaService,
    PrismaClientManager,
    TenantPrismaService,
    TenantProvisioningService,
  ],
})
export class TenancyModule implements OnModuleDestroy {
  constructor(private prismaClientManager: PrismaClientManager) {}

  async onModuleDestroy() {
    // Cleanup all tenant connections on app shutdown
    await this.prismaClientManager.disconnectAll();
  }
}
