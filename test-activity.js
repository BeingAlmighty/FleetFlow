const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data, error } = await supabase.from('payments')
    .select('id, amount, payment_mode, created_at, drivers(name), profiles(full_name, area)')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

test();
