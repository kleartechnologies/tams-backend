import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAdminService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly client: SupabaseClient<any, 'public', any>;

  constructor(config: ConfigService) {
    this.client = createClient(
      config.getOrThrow('SUPABASE_URL'),
      config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  createAuthUser(params: {
    email: string;
    password: string;
    email_confirm: boolean;
    user_metadata?: Record<string, unknown>;
  }) {
    return this.client.auth.admin.createUser(params);
  }

  deleteAuthUser(userId: string) {
    return this.client.auth.admin.deleteUser(userId);
  }
}
