import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/auth.guard';
import { JwtUser } from '../auth/jwt.strategy';
import { ServicesService } from './services.service';

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get(':id')
  get(@Req() request: Request & { user: JwtUser }, @Param('id') id: string) {
    return this.services.get(request.user.userId, id);
  }

  @Post(':id/reanalyze')
  reanalyze(@Req() request: Request & { user: JwtUser }, @Param('id') id: string) {
    return this.services.reanalyze(request.user.userId, id);
  }
}
