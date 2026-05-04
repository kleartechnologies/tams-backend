import { IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  agencyName: string;
}
