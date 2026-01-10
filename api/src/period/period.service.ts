import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from "@nestjs/common";
import { TenantPrismaService } from "../tenancy/tenant-prisma.service";
import { CreatePeriodDto } from "./dto/create-period.dto";

@Injectable()
export class PeriodService {
  private readonly logger = new Logger(PeriodService.name);

  constructor(private tenantPrisma: TenantPrismaService) {}

  /**
   * Create new accounting period
   */
  async createPeriod(dto: CreatePeriodDto) {
    const company = await this.tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException("Company not found");
    }

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (startDate >= endDate) {
      throw new BadRequestException("Start date must be before end date");
    }

    // Check for overlapping periods
    const overlapping = await this.tenantPrisma.accountingPeriod.findFirst({
      where: {
        companyId: company.id,
        OR: [
          {
            // New period starts within existing period
            startDate: { lte: startDate },
            endDate: { gte: startDate },
          },
          {
            // New period ends within existing period
            startDate: { lte: endDate },
            endDate: { gte: endDate },
          },
          {
            // New period completely contains existing period
            startDate: { gte: startDate },
            endDate: { lte: endDate },
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException(
        `Period overlaps with existing period: ${overlapping.name} (${overlapping.startDate.toISOString().split("T")[0]} - ${overlapping.endDate.toISOString().split("T")[0]})`
      );
    }

    // Create period (default status: OPEN)
    try {
      const period = await this.tenantPrisma.accountingPeriod.create({
        data: {
          companyId: company.id,
          name: dto.name,
          startDate,
          endDate,
          status: "OPEN",
        },
      });

      this.logger.log(
        `Period created: ${period.name} (${period.startDate.toISOString().split("T")[0]} - ${period.endDate.toISOString().split("T")[0]})`
      );

      return {
        id: period.id,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
        createdAt: period.createdAt,
      };
    } catch (error: any) {
      // Handle unique constraint violation (duplicate period name)
      if (error.code === "P2002") {
        throw new BadRequestException(
          `Periode dengan nama "${dto.name}" sudah ada. Gunakan nama yang berbeda.`
        );
      }
      throw error;
    }
  }

  /**
   * Get all periods
   */
  async getPeriods(query?: import("./dto/get-periods.dto").GetPeriodsDto) {
    const company = await this.tenantPrisma.company.findFirst();
    if (!company) {
      throw new NotFoundException("Company not found");
    }

    const where: any = {
      companyId: company.id,
    };

    if (query?.year) {
      const year = parseInt(query.year);
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      where.startDate = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    const periods = await this.tenantPrisma.accountingPeriod.findMany({
      where,
      include: {
        _count: {
          select: {
            journals: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return periods.map((period) => ({
      id: period.id,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
      journalCount: period._count.journals,
      createdAt: period.createdAt,
      updatedAt: period.updatedAt,
    }));
  }

  /**
   * Get period by ID
   */
  async getPeriod(id: string) {
    const period = await this.tenantPrisma.accountingPeriod.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            journals: true,
          },
        },
        journals: {
          select: {
            id: true,
            journalNumber: true,
            date: true,
            description: true,
          },
          orderBy: {
            date: "desc",
          },
          take: 10, // Last 10 journals
        },
      },
    });

    if (!period) {
      throw new NotFoundException("Period not found");
    }

    return {
      id: period.id,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
      journalCount: period._count.journals,
      recentJournals: period.journals,
      createdAt: period.createdAt,
      updatedAt: period.updatedAt,
    };
  }

  /**
   * Close period (Admin only)
   */
  async closePeriod(id: string) {
    const period = await this.tenantPrisma.accountingPeriod.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            journals: true,
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException("Period not found");
    }

    if (period.status === "CLOSED") {
      throw new BadRequestException("Period is already closed");
    }

    // TODO: Future enhancement - Validate trial balance is balanced before closing

    // Close period
    const updated = await this.tenantPrisma.accountingPeriod.update({
      where: { id },
      data: {
        status: "CLOSED",
      },
    });

    this.logger.log(
      `Period closed: ${updated.name} (${period._count.journals} journals)`
    );

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      journalCount: period._count.journals,
      message:
        "Period closed successfully. No new journals can be posted to this period.",
    };
  }

  /**
   * Reopen period (Admin only)
   */
  async reopenPeriod(id: string) {
    const period = await this.tenantPrisma.accountingPeriod.findUnique({
      where: { id },
    });

    if (!period) {
      throw new NotFoundException("Period not found");
    }

    if (period.status === "OPEN") {
      throw new BadRequestException("Period is already open");
    }

    // Reopen period
    const updated = await this.tenantPrisma.accountingPeriod.update({
      where: { id },
      data: {
        status: "OPEN",
      },
    });

    this.logger.log(`Period reopened: ${updated.name}`);

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      message: "Period reopened successfully. Journals can now be posted.",
    };
  }

  /**
   * Delete period (Admin only, only if no journals)
   */
  async deletePeriod(id: string) {
    const period = await this.tenantPrisma.accountingPeriod.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            journals: true,
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException("Period not found");
    }

    if (period._count.journals > 0) {
      throw new ForbiddenException(
        `Cannot delete period with ${period._count.journals} journal(s). Close the period instead.`
      );
    }

    await this.tenantPrisma.accountingPeriod.delete({
      where: { id },
    });

    this.logger.log(`Period deleted: ${period.name}`);

    return {
      message: "Period deleted successfully",
    };
  }
}
