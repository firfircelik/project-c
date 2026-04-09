import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('İstek yöntemi desteklenmiyor.', { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ message: 'Sunucu yapılandırması eksik.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ message: 'Yetkisiz.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const { data: operator } = await supabase
    .from('users')
    .select('id, tenant_id, role')
    .eq('id', user.id)
    .single();

  if (!operator || !['owner', 'admin', 'branch_manager'].includes(operator.role)) {
    return new Response(JSON.stringify({ message: 'Bu işlem için yetkiniz yok.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const payload = await req.json();
  const { email, full_name, role, branch_id, password } = payload || {};
  if (!email || !full_name || !role || !password) {
    return new Response(JSON.stringify({ message: 'Zorunlu alanlar eksik.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name }
  });

  if (createError || !created?.user) {
    return new Response(JSON.stringify({ message: 'Kullanıcı oluşturulamadı.', details: createError?.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: created.user.id,
      tenant_id: operator.tenant_id,
      email,
      password_hash: 'supabase-auth',
      full_name,
      role,
      branch_id: branch_id || null
    });

  if (insertError) {
    return new Response(JSON.stringify({ message: 'Kullanıcı kaydı oluşturulamadı.', details: insertError.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  return new Response(JSON.stringify({ message: 'Kullanıcı oluşturuldu.' }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
});
