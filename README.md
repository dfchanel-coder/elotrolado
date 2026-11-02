# El Otro Lado de la Cosa — Estudio & Radio

Sitio web de **El Otro Lado de la Cosa**, un estudio de streaming y radio online con tres estudios, operador incluido y señal 24/7.

Sitio **estático** (HTML + CSS + JavaScript, sin dependencias ni proceso de build). Todo lo publicado vive en `dist/`.

🔗 **Producción:** <https://dfchanel-coder.github.io/elotrolado/>

## Secciones

- **Inicio**: presentación del estudio, datos rápidos y llamados a la acción.
- **Radio en vivo**: reproductor integrado, señal 24/7 y acceso al reproductor externo.
- **El estudio**: equipamiento (OBSBOT, RØDE, Aircraft, NVIDIA RTX 5060, Elgato).
- **Programas**: *Acá la gente habla*, *Café, mate y libertad* y *Zona de Debate*.
- **Planes**: por hora, por espacio y plan mensual.
- **Publicidad**: espacios para marcas en la radio.
- **Preguntas frecuentes**: contenido visible y marcado como `FAQPage`.
- **Contacto**: WhatsApp y redes.

## Estructura

```
.
├── .github/workflows/deploy-pages.yml   # Despliegue automático a GitHub Pages
├── .openai/hosting.json                 # Hosting estático (publica dist/)
├── dist/
│   ├── index.html                       # Página única (HTML semántico + JSON-LD)
│   ├── style.css                        # Sistema de diseño azul/cyan
│   ├── app.js                           # Radio, menú móvil y enlaces de WhatsApp
│   ├── config.js                        # URL del stream y respaldo
│   ├── site.webmanifest                 # Manifiesto e íconos
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── llms.txt                         # Resumen para motores generativos (GEO/LLMO)
│   ├── .nojekyll
│   ├── .well-known/security.txt
│   ├── assets/                          # Programas, OG image, favicons
│   └── fonts/                           # Barlow Condensed + DM Sans (autoalojadas)
└── README.md
```

## Ver el sitio en local

```bash
python -m http.server 8000 --directory dist
```

Luego abrir <http://localhost:8000>.

## Configuración

### Radio online

En `dist/config.js`:

```js
window.RADIO_CONFIG = {
  streamUrl: 'https://cast1.asurahosting.com/proxy/radiom16/stream',
  fallbackUrl: 'https://cast1.asurahosting.com/start/radiom16/',
  directUrl: 'http://cast1.asurahosting.com:7724/stream',
  name: 'El Otro Lado de la Cosa'
};
```

- `streamUrl` debe ser **HTTPS**: el sitio se publica por HTTPS y el navegador bloquea audio por HTTP (contenido mixto).
- `fallbackUrl` es el enlace HTTPS al reproductor externo que se muestra debajo del reproductor.
- `directUrl` es la señal directa del proveedor. Es HTTP, así que solo se ofrece como último recurso cuando el reproductor falla, para no romper el contenido mixto del sitio.

> **Estado de la señal (AsuraHosting):** el stream actual es **AAC+ de 32 kbps** en `cast1.asurahosting.com:7724`. El proxy SSL oficial (`/proxy/radiom16/stream`) responde **502** porque el proxy de Asura solo trabaja con MP3. Para que el reproductor integrado funcione hay que pedirle a AsuraHosting que habilite el enlace SSL para el stream AAC o cambiar el mount a MP3. Mientras tanto, el enlace externo abre la señal directa.

### WhatsApp

Los elementos con `data-wa` generan el enlace a WhatsApp con mensaje precargado. El número se define en `dist/app.js` (`waNumber`).

### Dominio propio

Al conectar un dominio hay que actualizar la URL absoluta en:

1. `dist/index.html` → `<link rel="canonical">`, `og:url`, `og:image`, `twitter:image` y el JSON-LD.
2. `dist/robots.txt` → línea `Sitemap`.
3. `dist/sitemap.xml` → `<loc>`.
4. `dist/llms.txt` → enlaces.
5. `dist/.well-known/security.txt` → `Canonical`.

## SEO, GEO y LLMO

- Título y descripción únicos, `canonical`, Open Graph y Twitter Cards.
- JSON-LD con `Organization`, `RadioStation`, `WebSite`, `WebPage`, `Service` y `FAQPage`.
- HTML semántico, jerarquía de encabezados y enlaces descriptivos.
- `robots.txt`, `sitemap.xml` y `llms.txt` con datos verificables del estudio.
- Contenido en español (es-UY) pensado para ser citado por buscadores y asistentes.

## Seguridad

- `Content-Security-Policy` restrictiva en meta (sin scripts ni estilos inline, sin orígenes externos salvo el audio).
- `Referrer-Policy: strict-origin-when-cross-origin`.
- Sin dependencias de terceros: fuentes e imágenes autoalojadas, sin analytics.
- Enlaces externos con `rel="noopener noreferrer"`.
- `.well-known/security.txt` para reporte de vulnerabilidades.
- Todo el sitio se sirve por HTTPS.

## Accesibilidad

- Navegación por teclado, enlace "Saltar al contenido" y foco visible.
- Landmarks (`header`, `nav`, `main`, `footer`) y `aria-label` en regiones.
- Reproductor con `aria-pressed`, estado `aria-live` y controles etiquetados.
- Contraste AA, objetivos táctiles de 44 px y `prefers-reduced-motion`.

## Rendimiento

- Fuentes autoalojadas con `preload` y `font-display: swap`.
- Imagen de programas en AVIF/WebP con `srcset` (793 KB → 44 KB).
- CSS y JS propios, sin frameworks ni librerías.
- CLS 0 y TBT 0 ms en Lighthouse.

**Lighthouse (local):** Rendimiento 99 · Accesibilidad 100 · Buenas prácticas 100 · SEO 100.

## Despliegue

Cada push a `main` dispara [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml), que publica `dist/` en GitHub Pages (sin build).

Requisito único: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Dominio propio

1. **Settings → Pages → Custom domain**, escribir el dominio y guardar.
2. DNS:
   - Raíz: registros `A` a `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   - `www`: `CNAME` a `dfchanel-coder.github.io`.
   - Opcional IPv6: `AAAA` a `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.
3. Activar **Enforce HTTPS** (ya está activado en el repositorio).

## Licencia

MIT — ver [LICENSE](LICENSE). Desarrollado por [FB Informática](https://www.fbinformaticauy.com).
