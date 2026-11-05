/* El Otro Lado de la Cosa — interacciones del sitio */
(function () {
  'use strict';

  /* ---------- Enlaces de WhatsApp ---------- */
  var waNumber = '59893922846';
  document.querySelectorAll('[data-wa]').forEach(function (link) {
    link.href = 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(link.dataset.wa || '');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('menu');

  function setMenu(open) {
    if (!toggle || !menu) return;
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(!menu.classList.contains('is-open'));
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (event) {
      if (!menu.classList.contains('is-open')) return;
      if (!menu.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setMenu(false);
    });
  }

  /* ---------- Reproductor de radio ---------- */
  var config = window.RADIO_CONFIG || {};
  var audio = document.getElementById('audio');
  var play = document.getElementById('play');
  var status = document.getElementById('radio-status');
  var player = document.getElementById('radio-player');
  var volume = document.getElementById('volume');

  if (!audio || !play || !status || !player) return;

  function setStatus(text) {
    status.textContent = text;
  }

  function setPlaying(playing) {
    player.classList.toggle('is-playing', playing);
    play.setAttribute('aria-pressed', String(playing));
    play.setAttribute('aria-label', playing ? 'Pausar radio en vivo' : 'Reproducir radio en vivo');
  }

  // Volumen inicial (recordado entre visitas, sin romper si el navegador lo bloquea).
  var savedVolume = null;
  try {
    savedVolume = window.localStorage.getItem('eol:volumen');
  } catch (error) {
    savedVolume = null;
  }
  var initialVolume = savedVolume === null ? 0.8 : Number(savedVolume);
  if (!Number.isFinite(initialVolume) || initialVolume < 0 || initialVolume > 1) initialVolume = 0.8;
  audio.volume = initialVolume;
  if (volume) volume.value = String(initialVolume);

  if (volume) {
    volume.addEventListener('input', function () {
      var value = Number(volume.value);
      audio.volume = value;
      try {
        window.localStorage.setItem('eol:volumen', String(value));
      } catch (error) {
        /* almacenamiento no disponible: se ignora */
      }
    });
  }

  var external = document.getElementById('radio-external');
  if (external && typeof config.fallbackUrl === 'string' && config.fallbackUrl.trim()) {
    external.href = config.fallbackUrl.trim();
  }

  // La señal directa es HTTP: se ofrece como último recurso para no romper el
  // contenido mixto del sitio HTTPS.
  var directAdded = false;
  function showDirectLink() {
    if (directAdded || !external) return;
    var url = typeof config.directUrl === 'string' ? config.directUrl.trim() : '';
    if (!url) return;
    var paragraph = external.parentNode;
    if (!paragraph) return;
    var link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Abrir la señal directa';
    link.className = 'radio-direct';
    paragraph.appendChild(document.createTextNode(' También podés '));
    paragraph.appendChild(link);
    paragraph.appendChild(document.createTextNode('.'));
    directAdded = true;
  }

  var streamUrl = typeof config.streamUrl === 'string' ? config.streamUrl.trim() : '';
  var mixedContent = streamUrl.indexOf('http://') === 0 && window.location.protocol === 'https:';

  if (streamUrl && !mixedContent) {
    audio.src = streamUrl;
    audio.load();
    play.disabled = false;
    setStatus('Señal en vivo · tocá play');
  } else if (mixedContent) {
    setStatus('Abrí el reproductor externo para escuchar');
    showDirectLink();
  } else {
    setStatus('Señal próximamente');
  }

  // Un solo flujo para la página, auriculares y controles del sistema.
  var state = 'idle';
  var wantsPlayback = false;
  var attempt = 0;
  var watchdog = null;
  var deadline = 0;
  var connectionTimeout = 15000;
  var session = 'mediaSession' in navigator ? navigator.mediaSession : null;

  function clearWatchdog() {
    window.clearTimeout(watchdog);
    watchdog = null;
    deadline = 0;
  }

  function syncSession(value) {
    if (!session) return;
    try { session.playbackState = value; } catch (error) { /* API parcial */ }
  }

  function updateMetadata() {
    if (!session || typeof window.MediaMetadata !== 'function') return;
    try {
      session.metadata = new window.MediaMetadata({
        title: config.name || 'El Otro Lado de la Cosa',
        artist: 'Radio en vivo · Uruguay',
        album: 'EOL · Estudio & Radio',
        artwork: [96, 128, 192, 256, 384, 512].map(function (size) {
          return {
            src: new URL('assets/radio-cover-' + size + '.png', document.baseURI).href,
            sizes: size + 'x' + size,
            type: 'image/png'
          };
        })
      });
    } catch (error) { /* La radio funciona aunque los metadatos no estén soportados. */ }
  }

  function failPlayback(message) {
    if (!wantsPlayback) return;
    wantsPlayback = false;
    attempt += 1; // Ignorar rechazos de promesas anteriores.
    state = 'error';
    clearWatchdog();
    audio.pause();
    audio.removeAttribute('src');
    audio.load(); // Cancela la conexión que quedó pendiente.
    play.disabled = false;
    setPlaying(false);
    syncSession('paused');
    setStatus(message);
    showDirectLink();
  }

  function watchConnection() {
    if (watchdog !== null || !wantsPlayback) return;
    deadline = Date.now() + connectionTimeout;
    watchdog = window.setTimeout(function () {
      failPlayback('La señal está tardando. Tocá play para reintentar o abrí el reproductor externo.');
    }, connectionTimeout);
  }

  function pausePlayback() {
    wantsPlayback = false;
    attempt += 1;
    state = 'paused';
    clearWatchdog();
    audio.pause();
    play.disabled = !streamUrl || mixedContent;
    setPlaying(false);
    syncSession('paused');
    setStatus('Reproducción pausada');
  }

  function startPlayback() {
    if (!streamUrl || mixedContent || wantsPlayback) return;
    var currentAttempt = ++attempt;
    wantsPlayback = true;
    state = 'connecting';
    clearWatchdog();
    setPlaying(false);
    play.disabled = true;
    setStatus('Conectando con la radio…');
    updateMetadata();
    syncSession('paused');
    watchConnection();
    try {
      // Reabrir el stream evita retomar audio viejo después de una pausa larga.
      audio.src = streamUrl;
      audio.load();
      var playback = audio.play();
      if (playback && typeof playback.catch === 'function') {
        playback.catch(function () {
          if (currentAttempt !== attempt || !wantsPlayback) return;
          failPlayback('No pudimos conectar. Tocá play para reintentar o probá el reproductor externo.');
        });
      }
    } catch (error) {
      failPlayback('No pudimos conectar. Tocá play para reintentar o probá el reproductor externo.');
    }
  }

  play.addEventListener('click', function () {
    if (wantsPlayback) pausePlayback();
    else startPlayback();
  });

  audio.addEventListener('playing', function () {
    if (!wantsPlayback) { audio.pause(); return; }
    clearWatchdog();
    state = 'playing';
    play.disabled = false;
    setPlaying(true);
    syncSession('playing');
    setStatus('Escuchando en vivo');
  });

  audio.addEventListener('pause', function () {
    // load() puede emitir pause al reiniciar; no cancelar el nuevo intento.
    if (wantsPlayback && audio.paused && state !== 'connecting') pausePlayback();
  });

  function buffering() {
    if (!wantsPlayback) return;
    if (state !== 'connecting') state = 'buffering';
    setStatus('Reconectando con la señal…');
    watchConnection();
  }
  audio.addEventListener('waiting', buffering);
  audio.addEventListener('stalled', function () {
    // stalled también puede ocurrir mientras queda audio reproducible en el búfer.
    if (audio.readyState < 3) buffering();
  });
  audio.addEventListener('timeupdate', function () {
    if (wantsPlayback && state === 'buffering' && !audio.paused && audio.readyState >= 3) {
      clearWatchdog();
      state = 'playing';
      setStatus('Escuchando en vivo');
    }
  });
  audio.addEventListener('error', function () {
    failPlayback('Señal no disponible. Tocá play para reintentar o probá el reproductor externo.');
  });
  audio.addEventListener('ended', function () {
    failPlayback('La señal se interrumpió. Tocá play para volver al vivo.');
  });
  document.addEventListener('visibilitychange', function () {
    // Los móviles pueden suspender timers cuando la página queda en segundo plano.
    if (!document.hidden && wantsPlayback && deadline && Date.now() >= deadline) {
      failPlayback('La conexión se agotó. Tocá play para volver al vivo.');
    }
  });

  if (session) {
    function handle(action, callback) {
      try { session.setActionHandler(action, callback); } catch (error) { /* Acción no soportada */ }
    }
    handle('play', startPlayback);
    handle('pause', pausePlayback);
    handle('stop', function () {
      pausePlayback();
      audio.removeAttribute('src');
      audio.load();
      syncSession('none');
    });
    // Es una señal en vivo: no simular pistas, duración ni desplazamiento temporal.
    ['seekbackward', 'seekforward', 'seekto', 'previoustrack', 'nexttrack'].forEach(function (action) {
      handle(action, null);
    });
  }
})();
