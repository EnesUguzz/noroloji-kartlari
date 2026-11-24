// Kart çalışma ekranı: prototipteki deste, kaydırma, çevirme ve damga; kararlar tekrar takvimine işlenir.
import { bugun } from '../tarih.js';
import { kategori } from '../srs.js';
import { kartSec, oturumKur, oturumCevap, oturumGeriAl, sonrakiTur } from '../oturum.js';
import { ARALIKLAR } from '../srs.js';
import { esc, cevapHtml, IKON } from './ortak.js';

export function goster(kok, app) {
  const secim = app.paylasim.calis;
  if (!secim) { app.git('#ana'); return; }
  const { ilerleme, bolumler } = app.durum();
  const kartlar = kartSec(bolumler, ilerleme, secim, bugun());
  const kartBul = new Map(kartlar.map((k) => [k.id, k]));
  const bolumBul = new Map(bolumler.map((b) => [b.no, b]));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  kok.innerHTML = `
    <div class="calis">
      <header class="ust">
        <button class="ikon-btn" type="button" id="geriBtn" aria-label="Ana ekrana dön">${IKON.geri}</button>
        <div style="flex:1;min-width:0">
          <div class="eyebrow">${esc(secim.altBaslik || kartlar.length + ' kart')}</div>
          <h1>${esc(secim.baslik)}</h1>
        </div>
      </header>
      <section class="progress" aria-label="İlerleme">
        <div class="progress-row">
          <span class="round" id="round"></span>
          <span class="counts">
            <span class="pill u" title="Bilmiyorum"><span aria-hidden="true">✕</span> <span id="cu">0</span></span>
            <span class="pill k" title="Biliyorum"><span aria-hidden="true">✓</span> <span id="ck">0</span></span>
          </span>
        </div>
        <div class="bar" aria-hidden="true"><span class="bk" id="bk" style="width:0"></span><span class="bu" id="bu" style="width:0"></span></div>
      </section>
      <main class="stage" id="stage"></main>
      <nav class="controls" aria-label="Kart işlemleri">
        <button class="btn u" id="btnU" type="button">${IKON.carpi} Bilmiyorum</button>
        <button class="btn round-btn" id="btnUndo" type="button" aria-label="Geri al" title="Geri al (Z)">${IKON.geriAl}</button>
        <button class="btn round-btn" id="btnFlip" type="button" aria-label="Kartı çevir" title="Çevir (Boşluk)">${IKON.cevir}</button>
        <button class="btn k" id="btnK" type="button">Biliyorum ${IKON.tik}</button>
      </nav>
      <p class="hint">Çevirmek için karta dokun · Sağa kaydır: biliyorum · Sola kaydır: bilmiyorum</p>
    </div>`;

  const $ = (id) => kok.querySelector('#' + id);
  const stage = $('stage');
  $('geriBtn').addEventListener('click', () => app.git('#ana'));

  if (!kartlar.length) {
    kok.querySelector('.progress').hidden = true;
    kok.querySelector('.controls').hidden = true;
    kok.querySelector('.hint').hidden = true;
    stage.innerHTML = `
      <div class="done bos">
        <h2>Bu seçimde kart yok</h2>
        <p>${secim.filtre === 'bugun' ? 'Bugün tekrarı gelen kart kalmadı.' : 'Seçtiğin bölüm ve filtreye uyan kart bulunmuyor.'}</p>
        <button class="btn primary" type="button" id="anaBtn">Ana ekrana dön</button>
      </div>`;
    $('anaBtn').addEventListener('click', () => app.git('#ana'));
    return;
  }

  let oturum = oturumKur(kartlar, { karistir: !!ilerleme.ayar.karistir });
  let flipped = false;
  let busy = false;

  function durumEtiketi(id) {
    const ks = app.durum().ilerleme.kartlar[id];
    const k = kategori(ks, bugun());
    if (k === 'yeni') return '<span class="durum yeni">Yeni</span>';
    if (k === 'bilmiyorum') return '<span class="durum bilmiyorum">Bilmiyorum</span>';
    if (k === 'kalici') return '<span class="durum kalici">Kalıcı</span>';
    return `<span class="durum tekrar">Tekrar ${ks.a}/${ARALIKLAR.length}</span>`;
  }

  function renderProgress() {
    const total = oturum.liste.length;
    let k = 0, u = 0;
    for (const id of oturum.liste) { if (oturum.sonuc[id] === 'k') k++; else if (oturum.sonuc[id] === 'u') u++; }
    $('ck').textContent = k; $('cu').textContent = u;
    $('bk').style.width = (k / total) * 100 + '%';
    $('bu').style.width = (u / total) * 100 + '%';
    const label = oturum.tur === 1 ? '1. tur' : oturum.tur + '. tur · bilmediklerim';
    const finished = oturum.pos >= total;
    $('round').textContent = finished ? label + ' · bitti' : label + ' · ' + (oturum.pos + 1) + ' / ' + total;
    $('btnU').disabled = finished; $('btnK').disabled = finished; $('btnFlip').disabled = finished;
    $('btnUndo').disabled = oturum.gecmis.length === 0;
  }

  function render() {
    renderProgress();
    flipped = false;
    stage.innerHTML = '';
    if (oturum.pos >= oturum.liste.length) { renderDone(); return; }
    if (oturum.pos + 1 < oturum.liste.length) {
      const g = document.createElement('div'); g.className = 'ghost'; stage.appendChild(g);
    }
    const c = kartBul.get(oturum.liste[oturum.pos]);
    const b = bolumBul.get(c.no);
    const sub = (b.altBolumler && b.altBolumler[c.b]) || '';
    const wrap = document.createElement('div');
    wrap.className = 'card-wrap';
    wrap.innerHTML = `
      <div class="stamp k">Biliyorum</div><div class="stamp u">Bilmiyorum</div>
      <div class="card" id="card"><div class="inner">
        <div class="face front" role="button" tabindex="0" aria-label="Soru. Cevabı görmek için çevir.">
          <div class="face-head"><span class="chip">${esc(c.b + (sub ? ' · ' + sub : ''))}</span>${durumEtiketi(c.id)}</div>
          <div class="question">${esc(c.q)}</div>
          <div class="face-foot">Cevap için dokun</div>
        </div>
        <div class="face back" aria-label="Cevap">
          <div class="face-head"><span class="chip">Cevap</span><span>Bölüm ${c.no}</span></div>
          <div class="answer"><p class="q-small">${esc(c.q)}</p>${cevapHtml(c.a)}</div>
          <div class="source">Kitap s. ${c.s} · Bölüm ${esc(c.b)}${sub ? ' ' + esc(sub) : ''}</div>
        </div>
      </div></div>`;
    stage.appendChild(wrap);
    attachDrag(wrap);
  }

  function renderDone() {
    const unknown = oturum.liste.filter((id) => oturum.sonuc[id] === 'u').length;
    const known = oturum.liste.length - unknown;
    const d = document.createElement('div');
    d.className = 'done';
    const head = unknown === 0 ? (oturum.tur === 1 ? 'Hepsini biliyorsun.' : 'Bilmediğin kart kalmadı.') : oturum.tur + '. tur bitti.';
    d.innerHTML = `
      <div><h2>${head}</h2><p>Bildiğin kartlar tekrar takvimine işlendi; bilmediklerin “Bilmediklerim” listesinde.</p></div>
      <div class="stats"><div class="stat k"><b>${known}</b><span>Biliyorum</span></div>
      <div class="stat u"><b>${unknown}</b><span>Bilmiyorum</span></div></div>
      <div class="done-actions">
        ${unknown ? `<button class="btn primary" id="again" type="button">Bilmediklerimi çalış (${unknown})</button>` : ''}
        <button class="btn" id="anaDon" type="button">Ana ekrana dön</button>
      </div>`;
    stage.appendChild(d);
    d.querySelector('#again')?.addEventListener('click', () => { oturum = sonrakiTur(oturum); render(); });
    d.querySelector('#anaDon').addEventListener('click', () => app.git('#ana'));
  }

  function flip() {
    const card = kok.querySelector('#card');
    if (!card || busy) return;
    flipped = !flipped;
    card.classList.toggle('flipped', flipped);
  }

  function commit(biliyor) {
    const r = oturumCevap(oturum, app.durum().ilerleme, biliyor, bugun());
    oturum = r.oturum;
    app.kaydet(r.ilerleme);
    render();
  }

  function decide(kind, wrap) {
    if (busy || oturum.pos >= oturum.liste.length) return;
    wrap = wrap || stage.querySelector('.card-wrap');
    if (!wrap || reduceMotion) { commit(kind === 'k'); return; }
    busy = true;
    const dir = kind === 'k' ? 1 : -1;
    wrap.querySelector('.stamp.' + kind).style.opacity = 1;
    wrap.style.transition = 'transform .3s ease-in, opacity .3s ease-in';
    wrap.style.transform = 'translateX(' + dir * 130 + '%) rotate(' + dir * 18 + 'deg)';
    wrap.style.opacity = '0';
    setTimeout(() => { busy = false; commit(kind === 'k'); }, 280);
  }

  function undo() {
    if (busy || !oturum.gecmis.length) return;
    const r = oturumGeriAl(oturum, app.durum().ilerleme);
    oturum = r.oturum;
    app.kaydet(r.ilerleme);
    render();
  }

  function attachDrag(wrap) {
    let startX = 0, startY = 0, dx = 0, dy = 0, t0 = 0, active = false, id = null;
    const stampK = wrap.querySelector('.stamp.k');
    const stampU = wrap.querySelector('.stamp.u');
    const threshold = () => Math.min(110, wrap.offsetWidth * 0.28);
    function setPos() {
      wrap.style.transform = 'translate(' + dx + 'px,' + dy * 0.15 + 'px) rotate(' + dx / 20 + 'deg)';
      const p = Math.min(1, Math.abs(dx) / threshold());
      stampK.style.opacity = dx > 0 ? p : 0;
      stampU.style.opacity = dx < 0 ? p : 0;
    }
    function reset() {
      dx = dy = 0;
      wrap.classList.add('snap');
      setPos();
      setTimeout(() => wrap.classList.remove('snap'), 230);
    }
    wrap.addEventListener('pointerdown', (e) => {
      if (busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
      active = true; id = e.pointerId; startX = e.clientX; startY = e.clientY; dx = dy = 0; t0 = Date.now();
      wrap.classList.remove('snap');
    });
    wrap.addEventListener('pointermove', (e) => {
      if (!active || e.pointerId !== id) return;
      dx = e.clientX - startX; dy = e.clientY - startY;
      if (Math.abs(dx) > 6) { try { wrap.setPointerCapture(id); } catch { /* yoksay */ } }
      if (Math.abs(dx) > 4) setPos();
    });
    function end(e) {
      if (!active || e.pointerId !== id) return;
      active = false;
      const moved = Math.hypot(dx, dy);
      if (e.type === 'pointercancel') { reset(); return; }
      if (moved < 8 && Date.now() - t0 < 500) { dx = dy = 0; setPos(); flip(); return; }
      if (Math.abs(dx) > threshold()) { decide(dx > 0 ? 'k' : 'u', wrap); return; }
      reset();
    }
    wrap.addEventListener('pointerup', end);
    wrap.addEventListener('pointercancel', end);
    wrap.querySelector('.front').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); flip(); } });
  }

  $('btnK').addEventListener('click', () => decide('k'));
  $('btnU').addEventListener('click', () => decide('u'));
  $('btnFlip').addEventListener('click', flip);
  $('btnUndo').addEventListener('click', undo);
  function tus(e) {
    if (['SELECT', 'INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === ' ') { e.preventDefault(); flip(); }
    else if (e.key === 'ArrowRight') decide('k');
    else if (e.key === 'ArrowLeft') decide('u');
    else if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') { e.preventDefault(); undo(); }
  }
  document.addEventListener('keydown', tus);

  render();
  return () => document.removeEventListener('keydown', tus);
}
