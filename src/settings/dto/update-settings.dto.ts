import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSettingsDto {
  // ── Branding ──────────────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(120)
  agencyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  agencyTag?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string; // base64 data URL

  // ── Contact ───────────────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  email?: string;

  // ── Appearance ────────────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'primaryColor must be a valid hex colour (e.g. #1F4E4A)' })
  primaryColor?: string;

  // ── Invoice notes ─────────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  termsAndConditions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  refundPolicy?: string;

  // ── Payment instructions ──────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bankAccountHolder?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bankNotes?: string;

  // ── PDF Template ──────────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  @IsIn(['classic', 'modern', 'premium'])
  pdfTemplate?: string;

  // ── MOTAC ─────────────────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  @MaxLength(50)
  motacLicenseNumber?: string;

  @IsOptional()
  @IsDateString()
  motacExpiryDate?: string;

  // ── SST ───────────────────────────────────────────────────────────────────
  @IsOptional()
  @IsBoolean()
  sstEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  defaultSstRate?: number;
}
