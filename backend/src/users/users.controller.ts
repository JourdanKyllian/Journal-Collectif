import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListQueryDto } from './dto/user-list-query.dto';
import { SetVerificationDto } from './dto/set-verification.dto';

/**
 * Interface représentant la requête HTTP étendue avec les données de l'utilisateur authentifié.
 */
interface RequestWithUser extends ExpressRequest {
  user: {
    userId: number;
    email: string;
    role: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @Post('create')
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() req: RequestWithUser,
  ) {
    const currentUserRole = req.user.role;
    const targetRole = createUserDto.role || 'redacteur';

    // Un admin ne peut créer qu'un rédacteur
    if (
      currentUserRole === 'admin' &&
      ['super_admin', 'admin'].includes(targetRole)
    ) {
      throw new ForbiddenException(
        'Un administrateur ne peut créer que des rédacteurs.',
      );
    }

    return this.usersService.create(createUserDto, targetRole);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @Patch(':id/verification')
  async setVerification(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetVerificationDto,
  ) {
    return this.usersService.setPhoneVerified(id, dto.verified);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @Get('all')
  async findAll(@Query() query: UserListQueryDto) {
    return this.usersService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.update(
      id,
      updateUserDto,
      req.user.role,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.remove(id, req.user.role, req.user.userId);
  }
}
