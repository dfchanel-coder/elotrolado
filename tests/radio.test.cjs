const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function setup({ media = true, partial = false } = {}) {
  const handlers = {}, timers = new Map(), pending = [];
  let time = 0, timerId = 0;
  function element() {
    return {
      listeners: {}, attrs: {}, disabled: true, textContent: '',
      classList: { toggle() {} },
      addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); },
      emit(name) { for (const fn of this.listeners[name] || []) fn(); },
      setAttribute(name, value) { this.attrs[name] = value; },
      appendChild() {},
    };
  }
  const nodes = Object.fromEntries(['audio', 'play', 'radio-status', 'radio-player', 'volume', 'radio-external'].map(x => [x, element()]));
  const audio = nodes.audio;
  Object.assign(audio, {
    src: '', paused: true, readyState: 0, loads: 0,
    load() { this.loads++; },
    removeAttribute(name) { if (name === 'src') this.src = ''; },
    play() { this.paused = false; return new Promise((resolve, reject) => pending.push({ resolve, reject })); },
    pause() { this.paused = true; this.emit('pause'); },
  });
  nodes['radio-external'].parentNode = element();
  const document = Object.assign(element(), {
    hidden: false, baseURI: 'https://elotroladodelacosa.com/',
    querySelectorAll() { return []; }, querySelector() { return null; },
    getElementById(id) { return nodes[id] || null; },
    createElement: element, createTextNode: x => x,
  });
  const session = { setActionHandler(action, fn) { if (partial && action === 'stop') throw Error('unsupported'); handlers[action] = fn; } };
  const window = {
    RADIO_CONFIG: { streamUrl: 'https://radio.test/stream', directUrl: 'http://radio.test/stream', name: 'El Otro Lado de la Cosa' },
    location: { protocol: 'https:' },
    localStorage: { getItem: () => null, setItem() {} },
    setTimeout(fn, delay) { timers.set(++timerId, { fn, deadline: time + delay }); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    MediaMetadata: class { constructor(data) { Object.assign(this, data); } },
  };
  if (partial) window.MediaMetadata = undefined;
  vm.runInNewContext(fs.readFileSync('dist/app.js', 'utf8'), {
    window, document, navigator: media ? { mediaSession: session } : {}, URL,
    Date: { now: () => time },
  });
  return {
    nodes, audio, handlers, session, document, pending,
    click: () => nodes.play.emit('click'),
    advance(ms) { time += ms; for (const [id, timer] of [...timers]) if (timer.deadline <= time) { timers.delete(id); timer.fn(); } },
    suspend(ms) { time += ms; },
    get timerCount() { return timers.size; },
  };
}

test('a hanging connection expires, releases the source and allows a retry', () => {
  const t = setup(); t.click();
  assert.equal(t.nodes.play.disabled, true);
  t.advance(15000);
  assert.equal(t.nodes.play.disabled, false);
  assert.equal(t.audio.src, '');
  assert.match(t.nodes['radio-status'].textContent, /reintentar/);
  t.click(); assert.equal(t.audio.src, 'https://radio.test/stream');
  t.audio.emit('playing'); assert.equal(t.session.playbackState, 'playing');
});
test('an obsolete rejected play promise cannot overwrite a successful retry', async () => {
  const t = setup(); t.click(); t.advance(15000); t.click(); t.audio.emit('playing');
  t.pending[0].reject(Error('old connection')); await Promise.resolve();
  assert.equal(t.nodes['radio-status'].textContent, 'Escuchando en vivo');
  assert.equal(t.session.playbackState, 'playing');
});
test('system play/pause uses branded artwork and the same timeout flow', () => {
  const t = setup(); t.handlers.play();
  assert.equal(t.session.metadata.title, 'El Otro Lado de la Cosa');
  assert.equal(t.session.metadata.artwork.length, 6);
  assert.match(t.session.metadata.artwork[5].src, /^https:\/\/elotroladodelacosa.com\/assets\/radio-cover-512.png$/);
  assert.equal(t.handlers.seekto, null);
  t.audio.emit('playing'); t.handlers.pause();
  assert.equal(t.session.playbackState, 'paused');
  assert.equal(t.timerCount, 0);
  t.handlers.play(); t.advance(15000);
  assert.equal(t.nodes.play.disabled, false);
  t.handlers.stop(); assert.equal(t.session.playbackState, 'none');
});
test('stalled buffer expires, but a recovered stream cancels the timeout', () => {
  const t = setup(); t.click(); t.audio.emit('playing');
  t.audio.emit('waiting'); t.advance(10000); t.audio.emit('playing'); t.advance(6000);
  assert.equal(t.session.playbackState, 'playing');
  t.audio.readyState = 4; t.audio.emit('stalled'); assert.equal(t.timerCount, 0);
  t.audio.readyState = 0; t.audio.emit('stalled'); t.advance(15000);
  assert.equal(t.session.playbackState, 'paused'); assert.equal(t.nodes.play.disabled, false);
});
test('pausing cancels pending playback; errors and stream endings recover the button', async () => {
  const t = setup(); t.click(); t.handlers.pause();
  t.pending[0].reject(Error('abort')); await Promise.resolve();
  assert.equal(t.nodes['radio-status'].textContent, 'Reproducción pausada');
  t.click(); t.audio.emit('error'); assert.equal(t.nodes.play.disabled, false);
  t.audio.emit('pause'); assert.match(t.nodes['radio-status'].textContent, /Señal no disponible/);
  t.click(); t.audio.emit('playing'); t.audio.emit('ended');
  assert.match(t.nodes['radio-status'].textContent, /interrumpió/);
});
test('unsupported metadata/actions and missing Media Session do not break playback', () => {
  for (const options of [{ media: false }, { partial: true }]) {
    const t = setup(options); t.click(); t.audio.emit('playing');
    assert.equal(t.nodes.play.disabled, false);
    assert.equal(t.nodes['radio-status'].textContent, 'Escuchando en vivo');
  }
});

test('returning from suspended background cancels an expired connection', () => {
  const t = setup(); t.click(); t.document.hidden = true; t.suspend(20000);
  t.document.hidden = false; t.document.emit('visibilitychange');
  assert.equal(t.nodes.play.disabled, false);
  assert.equal(t.audio.src, '');
  assert.match(t.nodes['radio-status'].textContent, /agotó/);
});

test('rejected system play promises are handled and leave a usable retry', async () => {
  const t = setup(); t.handlers.play(); t.pending[0].reject(Error('network')); await Promise.resolve();
  assert.equal(t.nodes.play.disabled, false);
  assert.equal(t.session.playbackState, 'paused');
  assert.equal(t.timerCount, 0);
  t.handlers.play(); t.audio.emit('playing');
  assert.equal(t.session.playbackState, 'playing');
});
