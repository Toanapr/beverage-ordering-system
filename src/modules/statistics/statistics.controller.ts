import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { StatisticsService } from './statistics.service';
import { AdminStatisticsResponseDto } from './dto/responses/admin-statistics-response.dto';
import { AdminTrendsQueryDto } from './dto/queries/admin-trends-query.dto';
import { AdminTopStoresQueryDto } from './dto/queries/top-stores-query.dto';
import { AdminTopProductsQueryDto } from './dto/queries/top-products-query.dto';
import { DateRangeQueryDto } from './dto/queries/date-range-query.dto';
import { AdminTrendItemDto } from './dto/responses/admin-trends-response.dto';
import { TopStoreItemDto } from './dto/responses/top-stores-response.dto';
import { TopProductItemDto } from './dto/responses/top-products-response.dto';
import {
  GetAdminStatisticsSwagger,
  GetAdminTrendsSwagger,
  GetTopStoresSwagger,
  GetTopProductsSwagger,
  GetOrderStatusDistributionSwagger,
} from './decorators';

@ApiTags('Statistics')
@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @GetAdminStatisticsSwagger()
  getAdminStatistics(): Promise<AdminStatisticsResponseDto> {
    return this.statisticsService.getAdminStatistics();
  }

  @Get('admin/trends')
  @Roles(UserRole.ADMIN)
  @GetAdminTrendsSwagger()
  getAdminTrends(
    @Query() query: AdminTrendsQueryDto,
  ): Promise<AdminTrendItemDto[]> {
    return this.statisticsService.getAdminTrends(query);
  }

  @Get('admin/top-stores')
  @Roles(UserRole.ADMIN)
  @GetTopStoresSwagger()
  getTopStores(
    @Query() query: AdminTopStoresQueryDto,
  ): Promise<TopStoreItemDto[]> {
    return this.statisticsService.getTopStores(query);
  }

  @Get('admin/top-products')
  @Roles(UserRole.ADMIN)
  @GetTopProductsSwagger()
  getTopProducts(
    @Query() query: AdminTopProductsQueryDto,
  ): Promise<TopProductItemDto[]> {
    return this.statisticsService.getTopProducts(query);
  }

  @Get('admin/order-status')
  @Roles(UserRole.ADMIN)
  @GetOrderStatusDistributionSwagger()
  getOrderStatusDistribution(
    @Query() query: DateRangeQueryDto,
  ): Promise<Record<string, number>> {
    return this.statisticsService.getOrderStatusDistribution(query);
  }
}
