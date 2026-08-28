import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './types';
import { publishableKey, supabaseUrl } from "@craudioviz/platform-sdk";

export const createClient = () => {
  const cookieStore = cookies();
  
  return createSupabaseClient<Database>(
    supabaseUrl(),
    publishableKey(),
    {
      auth: {
        storage: {
          getItem: (key: string) => {
            return cookieStore.get(key)?.value ?? null;
          },
          setItem: (key: string, value: string) => {
            try {
              cookieStore.set(key, value);
            } catch {}
          },
          removeItem: (key: string) => {
            try {
              cookieStore.delete(key);
            } catch {}
          },
        },
      },
    }
  );
};
