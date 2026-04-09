import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

type PortalId = 'sahibinden' | 'hepsiemlak' | 'zingat' | 'emlakjet';

function pickPathSegment(pathParts: string[], index: number, fallback: string) {
  return pathParts[index] || fallback;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeListing(listing: any) {
  return {
    code: listing.code || '',
    title: listing.title || '',
    description: listing.description || '',
    type: listing.type || '',
    category: listing.category || '',
    price: listing.price ?? '',
    currency: listing.currency || 'TRY',
    city: listing.location?.il || '',
    district: listing.location?.ilçe || '',
    neighborhood: listing.location?.mahalle || '',
    room: listing.features?.oda || '',
    area: listing.features?.m2 || '',
    buildingAge: listing.features?.binaYasi || '',
    lat: listing.location?.lat ?? '',
    lng: listing.location?.lng ?? '',
    status: listing.status || '',
    createdAt: listing.created_at || '',
  };
}

function mapListing(listing: any, portal: PortalId) {
  const base = normalizeListing(listing);
  switch (portal) {
    case 'sahibinden':
      return {
        ilan_no: base.code,
        baslik: base.title,
        aciklama: base.description,
        fiyat: base.price,
        para_birimi: base.currency,
        ilan_tipi: base.type,
        emlak_tipi: base.category,
        il: base.city,
        ilce: base.district,
        mahalle: base.neighborhood,
        oda_sayisi: base.room,
        m2: base.area,
        bina_yasi: base.buildingAge,
        durum: base.status,
        olusturma_tarihi: base.createdAt,
      };
    case 'hepsiemlak':
      return {
        listing_id: base.code,
        title: base.title,
        description: base.description,
        price: base.price,
        currency: base.currency,
        listing_type: base.type,
        estate_type: base.category,
        city: base.city,
        district: base.district,
        neighborhood: base.neighborhood,
        room: base.room,
        net_area: base.area,
        building_age: base.buildingAge,
        status: base.status,
        created_at: base.createdAt,
      };
    case 'zingat':
      return {
        id: base.code,
        headline: base.title,
        detail: base.description,
        price: base.price,
        currency: base.currency,
        offer_type: base.type,
        property_type: base.category,
        city: base.city,
        town: base.district,
        quarter: base.neighborhood,
        room: base.room,
        area: base.area,
        building_age: base.buildingAge,
        lat: base.lat,
        lng: base.lng,
        status: base.status,
        created_at: base.createdAt,
      };
    case 'emlakjet':
      return {
        emlak_id: base.code,
        title: base.title,
        description: base.description,
        price: base.price,
        currency: base.currency,
        type: base.type,
        category: base.category,
        city: base.city,
        district: base.district,
        neighborhood: base.neighborhood,
        room: base.room,
        area: base.area,
        building_age: base.buildingAge,
        status: base.status,
        created_at: base.createdAt,
      };
    default:
      return base;
  }
}

function buildXml(portal: string, items: Record<string, any>[]) {
  const xmlItems = items.map((item) => {
    const fields = Object.entries(item)
      .map(([key, value]) => `<${key}>${escapeXml(String(value ?? ''))}</${key}>`)
      .join('');
    return `<listing>${fields}</listing>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
  <feed portal="${escapeXml(portal)}">${xmlItems}</feed>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const portalIndex = pathParts.findIndex((part) => part === 'portal-feed');
  const slug = portalIndex >= 0
    ? pickPathSegment(pathParts, portalIndex + 1, '')
    : pickPathSegment(pathParts, 1, '');
  const portal = portalIndex >= 0
    ? pickPathSegment(pathParts, portalIndex + 2, '')
    : pickPathSegment(pathParts, 2, '');
  const formatPart = portalIndex >= 0
    ? pickPathSegment(pathParts, portalIndex + 3, '')
    : pickPathSegment(pathParts, 3, '');
  const format = formatPart.includes('json') ? 'json' : 'xml';
  const token = url.searchParams.get('token');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, settings')
    .eq('slug', slug)
    .single();

  if (!tenant) return new Response('Tenant bulunamadı.', { status: 404, headers: corsHeaders });
  if (!token || token !== tenant.settings?.feed_token) {
    return new Response('Yetkisiz.', { status: 403, headers: corsHeaders });
  }

  if (!slug || !portal) {
    return new Response('Geçersiz istek.', { status: 400, headers: corsHeaders });
  }

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('status', 'aktif');

  const mappedItems = (listings || []).map((listing: any) => mapListing(listing, portal as PortalId));

  if (format === 'json') {
    return new Response(JSON.stringify({ portal, count: mappedItems.length, items: mappedItems }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  const xml = buildXml(portal, mappedItems);
  return new Response(xml, { headers: { 'Content-Type': 'application/xml', ...corsHeaders } });
});
