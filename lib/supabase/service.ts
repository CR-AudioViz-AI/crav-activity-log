import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { supabaseUrl } from "@craudioviz/platform-sdk";

if (!process.env.SUPABASE_SERVICE_ROLE) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE environment variable');
}

export const createServiceClient = () =>
  createClient<Database>(
    supabaseUrl(),
    process.env.SUPABASE_SERVICE_ROLE!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
