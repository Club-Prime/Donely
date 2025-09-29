import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    const issues: string[] = [];
    if (!SUPABASE_URL) issues.push('Missing SUPABASE_URL');
    if (!SERVICE_ROLE_KEY) issues.push('Missing SUPABASE_SERVICE_ROLE_KEY');
    if (issues.length) {
      return new Response(JSON.stringify({ ok: false, issues }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, bucketCount: buckets?.length ?? 0, ts: new Date().toISOString() }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message } ), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
});
