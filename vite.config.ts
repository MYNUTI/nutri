import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const clarityScript = `(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "xmxois7qx1");`

const GA_ID = 'G-09KBLJZP86'

const gaScript = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { send_page_view: false });`

const trackingScripts = (): Plugin => ({
  name: 'inject-tracking-scripts',
  apply: 'build',
  transformIndexHtml() {
    if (process.env.VERCEL_ENV !== 'production') return []
    return [
      {
        tag: 'script',
        attrs: { type: 'text/javascript' },
        children: clarityScript,
        injectTo: 'head',
      },
      {
        tag: 'script',
        attrs: { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}` },
        injectTo: 'head',
      },
      {
        tag: 'script',
        children: gaScript,
        injectTo: 'head',
      },
    ]
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), trackingScripts()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.nutriuniv.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
