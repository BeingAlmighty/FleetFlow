const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const { data: vData } = await supabase.from('vehicles').select('*').limit(1);
  const { data: pData } = await supabase.from('profiles').select('*').limit(1);
  const { data: hData } = await supabase.from('hubs').select('*').limit(1);
  console.log("Vehicle 1:", vData);
  console.log("Profile 1:", pData);
  console.log("Hub 1:", hData);
}
test();
