export const config = { runtime: 'edge' };

export default async function(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  const TOKEN = process.env.DISCORD_TOKEN ?? '';
  const CHANNEL_ID = process.env.CHANNEL_ID ?? '';
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const url = new URL(request.url);
  let path = url.pathname;
  
  // Fix endpoint path untuk Vercel
  if (path.includes('/api/worker')) {
    path = path.replace('/api/worker', '/api');
  }

  if (!TOKEN || !CHANNEL_ID) {
    return new Response(JSON.stringify({ success: false, error: 'Set DISCORD_TOKEN & CHANNEL_ID di Vercel Env Vars' }), { headers: corsHeaders });
  }

  if (path === '/api/status') {
    try {
      const me = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { 'Authorization': `Bot ${TOKEN}` }
      });
      if (!me.ok) throw new Error('Token invalid');
      const u = await me.json();
      return new Response(JSON.stringify({ online: true, username: u.username, botId: u.id }), { headers: corsHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ online: false, error: e.message }), { headers: corsHeaders });
    }
  }

  if (path === '/api/send' && request.method === 'POST') {
    try {
      const body = await request.json();
      const msg = body.command || '';
      if (!msg) return new Response(JSON.stringify({ success: false, error: 'No command' }), { headers: corsHeaders });

      const send = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg })
      });

      if (!send.ok) {
        const err = await send.json().catch(() => ({}));
        return new Response(JSON.stringify({ success: false, error: err.message || `HTTP ${send.status}` }), { headers: corsHeaders });
      }

      const sent = await send.json();
      return new Response(JSON.stringify({ success: true, id: sent.id }), { headers: corsHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), { headers: corsHeaders });
    }
  }

  return new Response(JSON.stringify({ error: 'Endpoint tidak ditemukan' }), { status: 404, headers: corsHeaders });
}
