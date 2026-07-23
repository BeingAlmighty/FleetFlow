import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, area } = body;
    if (!name || !email || !password || !phone || !area) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: name },
      app_metadata: { role: 'hubmanager' }
    });
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
    const userId = authData.user.id;
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: userId,
          role: 'hubmanager',
          full_name: name,
          phone: phone,
          area: area
        }
      ]);
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: 'Hub Manager created successfully', id: userId });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
