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

  const { data: jobs } = await supabase
    .from('portal_publish_jobs')
    .select('id, portal, listing_id')
    .eq('tenant_id', userRow.tenant_id)
    .eq('status', 'queued');

  if (!jobs || jobs.length === 0) {
    return new Response(JSON.stringify({ message: 'Kuyruk boş.' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }

  // Burada gerçek portal entegrasyonu olacak
  for (const job of jobs) {
    await supabase
      .from('portal_publish_jobs')
      .update({ status: 'sent', message: 'Simule edildi' })
      .eq('id', job.id);
  }

  return new Response(JSON.stringify({ message: `${jobs.length} iş işlendi.` }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
});
