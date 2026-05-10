import { IsIn } from 'class-validator';

export class CreateCheckoutDto {
  @IsIn(['GROWTH', 'PRO'])
  planKey: 'GROWTH' | 'PRO';
}
