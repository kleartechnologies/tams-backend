import { IsEmail, IsIn, IsString } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(['ADMIN', 'STAFF'])
  role: 'ADMIN' | 'STAFF';

  @IsString()
  supabaseUserId: string;
}
