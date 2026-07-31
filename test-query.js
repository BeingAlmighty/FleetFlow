const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  console.log("Testing payments query...");
  const { data, error } = await supabase.from('payments')
    .select('id, amount, payment_mode, created_at, drivers(name), profiles(full_name, area)')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("SUCCESS");
  }
}

test();
