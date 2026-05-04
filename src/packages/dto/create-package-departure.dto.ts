import { IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePackageDepartureDto {
  @IsDateString()
  departureDate: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quota: number;
}
