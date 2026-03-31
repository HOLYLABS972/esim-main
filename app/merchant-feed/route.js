import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getCountryName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
  } catch { return code; }
}

function escXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET() {
  const baseUrl = 'https://roamjet.net';
  
  // Fetch all active country plans
  let plans = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('dataplans')
      .select('id, name, data, data_amount_mb, validity_days, price_usd, country_code, operator')
      .eq('is_active', true)
      .eq('plan_type', 'country')
      .order('country_code')
      .order('price_usd')
      .range(offset, offset + limit - 1);
    
    if (error) break;
    plans = plans.concat(data || []);
    if (!data || data.length < limit) break;
    offset += limit;
  }

  // Build XML feed
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>RoamJet eSIM Plans</title>
<link>${baseUrl}</link>
<description>Prepaid eSIM data plans for 190+ countries. Instant activation, no physical SIM needed.</description>
`;

  for (const plan of plans) {
    const country = getCountryName(plan.country_code);
    const gb = plan.data_amount_mb >= 1024
      ? `${(plan.data_amount_mb / 1024).toFixed(plan.data_amount_mb % 1024 === 0 ? 0 : 1)} GB`
      : `${plan.data_amount_mb} MB`;
    const days = plan.validity_days;
    const price = plan.price_usd;
    const priceTier = price <= 5 ? 'budget' : price <= 15 ? 'mid' : 'premium';

    xml += `<item>
  <g:id>${escXml(plan.id)}</g:id>
  <g:title>${escXml(`${country} eSIM Data Plan - ${gb} / ${days} Days`)}</g:title>
  <g:description>${escXml(`Prepaid eSIM data plan for ${country}. Get ${gb} of mobile data valid for ${days} days. Instant activation, no physical SIM needed. Works with all eSIM-compatible devices.`)}</g:description>
  <g:link>${escXml(`${baseUrl}/esim-plans?country=${plan.country_code.toLowerCase()}`)}</g:link>
  <g:image_link>${baseUrl}/flags/${plan.country_code.toLowerCase()}.svg</g:image_link>
  <g:price>${price.toFixed(2)} USD</g:price>
  <g:availability>in_stock</g:availability>
  <g:condition>new</g:condition>
  <g:brand>RoamJet</g:brand>
  <g:google_product_category>Electronics &gt; Communications &gt; Telephony &gt; Mobile Phone Accessories &gt; SIM Cards</g:google_product_category>
  <g:product_type>eSIM &gt; ${escXml(country)}</g:product_type>
  <g:identifier_exists>no</g:identifier_exists>
  <g:custom_label_0>${escXml(plan.country_code)}</g:custom_label_0>
  <g:custom_label_1>${escXml(gb)}</g:custom_label_1>
  <g:custom_label_2>${days}d</g:custom_label_2>
  <g:custom_label_3>${priceTier}</g:custom_label_3>
  <g:shipping>:::0 USD</g:shipping>
</item>
`;
  }

  xml += `</channel>\n</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
