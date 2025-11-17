import { Module } from '@nestjs/common';
import { PreRankingService } from './preranking.service';
import { ConstraintValidator } from './validators/constraint.validator';
import { SuiModule } from '../sui/sui.module';

@Module({
  imports: [SuiModule],
  providers: [PreRankingService, ConstraintValidator],
  exports: [PreRankingService],
})
export class PreRankingModule {}
