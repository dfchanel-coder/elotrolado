# El Otro Lado de la Cosa — Estudio & Radio

Sitio web de **El Otro Lado de la Cosa**, un estudio de streaming y radio online con tres estudios, operador incluido y señal 24/7.

El proyecto es un sitio **estático** (HTML + CSS + JavaScript, sin dependencias ni proceso de build). Todo el contenido publicado vive en la carpeta `dist/`.

## Contenido del sitio

- **Inicio**: presentación del estudio y llamados a la acción.
- **La radio**: reproductor de la señal online 24/7 con control de volumen.
- **El estudio**: equipamiento disponible (OBSBOT, RØDE, Aircraft, NVIDIA RTX 5060, Elgato).
- **Programas**: *Acá la gente habla*, *Café, mate y libertad* y *Zona de Debate*, con enlaces a YouTube e Instagram.
- **Planes**: por hora, por espacio y plan mensual.
- **Publicidad**: opciones para anunciar en la radio.
- **Contacto**: WhatsApp y redes sociales.

## Estructura

```
.
├── .openai/
│   └── hosting.json     # Configuración de hosting estático (publica dist/)
├── dist/                # Sitio publicado
│   ├── index.html       # Página única
│   ├── style.css        # Estilos
│   ├── app.js           # Reproductor de radio y enlaces de WhatsApp
│   ├── config.js        # Configuración editable (URL del stream)
│   └── assets/
│       └── programas.png
└── README.md
```

## Ver el sitio en local

Al ser estático, alcanza con servir la carpeta `dist/`. Abrir `index.html` con doble clic también funciona, pero un servidor local reproduce el comportamiento real.

Con Python:

```bash
python -m http.server 8000 --directory dist
```

Con Node.js:

```bash
npx serve dist
```

Luego abrir <http://localhost:8000>.

## Configuración

### Radio online

El reproductor se activa cuando se define la URL del stream en `dist/config.js`:

```js
window.RADIO_CONFIG = {
  streamUrl: 'https://tu-servidor.com/stream.mp3', // MP3 o AAC por HTTPS
  name: 'El Otro Lado de la Cosa'
};
```

Mientras `streamUrl` esté vacío, el botón de reproducción queda deshabilitado y se muestra "Señal próximamente".

### WhatsApp

Los botones con el atributo `data-wa` arman automáticamente el enlace a WhatsApp con un mensaje precargado (ver `dist/app.js`). El número está definido en ese mismo archivo.

### Redes y enlaces externos

Instagram, YouTube y TikTok están enlazados directamente en `dist/index.html`.

## Despliegue

La carpeta publicada es `dist/`, tal como indica `.openai/hosting.json`.

### GitHub Pages (automático)

Cada push a `main` dispara el workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml), que publica `dist/` en GitHub Pages. No hay compilación: se sube la carpeta tal cual.

- Sitio: <https://dfchanel-coder.github.io/elotrolado/>
- Requisito (una sola vez): en **Settings → Pages → Build and deployment**, la fuente debe ser **GitHub Actions**.

También se puede ejecutar a mano desde **Actions → Deploy to GitHub Pages → Run workflow**.

### Dominio propio

1. En **Settings → Pages → Custom domain** escribir el dominio (por ejemplo `elotroladodelacosa.com`) y guardar. GitHub crea el archivo `CNAME` en la rama de despliegue.
2. Configurar el DNS en el proveedor del dominio:
   - **Dominio raíz** (`elotroladodelacosa.com`): cuatro registros `A` apuntando a `185.199.108.153`, `185.199.109.153`, `185.199.110.153` y `185.199.111.153`.
   - **Subdominio `www`**: un registro `CNAME` apuntando a `dfchanel-coder.github.io`.
   - Opcional, IPv6: registros `AAAA` a `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` y `2606:50c0:8003::153`.
3. Esperar la propagación del DNS y activar **Enforce HTTPS** en la misma pantalla.

El sitio usa rutas relativas, así que funciona igual bajo `usuario.github.io/repositorio/` o bajo un dominio propio.

### Otros hostings

Cualquier hosting estático (Netlify, Vercel, Cloudflare Pages) puede publicar el contenido de `dist/` sin pasos de compilación.

## Licencia

MIT — ver [LICENSE](LICENSE).
