import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryRepository } from './repositories/category.repository';
import { I_CATEGORY_REPOSITORY } from './repositories/category-repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    { provide: I_CATEGORY_REPOSITORY, useClass: CategoryRepository },
  ],
})
export class CategoriesModule {}
