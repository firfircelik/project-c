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

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ message: 'Sunucu yapılandırması eksik.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const body = await req.json();
  const { full_name, email, phone, company, team_size, message, website, recaptcha_token } = body || {};

  if (website) {
    return new Response(JSON.stringify({ message: 'ok' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  if (!full_name || !email || !phone) {
    return new Response(JSON.stringify({ message: 'Zorunlu alanlar eksik.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET_KEY');
  if (!recaptchaSecret || !recaptcha_token) {
    return new Response(JSON.stringify({ message: 'Doğrulama başarısız.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const verifyResp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${encodeURIComponent(recaptchaSecret)}&response=${encodeURIComponent(recaptcha_token)}`
  });

  const verifyData = await verifyResp.json();
  if (!verifyData.success) {
    return new Response(JSON.stringify({ message: 'Doğrulama başarısız.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const { error } = await supabase
    .from('lead_requests')
    .insert({
      full_name,
      email,
      phone,
      company: company || null,
      team_size: team_size || null,
      message: message || null
    });

  if (error) {
    return new Response(JSON.stringify({ message: 'Talep kaydedilemedi.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  return new Response(JSON.stringify({ message: 'Talebiniz alındı.' }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
});
