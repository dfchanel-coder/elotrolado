document.querySelectorAll('[data-wa]').forEach(link => { link.href = 'https://wa.me/59893922846?text=' + encodeURIComponent(link.dataset.wa); link.target = '_blank'; link.rel = 'noopener noreferrer'; });
const audio = document.getElementById('audio');
const play = document.getElementById('play');
const status = document.getElementById('radio-status');
const config = window.RADIO_CONFIG || {};
audio.volume = 0.8;
document.getElementById('volume').addEventListener('input', e => { audio.volume = Number(e.target.value); });
if (config.streamUrl) {
  audio.src = config.streamUrl;
  play.disabled = false;
  status.textContent = 'Lista para escuchar';
}
play.addEventListener('click', async () => {
  if (!audio.paused) { audio.pause(); return; }
  status.textContent = 'Conectando con la radio…';
  play.disabled = true;
  try { await audio.play(); } catch { status.textContent = 'No pudimos conectar. Volvé a intentar.'; } finally { play.disabled = false; }
});
audio.addEventListener('playing', () => { play.textContent = 'Ⅱ'; play.setAttribute('aria-label', 'Pausar radio'); status.textContent = 'Escuchando en vivo'; });
audio.addEventListener('pause', () => { play.textContent = '▶'; play.setAttribute('aria-label', 'Reproducir radio'); status.textContent = 'Reproducción pausada'; });
audio.addEventListener('waiting', () => { status.textContent = 'Cargando señal…'; });
audio.addEventListener('error', () => { status.textContent = 'Señal no disponible. Volvé a intentar.'; play.textContent = '▶'; play.disabled = false; play.setAttribute('aria-label', 'Reintentar reproducción'); });
