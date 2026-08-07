// ==========================================
// CLOUDFLARE WORKER - OwoCash Bot Backend
// ==========================================
// Cara pakai:
// 1. Buka workers.cloudflare.com
// 2. Buat Worker baru
// 3. Paste SEMUA kode ini
// 4. Klik "Deploy"
// 5. Copy URL Worker-nya, masukkan ke web panel
// ==========================================

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    const url = new URL(request.url);
    let path = url.pathname;
if (path.includes('/api/worker')) path = path.replace('/api/worker', '/api');
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    };

    // ⚠️ ISI DENGAN DATA MILIKMU (bisa juga lewat Variabel Env di Cloudflare)
    const TOKEN = env.DISCORD_TOKEN || 'MTUzNTMzNTU0Mzc1MDE0MDAxNQ.G_ltio.oUwMy3LN6NulrpSVOTZpo7htvYDlmGwuf-owHQ';
    const CHANNEL_ID = env.CHANNEL_ID || '1533786725657346180';

    // Cek token sudah diisi
    if (TOKEN.includes('MASUKKAN')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Token belum diisi! Edit worker ini atau set Variabel Env DISCORD_TOKEN' 
      }), { headers });
    }

    // --- API: Status Bot ---
    if (path === '/api/status' && request.method === 'GET') {
      try {
        const me = await fetch('https://discord.com/api/v10/users/@me', {
          headers: { 'Authorization': `Bot ${TOKEN}` }
        });
        if (!me.ok) throw new Error('Token invalid');
        const userData = await me.json();
        return new Response(JSON.stringify({ 
          online: true, 
          username: userData.username, 
          botId: userData.id 
        }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ online: false, error: e.message }), { headers });
      }
    }

    // --- API: Kirim Perintah ---
    if (path === '/api/send' && request.method === 'POST') {
      try {
        const body = await request.json();
        const msg = body.command || '';
        if (!msg) return new Response(JSON.stringify({ success: false, error: 'No command' }), { headers });

        const send = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: msg })
        });
        
        if (!send.ok) {
          const err = await send.json();
          return new Response(JSON.stringify({ success: false, error: err.message || 'Gagal kirim' }), { headers });
        }
        
        const sent = await send.json();
        return new Response(JSON.stringify({ success: true, id: sent.id }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { headers });
      }
    }

    // Fallback
    return new Response(JSON.stringify({ error: 'Endpoint tidak ditemukan' }), { status: 404, headers });
  }
};
