const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data, error } = await supabase.from('vehicles').select('status');
  console.log("Vehicles statuses:", [...new Set(data?.map(v => v.status) || [])]);
  
  const { data: pData } = await supabase.from('payments').select('created_at').limit(1);
  console.log("Payment dates:", pData);
}
test();
