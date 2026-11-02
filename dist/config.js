// Configuración de la radio.
// streamUrl: enlace HTTPS del audio en vivo (MP3/AAC).
// fallbackUrl: reproductor externo por si el navegador no puede reproducir la señal.
// directUrl: señal directa del proveedor; se ofrece solo si el reproductor falla.
window.RADIO_CONFIG = {
  streamUrl: 'https://cast1.asurahosting.com/proxy/radiom16/stream',
  fallbackUrl: 'https://cast1.asurahosting.com/start/radiom16/',
  directUrl: 'http://cast1.asurahosting.com:7724/stream',
  name: 'El Otro Lado de la Cosa'
};
