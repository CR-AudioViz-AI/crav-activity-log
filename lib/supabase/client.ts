import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { publishableKey, supabaseUrl } from "@craudioviz/platform-sdk";

export const createClient = () =>
  createSupabaseClient<Database>(
    supabaseUrl(),
    publishableKey()
  );
