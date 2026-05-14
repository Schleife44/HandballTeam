/**
 * Hnet Proxy Management
 */

const PROXIES = [
  { name: 'Codetabs', getUrl: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, parse: async (res) => await res.text() },
  { name: 'AllOrigins', getUrl: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, parse: async (res) => { const data = await res.json(); return data.contents; } },
  { name: 'CORSProxy.io', getUrl: (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`, parse: async (res) => await res.text() }
];

export const fetchWithProxy = async (url, options = { json: true }) => {
  const cleanUrl = url.replace('webcal://', 'https://').trim();
  let content = null;
  let lastError = null;

  for (const proxy of PROXIES) {
    try {
      console.log(`[Hnet] Trying proxy: ${proxy.name} for ${cleanUrl}`);
      const res = await fetch(proxy.getUrl(cleanUrl));
      
      if (res.status === 403 || res.status === 429) {
        console.warn(`[Hnet] Proxy ${proxy.name} returned ${res.status}. Trying next...`);
        continue;
      }

      if (res.ok) {
        const raw = await proxy.parse(res);
        if (raw && raw.length > 5) {
          content = raw;
          break;
        }
      }
    } catch (err) {
      console.warn(`[Hnet] Proxy ${proxy.name} failed: ${err.message}`);
      lastError = err;
    }
  }

  if (!content) throw new Error(lastError ? `Proxy Error: ${lastError.message}` : "Content could not be loaded.");
  
  if (options.json) {
    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error("Invalid JSON response from proxy.");
    }
  }
  return content;
};
