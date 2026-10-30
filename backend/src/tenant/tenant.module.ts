import {
  Global,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../roles/entities/roles.entity';
import { Users } from '../users/entities/user.entity';
import { Commune } from './entities/commune.entity';
import { Journal } from './entities/journal.entity';
import { JournalMember } from './entities/journal-member.entity';
import { JournalAccessGuard } from './journal-access.guard';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';
import { MembershipService } from './membership.service';
import { PlatformAdminGuard } from './platform-admin.guard';
import { TenantContext } from './tenant.context';
import { TenantInsertSubscriber } from './tenant-insert.subscriber';
import { TenantMiddleware } from './tenant.middleware';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Journal, Commune, JournalMember, Users, Role]),
  ],
  controllers: [JournalController],
  providers: [
    TenantContext,
    MembershipService,
    JournalService,
    PlatformAdminGuard,
    TenantInsertSubscriber,
    { provide: APP_GUARD, useClass: JournalAccessGuard },
  ],
  exports: [TenantContext, MembershipService, JournalService],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
