import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import {
  createResponse,
  createPaginatedResponse,
} from '../../common/interfaces/api-response.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  async create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateUserDto,
  ) {
    const user = await this.userService.create(currentUser.organizationId, dto);
    return createResponse(user);
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() query: PaginationDto,
  ) {
    const { users, total, page, limit } = await this.userService.findAll(
      currentUser.organizationId,
      query,
    );
    return createPaginatedResponse(users, total, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    const user = await this.userService.findById(
      currentUser.organizationId,
      id,
    );
    return createResponse(user);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle user active status' })
  async toggleActive(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
  ) {
    const user = await this.userService.toggleActive(
      currentUser.organizationId,
      id,
    );
    return createResponse(user);
  }
}
