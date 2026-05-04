import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsNotEmpty,
  Length,
} from 'class-validator';
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  @Length(12, 12, { message: 'IC number must be exactly 12 digits' })
  icNumber?: string;

  @IsOptional()
  @IsString()
  passportNumber?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
