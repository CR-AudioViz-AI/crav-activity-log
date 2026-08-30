import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { getErrorMessage, logError, formatApiError } from '@/lib/utils/error-utils';
import { supabaseUrl } from "@craudioviz/platform-sdk";

// Load environment variables
const SUPABASE_URL = supabaseUrl();
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const DEFAULT_ORG_SLUG = process.env.DEFAULT_ORG_SLUG || 'javari';
const DEV_USER_ID = process.env.DEV_USER_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing required environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE:', SUPABASE_SERVICE_ROLE ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seed() {
  console.log('🌱 Starting seed process...\n');

  try {
    // 1. Create organization
    console.log('1️⃣  Creating organization...');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert(
        {
          slug: DEFAULT_ORG_SLUG,
          name: 'CR AudioViz AI',
          metadata: { type: 'default', seeded: true },
        },
        { onConflict: 'slug' }
      )
      .select()
      .single();

    if (orgError) {
      console.error('   ❌ Error creating organization:', orgError.message);
      throw orgError;
    }
    console.log(`   ✅ Organization created: ${org.name} (${org.id})\n`);

    // 2. Create project
    console.log('2️⃣  Creating project...');
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .upsert(
        {
          org_id: org.id,
          slug: 'main',
          name: 'Main Project',
          metadata: { type: 'default', seeded: true },
        },
        { onConflict: 'org_id,slug' }
      )
      .select()
      .single();

    if (projectError) {
      console.error('   ❌ Error creating project:', projectError.message);
      throw projectError;
    }
    console.log(`   ✅ Project created: ${project.name} (${project.id})\n`);

    // 3. Create demo bot
    console.log('3️⃣  Creating demo bot...');
    const ingestKey = `ingest_${randomBytes(32).toString('hex')}`;
    const hmacSecret = `hmac_${randomBytes(32).toString('hex')}`;

    const { data: bot, error: botError } = await supabase
      .from('bots')
      .upsert(
        {
          org_id: org.id,
          project_id: project.id,
          handle: 'jabari',
          display_name: 'Jabari AI Assistant',
          ingest_key: ingestKey,
          hmac_secret: hmacSecret,
          default_tags: ['demo', 'assistant', 'jabari'],
          metadata: { description: 'Demo bot for testing', seeded: true },
        },
        { onConflict: 'org_id,handle', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (botError) {
      console.error('   ❌ Error creating bot:', botError.message);
      throw botError;
    }
    console.log(`   ✅ Bot created: ${bot.display_name} (@${bot.handle})`);
    console.log(`   📝 Ingest Key: ${bot.ingest_key}`);
    console.log(`   🔐 HMAC Secret: ${bot.hmac_secret}\n`);

    // 4. Create membership if DEV_USER_ID provided
    if (DEV_USER_ID) {
      console.log('4️⃣  Creating admin membership...');
      const { error: memberError } = await supabase
        .from('members')
        .upsert(
          {
            org_id: org.id,
            user_id: DEV_USER_ID,
            role: 'admin',
          },
          { onConflict: 'org_id,user_id' }
        );

      if (memberError) {
        console.error('   ❌ Error creating membership:', memberError.message);
        throw memberError;
      }
      console.log(`   ✅ Admin membership created for user: ${DEV_USER_ID}\n`);
    } else {
      console.log('4️⃣  ⚠️  Skipping membership creation (no DEV_USER_ID)\n');
      console.log('   💡 To add your user as admin, run:');
      console.log('   export DEV_USER_ID=your-user-uuid && npm run seed\n');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ SEED COMPLETE!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Organization: ${org.name} (${org.slug})`);
    console.log(`Project: ${project.name}`);
    console.log(`Bot: ${bot.display_name} (@${bot.handle})`);
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error: unknown) {
    logError('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
