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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { portal } = await req.json();
  const authHeader = req.headers.get('Authorization') || '';

  const { data: userData } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  const userId = userData?.user?.id;
  if (!userId) {
    return new Response(JSON.stringify({ message: 'Yetkisiz.' }), { status: 401, headers: corsHeaders });
  }

  const { data: userRow } = await supabase.from('users').select('tenant_id').eq('id', userId).single();
  if (!userRow?.tenant_id) {
    return new Response(JSON.stringify({ message: 'Tenant bulunamadı.' }), { status: 404, headers: corsHeaders });
  }

  const { data: cred } = await supabase
    .from('portal_credentials')
    .select('*')
    .eq('tenant_id', userRow.tenant_id)
    .eq('portal', portal)
    .single();

  if (!cred) {
    return new Response(JSON.stringify({ message: 'Portal bilgileri bulunamadı.' }), { status: 404, headers: corsHeaders });
  }

  // Basit doğrulama: API endpoint veya feed URL var mı?
  const isValid = cred.integration_type === 'api'
    ? !!cred.endpoint_url
    : cred.integration_type === 'feed'
    ? !!cred.feed_url
    : !!cred.feed_url && !!cred.username && !!cred.password;

  const status = isValid ? 'verified' : 'disabled';
  await supabase
    .from('portal_credentials')
    .update({ status, last_verified_at: new Date().toISOString() })
    .eq('id', cred.id);

  return new Response(JSON.stringify({ message: isValid ? 'Doğrulama başarılı.' : 'Doğrulama başarısız.' }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
});
