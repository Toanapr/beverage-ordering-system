import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/role.enum';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { QueryStoreDto } from './dto/query-store.dto';
import {
    CreateStoreSwagger,
    UpdateStoreSwagger,
    ListStoreSwagger,
    GetStoreSwagger,
    LockStoreSwagger,
    UnlockStoreSwagger,
} from './decorators';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
    constructor(private readonly storesService: StoresService) { }

    @Get()
    @ListStoreSwagger()
    findAll(@Query() query: QueryStoreDto) {
        return this.storesService.findPublicList(query);
    }

    @Get(':id')
    @GetStoreSwagger()
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.storesService.findPublicOneOrThrow(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @CreateStoreSwagger()
    create(@Body() dto: CreateStoreDto) {
        return this.storesService.create(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @UpdateStoreSwagger()
    update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStoreDto) {
        return this.storesService.update(id, dto);
    }

    @Patch(':id/lock')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @LockStoreSwagger()
    lock(@Param('id', ParseUUIDPipe) id: string) {
        return this.storesService.lock(id);
    }

    @Patch(':id/unlock')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @UnlockStoreSwagger()
    unlock(@Param('id', ParseUUIDPipe) id: string) {
        return this.storesService.unlock(id);
    }
}
