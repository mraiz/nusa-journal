import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Nusa Journal API - Multi-company Accounting System';
  }
}
