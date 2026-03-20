import { Module } from '@nestjs/common';
import { FreezesController } from './freezes.controller';
import { FreezesService } from './freezes.service';

@Module({
  controllers: [FreezesController],
  providers: [FreezesService],
  exports: [FreezesService],
})
export class FreezesModule {}
