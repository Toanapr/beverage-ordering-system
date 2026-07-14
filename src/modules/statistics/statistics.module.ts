import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { I_STATISTICS_REPOSITORY } from './repositories/statistics-repository.interface';
import { StatisticsRepository } from './repositories/statistics-repository';

@Module({
  controllers: [StatisticsController],
  providers: [
    StatisticsService,
    {
      provide: I_STATISTICS_REPOSITORY,
      useClass: StatisticsRepository,
    },
  ],
})
export class StatisticsModule {}
