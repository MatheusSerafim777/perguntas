export function publicConfig(env) {
  const url = (env.SUPABASE_URL || '').trim();
  const key = (env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || '').trim();
  if (!url && !key) return { url: '', key: '' };
  if (!url || !key) throw new Error('Defina SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY juntos.');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co') || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new Error('SUPABASE_URL deve ser a URL HTTPS do projeto em supabase.co.');
  }
  let isAnon = false;
  try { isAnon = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; } catch { /* New keys are not JWTs. */ }
  if (!/^sb_publishable_[\w-]+$/.test(key) && !isAnon) {
    throw new Error('Use somente a chave publicável ou anon. Chaves secretas/service_role não podem ser publicadas.');
  }
  return { url: parsed.origin, key };
}
