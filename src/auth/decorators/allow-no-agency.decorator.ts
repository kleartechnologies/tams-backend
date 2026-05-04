import { SetMetadata } from '@nestjs/common';

export const ALLOW_NO_AGENCY_KEY = 'allowNoAgency';
export const AllowNoAgency = () => SetMetadata(ALLOW_NO_AGENCY_KEY, true);
