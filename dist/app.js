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

  var streamUrl = typeof config.streamUrl === 'string' ? config.streamUrl.trim() : '';
  var mixedContent = streamUrl.indexOf('http://') === 0 && window.location.protocol === 'https:';

  if (streamUrl && !mixedContent) {
    audio.src = streamUrl;
    audio.load();
    play.disabled = false;
    setStatus('Señal en vivo · tocá play');
  } else if (mixedContent) {
    setStatus('Abrí el reproductor externo para escuchar');
  } else {
    setStatus('Señal próximamente');
  }

  play.addEventListener('click', function () {
    if (!audio.src) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    setStatus('Conectando con la radio…');
    play.disabled = true;

    var playback = audio.play();
    if (playback && typeof playback.catch === 'function') {
      playback.catch(function () {
        play.disabled = false;
        setPlaying(false);
        setStatus('No pudimos conectar. Probá el reproductor externo.');
      });
    }
  });

  audio.addEventListener('playing', function () {
    play.disabled = false;
    setPlaying(true);
    setStatus('Escuchando en vivo');
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: 'Radio online 24/7',
        artist: config.name || 'El Otro Lado de la Cosa',
        album: 'El Otro Lado de la Cosa'
      });
      navigator.mediaSession.setActionHandler('play', function () { audio.play(); });
      navigator.mediaSession.setActionHandler('pause', function () { audio.pause(); });
    }
  });

  audio.addEventListener('pause', function () {
    setPlaying(false);
    setStatus('Reproducción pausada');
  });

  audio.addEventListener('waiting', function () {
    setStatus('Cargando señal…');
  });

  audio.addEventListener('stalled', function () {
    setStatus('Reconectando con la señal…');
  });

  audio.addEventListener('error', function () {
    play.disabled = false;
    setPlaying(false);
    setStatus('Señal no disponible. Probá el reproductor externo.');
  });
})();
