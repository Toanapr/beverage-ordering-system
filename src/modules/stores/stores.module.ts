import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { StoresService } from './stores.service';
import { StoreRepository } from './repositories/store.repository';
import { I_STORE_REPOSITORY } from './repositories/store-repository.interface';
import { StoresController } from './stores.controller';
import { StaffStoresController } from './staff-stores.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Store])],
  controllers: [StoresController, StaffStoresController],
  providers: [
    StoresService,
    { provide: I_STORE_REPOSITORY, useClass: StoreRepository },
  ],
  exports: [StoresService],
})
export class StoresModule {}
