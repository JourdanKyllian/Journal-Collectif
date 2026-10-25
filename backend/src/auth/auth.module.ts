import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { authThrottlerOptions } from './auth.throttle';
import { Users } from '../users/entities/user.entity';
import { Role } from '../roles/entities/roles.entity';
import { Session } from './entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Role, Session]),
    PassportModule,
    ThrottlerModule.forRootAsync({ useFactory: authThrottlerOptions }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
