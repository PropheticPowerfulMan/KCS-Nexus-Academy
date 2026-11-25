const CACHE_NAME='kcs-academy-live-v6-native-leadership';
const assets=['/manifest.webmanifest','/nexus-app-icon.svg','/kcs.jpg','/pwa-192.png','/pwa-512.png','/apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(assets)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('kcs-academy-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==location.origin||event.request.mode==='navigate'||url.pathname.startsWith('/api/'))return;
 if(!assets.includes(url.pathname)&&!url.pathname.startsWith('/_next/static/')&&!url.pathname.startsWith('/library/'))return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok&&!/private|no-store/i.test(response.headers.get('cache-control')||'')){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(c=>c.put(event.request,copy)))}return response}).catch(()=>caches.match(event.request).then(r=>r||Response.error())));
});
