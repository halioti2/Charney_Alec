import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

async function run() {
  // sign in the demo user silently
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: process.env.VITE_DEMO_EMAIL,
    password: process.env.VITE_DEMO_PASSWORD,
  });
  if (loginError) {
    console.error('Login failed:', loginError);
    process.exit(1);
  }

  // should succeed
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .limit(1);
  console.log('Authenticated select:', { error, rows: data?.length ?? 0 });

  // logout
  await supabase.auth.signOut();

  // should now fail with an RLS error
  const { error: anonError } = await supabase
    .from('transactions')
    .select('*')
    .limit(1);
  console.log('Anon select (expected failure):', anonError?.message);
}

run();
