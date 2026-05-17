import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService, CreateCategoryDto } from './categories.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { Role } from '../../../common/enums/role.enum';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Public() @Get() findAll() { return this.service.findAll(); }
  @Public() @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @ApiBearerAuth() @Post() @Roles(Role.ADMIN)
  create(@Body() dto: CreateCategoryDto) { return this.service.create(dto); }

  @ApiBearerAuth() @Put(':id') @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: Partial<CreateCategoryDto>) { return this.service.update(id, dto); }

  @ApiBearerAuth() @Delete(':id') @Roles(Role.ADMIN)
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
