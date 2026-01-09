import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenancyModule } from './tenancy/tenancy.module';
import { TenantMiddleware } from './tenancy/tenant.middleware';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { AccountModule } from './account/account.module';
import { JournalModule } from './journal/journal.module';
import { PeriodModule } from './period/period.module';
import { LedgerModule } from './ledger/ledger.module';
import { ReportModule } from './report/report.module';
import { ProductModule } from './product/product.module';
import { CustomerModule } from './customer/customer.module';
import { VendorModule } from './vendor/vendor.module';
import { SalesModule } from './sales/sales.module';
import { PurchaseModule } from './purchase/purchase.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TenancyModule,
    AuthModule,
    CompanyModule,
    AccountModule,
    JournalModule,
    PeriodModule,
    LedgerModule,
    ReportModule,
    ProductModule,
    CustomerModule,
    VendorModule,
    SalesModule,
    PurchaseModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant middleware to all routes except health and auth
    consumer
      .apply(TenantMiddleware)
      .exclude('health', 'auth/(.*)', 'companies')
      .forRoutes('*');
  }
}
