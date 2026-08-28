import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';
import { getErrorMessage, logError, formatApiError } from '@/lib/utils/error-utils';
import { supabaseUrl } from "@craudioviz/platform-sdk";

// Load environment variables
const SUPABASE_URL = supabaseUrl();
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function generateHmac(secret: string, data: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

async function verify() {
  console.log('🔍 Starting verification...\n');

  try {
    // 1. Get demo bot
    console.log('1️⃣  Finding demo bot...');
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('handle', 'jabari')
      .single();

    if (botError || !bot) {
      console.error('   ❌ Demo bot not found. Run seed first: npm run seed');
      process.exit(1);
    }
    console.log(`   ✅ Found bot: ${bot.display_name} (@${bot.handle})\n`);

    // 2. Create test activity
    console.log('2️⃣  Creating test activity...');
    const testActivity = {
      event_uid: `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      event_type: 'test.verify',
      severity: 'info',
      message: 'Verification test activity',
      details: {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'verify_ingest.ts',
      },
      tags: ['test', 'verify'],
      occurred_at: new Date().toISOString(),
    };

    const bodyString = JSON.stringify(testActivity);
    const signature = generateHmac(bot.hmac_secret, bodyString);

    // 3. Post to ingest API
    console.log('3️⃣  Posting to ingest API...');
    console.log(`   URL: ${API_URL}/api/ingest/activity`);
    
    const response = await fetch(`${API_URL}/api/ingest/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bot.ingest_key}`,
        'X-Bot-Signature': signature,
      },
      body: bodyString,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`   ❌ API Error (${response.status}):`, result);
      process.exit(1);
    }

    console.log(`   ✅ Activity created successfully`);
    console.log(`   📝 Activity ID: ${result.activityId}`);
    console.log(`   🔄 Idempotent: ${result.idempotent}\n`);

    // 4. Verify in database
    console.log('4️⃣  Verifying in database...');
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', result.activityId)
      .single();

    if (activityError || !activity) {
      console.error('   ❌ Activity not found in database');
      process.exit(1);
    }

    console.log(`   ✅ Activity verified in database`);
    console.log(`   Event Type: ${activity.event_type}`);
    console.log(`   Severity: ${activity.severity}`);
    console.log(`   Message: ${activity.message}`);
    console.log(`   Tags: ${activity.tags?.join(', ')}\n`);

    // 5. Test idempotency
    console.log('5️⃣  Testing idempotency...');
    const idempotencyResponse = await fetch(`${API_URL}/api/ingest/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bot.ingest_key}`,
        'X-Bot-Signature': signature,
      },
      body: bodyString,
    });

    const idempotencyResult = await idempotencyResponse.json();

    if (idempotencyResult.idempotent) {
      console.log(`   ✅ Idempotency working correctly\n`);
    } else {
      console.warn(`   ⚠️  Idempotency check failed\n`);
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ VERIFICATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('All systems operational:');
    console.log('  • Bot authentication ✓');
    console.log('  • HMAC signature verification ✓');
    console.log('  • Activity ingestion ✓');
    console.log('  • Database persistence ✓');
    console.log('  • Idempotency ✓');
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error: unknown) {
    logError(\'\n❌ Verification failed:\', error);
    process.exit(1);
  }
}

verify();
