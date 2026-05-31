import { Controller } from '@nestjs/common';
import { RoleService } from './roles.service';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}
}
