import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class InviteUserDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsIn(['ADMIN', 'STAFF'])
  role: 'ADMIN' | 'STAFF';

  @IsString()
  @MinLength(6)
  password: string;
}
