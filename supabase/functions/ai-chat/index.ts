import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

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

  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ message: 'AI anahtarı bulunamadı.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ message: 'Sunucu yapılandırması eksik.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
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

  const { data: userRow } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userRow?.tenant_id) {
    return new Response(JSON.stringify({ message: 'Tenant bulunamadı.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const body = await req.json();
  const { prompt, system, model } = body || {};
  if (!prompt) {
    return new Response(JSON.stringify({ message: 'Prompt zorunludur.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const models = model
    ? [model]
    : [
        'meta-llama/llama-3.2-3b-instruct:free',
        'google/gemma-3-4b-it:free',
        'openai/gpt-oss-20b:free'
      ];

  let lastError = '';

  for (const selectedModel of models) {
    const payload = {
      model: selectedModel,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 500,
    };

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://emlakcrm.local',
        'X-Title': 'EmlakCRM Pro'
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      lastError = await resp.text();
      continue;
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ message: content, model: selectedModel }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  return new Response(JSON.stringify({ message: 'AI isteği başarısız.', details: lastError }), {
    status: 500,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
});
