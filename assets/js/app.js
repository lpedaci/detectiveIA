(() => {
  'use strict';

  /* ================= Íconos ================= */
  const ICONS = {
    lupa: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="M15 15l5 5"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    plano: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M14 6l4 4"/></svg>',
    brujula: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>',
    estrella: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.6 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>',
    candado: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    trofeo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M9 20h6"/></svg>'
  };

  const { LEVELS, RANKS } = window.CASO;

  const KEY = 'detective-ia-v1';
  const NAME_MAX = 30;

  /* ================= Índices derivados ================= */
  const ITEM = {};          // id -> { item, levelIdx }
  LEVELS.forEach((l, idx) => l.items.forEach((i) => { ITEM[i.id] = { item: i, levelIdx: idx }; }));
  const TOTAL_XP = LEVELS.reduce((s, l) => s + l.items.reduce((a, i) => a + i.xp, 0), 0);

  const $ = (id) => document.getElementById(id);
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;

  /* ================= Almacenamiento (localStorage) ================= */
  const storageOK = (() => {
    try {
      const k = '__detective_ia_test__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  })();

  const blank = () => ({ name: '', done: {}, updated: null });

  // Valida todo lo que viene del almacenamiento: solo ids conocidos y valores true.
  function parseState(raw) {
    const s = blank();
    if (!raw) return s;
    try {
      const p = JSON.parse(raw);
      if (!p || typeof p !== 'object') return s;
      if (typeof p.name === 'string') s.name = p.name.slice(0, NAME_MAX);
      if (p.done && typeof p.done === 'object') {
        Object.keys(p.done).forEach((id) => {
          if (Object.prototype.hasOwnProperty.call(ITEM, id) && p.done[id] === true) s.done[id] = true;
        });
      }
      if (typeof p.updated === 'number' && isFinite(p.updated)) s.updated = p.updated;
    } catch (e) { /* datos corruptos: se arranca de cero */ }
    return s;
  }

  function load() {
    if (!storageOK) return blank();
    try { return parseState(window.localStorage.getItem(KEY)); } catch (e) { return blank(); }
  }

  let state = load();
  let persisted = storageOK;

  function save() {
    state.updated = Date.now();
    if (!storageOK) { persisted = false; return; }
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ v: 2, name: state.name, done: state.done, updated: state.updated }));
      persisted = true;
    } catch (e) { persisted = false; }
    renderSaved(true);
  }

  /* ================= Lógica del juego ================= */
  // Un nivel está abierto si todos los anteriores están completos.
  // Las marcas de niveles bloqueados se conservan, pero no suman XP hasta reabrirse.
  function compute() {
    const unlocked = [];
    const levelDone = [];
    let open = true;
    LEVELS.forEach((l, idx) => {
      unlocked[idx] = open;
      levelDone[idx] = open && l.items.every((i) => state.done[i.id]);
      open = levelDone[idx];
    });

    const counts = (id) => !!state.done[id] && unlocked[ITEM[id].levelIdx];
    let xp = 0, tasks = 0;
    Object.keys(ITEM).forEach((id) => { if (counts(id)) { xp += ITEM[id].item.xp; tasks++; } });

    let rankIdx = 0;
    RANKS.forEach((r, k) => { if (xp >= r.min) rankIdx = k; });

    let next = null;
    for (let idx = 0; idx < LEVELS.length && !next; idx++) {
      if (!unlocked[idx]) break;
      const it = LEVELS[idx].items.find((i) => !state.done[i.id]);
      if (it) next = { levelIdx: idx, item: it };
    }

    const badges = {};
    BADGES.forEach((b) => { badges[b.key] = b.test({ levelDone, tasks }); });

    return { unlocked, levelDone, xp, tasks, rankIdx, next, badges, allDone: levelDone.every(Boolean) };
  }

  const BADGES = [
    { key: 'pista', label: 'Primera pista', icon: 'estrella', hint: 'Marcá tu primera tarea', test: (c) => c.tasks >= 1 }
  ].concat(LEVELS.map((l, idx) => ({
    key: 'lvl' + l.n, label: l.badge, icon: l.icon, hint: 'Completá el Nivel ' + l.n, test: (c) => c.levelDone[idx]
  })));

  /* ================= Construcción del DOM ================= */
  $('xp-total').textContent = TOTAL_XP;
  $('bar').setAttribute('aria-valuemax', String(TOTAL_XP));

  const ticksEl = $('ticks');
  const ranksEl = $('ranks');
  RANKS.forEach((r, k) => {
    if (r.min > 0) {
      const t = document.createElement('div');
      t.className = 'tick';
      t.style.left = (r.min / TOTAL_XP * 100) + '%';
      ticksEl.appendChild(t);
    }
    const li = document.createElement('li');
    li.id = 'rank-' + k;
    li.innerHTML = '<span class="r-xp">' + r.min + ' XP</span><span class="r-name">' + r.name + '</span>';
    ranksEl.appendChild(li);
  });

  const levelsEl = $('levels');
  LEVELS.forEach((l, idx) => {
    const art = document.createElement('article');
    art.className = 'level card reveal';
    art.style.setProperty('--d', String(idx + 2));
    art.id = 'lvl-' + l.n;
    art.setAttribute('aria-labelledby', 'lvl-title-' + l.n);
    const checks = l.items.map((i) =>
      '<label class="check" id="row-' + i.id + '" for="chk-' + i.id + '">' +
        '<input type="checkbox" data-id="' + i.id + '" id="chk-' + i.id + '">' +
        '<span class="box" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg></span>' +
        '<span class="t">' + i.label + '</span>' +
        '<span class="p">+' + i.xp + ' XP</span>' +
      '</label>'
    ).join('');
    const segs = l.items.map((i) => '<span class="seg" id="seg-' + i.id + '"></span>').join('');
    art.innerHTML =
      '<div class="level-top">' +
        '<div class="level-title"><span class="seal" id="seal-' + l.n + '" aria-hidden="true"></span>' +
        '<h2 id="lvl-title-' + l.n + '"><span class="lv">Nivel ' + l.n + ' ·</span> ' + l.name + '</h2></div>' +
        '<div class="status"><span class="count" id="count-' + l.n + '"></span><span class="pill" id="pill-' + l.n + '"></span>' +
          '<button type="button" class="level-toggle" id="toggle-' + l.n + '" data-level="' + idx + '" aria-controls="body-' + l.n + '" aria-expanded="true" hidden>' +
            '<span class="sr-only" id="toggle-label-' + l.n + '"></span>' + ICONS.chevron +
          '</button></div>' +
      '</div>' +
      '<div class="level-body" id="body-' + l.n + '"><div class="level-inner">' +
      '<div class="segs" aria-hidden="true">' + segs + '</div>' +
      '<p class="mission">' + l.mission + '</p>' +
      '<div class="clue">' +
        '<span class="clue-title">' + l.clueTitle + '</span>' +
        '<span class="redacted" id="redact-' + l.n + '"><span aria-hidden="true"></span><span aria-hidden="true"></span><span class="sr-only">Pista clasificada: se revela al desbloquear este nivel.</span></span>' +
        '<p class="clue-text" id="cluetext-' + l.n + '" hidden>' + l.clue + '</p>' +
      '</div>' +
      (idx > 0 ? '<p class="locked-note" id="locknote-' + l.n + '" hidden>' + ICONS.candado + '<span id="locktext-' + l.n + '"></span></p>' : '') +
      '<div class="checks" role="group" aria-labelledby="lvl-title-' + l.n + '">' + checks + '</div>' +
      '</div></div>';
    levelsEl.appendChild(art);
  });

  const badgesEl = $('badges');
  BADGES.forEach((b) => {
    const d = document.createElement('div');
    d.className = 'badge';
    d.id = 'badge-' + b.key;
    d.setAttribute('role', 'listitem');
    d.innerHTML = ICONS[b.icon] + '<span>' + b.label + '</span><span class="sr-only" id="badge-st-' + b.key + '"></span>';
    d.title = b.hint;
    badgesEl.appendChild(d);
  });

  // Si el tablero está incrustado en el LMS, ofrecer abrirlo aparte.
  let framed = false;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  const selfUrl = window.location.href.split('#')[0];
  $('newtab').href = selfUrl;
  $('notice-link').href = selfUrl;
  if (framed) $('newtab').hidden = false;
  if (!storageOK) $('storage-notice').hidden = false;

  // Al terminar la entrada se quita .reveal para que otras animaciones no la reinicien.
  [['.reveal', 'reveal', 'fade-up'], ['.stamp.intro', 'intro', 'stamp-slam']].forEach(([sel, cls, anim]) => document.querySelectorAll(sel).forEach((el) => {
    el.addEventListener('animationend', function off(e) {
      if (e.target !== el || e.animationName !== anim) return;
      el.classList.remove(cls);
      el.removeEventListener('animationend', off);
    });
  }));

  /* ================= Utilidades de animación ================= */
  function replay(el, cls) {
    if (!el || reduced()) return;
    el.classList.remove(cls);
    void el.offsetWidth; // fuerza reflow para reiniciar la animación
    el.classList.add(cls);
    el.addEventListener('animationend', function done(e) {
      if (e.target !== el) return;
      el.classList.remove(cls);
      el.removeEventListener('animationend', done);
    });
  }

  let xpShown = 0;
  let xpRaf = 0;
  function tweenXP(to) {
    cancelAnimationFrame(xpRaf);
    const el = $('xp');
    if (reduced()) { xpShown = to; el.textContent = to; return; }
    const from = xpShown;
    const start = performance.now();
    const dur = 700;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      xpShown = Math.round(from + (to - from) * e);
      el.textContent = xpShown;
      if (t < 1) xpRaf = requestAnimationFrame(step);
    };
    xpRaf = requestAnimationFrame(step);
  }

  function floatXP(id, xp) {
    if (reduced()) return;
    const row = $('row-' + id);
    const f = document.createElement('span');
    f.className = 'float-xp';
    f.setAttribute('aria-hidden', 'true');
    f.textContent = '+' + xp + ' XP';
    row.appendChild(f);
    f.addEventListener('animationend', () => f.remove());
  }

  // Un solo aviso visible a la vez: si en el mismo cambio hay varios logros, se unen.
  // Es solo visual; los lectores de pantalla reciben el mensaje por #announcer.
  let pendingToasts = [];
  function toast(icon, title, body) {
    pendingToasts.push({ icon, title, body });
    if (pendingToasts.length === 1) queueMicrotask(flushToasts);
  }
  function flushToasts() {
    const list = pendingToasts;
    pendingToasts = [];
    if (!list.length) return;
    const wrap = $('toasts');
    wrap.textContent = '';
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<i class="toast-grip" aria-hidden="true"></i>' + ICONS[list[0].icon] + '<div><strong class="toast-title"></strong><span class="toast-body"></span></div>';
    t.querySelector('.toast-title').textContent = list.map((x) => x.title).join(' · ');
    t.querySelector('.toast-body').textContent = list.map((x) => x.body).join(' ');
    wrap.appendChild(t);
    let timer = 0;
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      if (reduced()) { t.remove(); return; }
      t.classList.add('out');
      t.addEventListener('animationend', () => t.remove());
    };
    // Se cierra a los 5 s; si en ese momento el mouse está encima, espera un poco más.
    const tick = () => {
      let hovered = false;
      try { hovered = t.matches(':hover'); } catch (err) { /* navegador sin :hover */ }
      if (hovered || dragging) timer = setTimeout(tick, 1000); else close();
    };
    const arm = () => { clearTimeout(timer); timer = setTimeout(tick, 5000); };

    // Deslizar hacia un costado para descartar (dedo o mouse).
    // touch-action: pan-y deja libre el desplazamiento vertical de la página.
    let startX = 0, startT = 0, dx = 0, dragging = false, moved = false, pid = null;
    t.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; moved = false; dx = 0; pid = e.pointerId;
      startX = e.clientX; startT = performance.now();
      clearTimeout(timer);
      t.classList.remove('settle');
      t.classList.add('dragging');
      try { t.setPointerCapture(pid); } catch (err) { /* sin captura: sigue funcionando */ }
    });
    t.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== pid) return;
      dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      t.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 40) + 'deg)';
      t.style.opacity = String(Math.max(0.15, 1 - Math.abs(dx) / (t.offsetWidth * 0.9)));
    });
    const release = (e) => {
      if (!dragging || (e && e.pointerId !== pid)) return;
      dragging = false;
      t.classList.remove('dragging');
      const speed = Math.abs(dx) / Math.max(1, performance.now() - startT); // px/ms
      if (Math.abs(dx) > t.offsetWidth * 0.3 || (Math.abs(dx) > 30 && speed > 0.5)) {
        closed = true;
        clearTimeout(timer);
        t.classList.add('fling');
        t.style.transform = 'translateX(' + (dx > 0 ? 1 : -1) * (t.offsetWidth + 60) + 'px) rotate(' + (dx > 0 ? 8 : -8) + 'deg)';
        t.style.opacity = '0';
        setTimeout(() => t.remove(), reduced() ? 0 : 260);
        return;
      }
      if (!moved) { close(); return; } // un toque simple también lo cierra
      t.classList.add('settle');
      t.style.transform = '';
      t.style.opacity = '';
      arm();
    };
    t.addEventListener('pointerup', release);
    t.addEventListener('pointercancel', (e) => { moved = true; release(e); });
    arm();
  }

  function announce(msg) {
    const a = $('announcer');
    a.textContent = '';
    setTimeout(() => { a.textContent = msg; }, 50);
  }

  /* ================= Render ================= */
  const fmt = (() => {
    try { return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return null; }
  })();

  function renderSaved(flash) {
    const el = $('saved');
    if (!persisted) {
      el.textContent = 'No se está guardando en este navegador';
      el.classList.add('off');
      return;
    }
    el.classList.remove('off');
    el.textContent = state.updated
      ? 'Guardado en este navegador · ' + (fmt ? fmt.format(new Date(state.updated)) : new Date(state.updated).toLocaleString())
      : 'Tu avance se guarda automáticamente';
    if (flash) replay(el, 'flash');
  }

  let prev = null;

  // Niveles completos: se pliegan y muestran solo el encabezado.
  // expanded[idx] === true significa que la persona lo abrió a mano.
  const expanded = {};
  const collapseTimers = {};
  const COLLAPSE_DELAY = 1100; // deja ver la tilde y el sello antes de plegar

  function applyCollapse(l, idx, done) {
    const el = $('lvl-' + l.n);
    const collapsed = done && expanded[idx] !== true;
    el.classList.toggle('collapsed', collapsed);
    const body = $('body-' + l.n);
    if (collapsed) body.setAttribute('inert', ''); else body.removeAttribute('inert');
    const btn = $('toggle-' + l.n);
    btn.hidden = !done;
    btn.setAttribute('aria-expanded', String(!collapsed));
    $('toggle-label-' + l.n).textContent = (collapsed ? 'Mostrar' : 'Ocultar') + ' el detalle del Nivel ' + l.n;
    btn.title = collapsed ? 'Ver detalle' : 'Plegar nivel';
  }

  function render() {
    const c = compute();
    const first = prev === null;
    const name = state.name.trim();
    const rank = RANKS[c.rankIdx];

    // Avatar y rango
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    if ($('avatar').textContent !== initial) {
      $('avatar').textContent = initial;
      if (!first) replay($('avatar'), 'bump');
    }
    $('rank').textContent = name ? name + ', ' + rank.name.charAt(0).toLowerCase() + rank.name.slice(1) : rank.name;

    // XP y barra
    if (first) { xpShown = c.xp; $('xp').textContent = c.xp; } else if (c.xp !== prev.xp) tweenXP(c.xp);
    $('fill').style.width = (c.xp / TOTAL_XP * 100) + '%';
    if (!first && c.xp > prev.xp) replay($('fill'), 'shine');
    const nextRank = RANKS[c.rankIdx + 1];
    $('bar').setAttribute('aria-valuenow', String(c.xp));
    $('bar').setAttribute('aria-valuetext', c.xp + ' de ' + TOTAL_XP + ' XP. Rango: ' + rank.name +
      (nextRank ? '. Faltan ' + (nextRank.min - c.xp) + ' XP para ' + nextRank.name : '') + '.');

    RANKS.forEach((r, k) => {
      const li = $('rank-' + k);
      li.classList.toggle('reached', c.xp >= r.min);
      li.classList.toggle('current', k === c.rankIdx);
      if (k === c.rankIdx) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });

    // Próximo paso
    if (c.next) {
      const l = LEVELS[c.next.levelIdx];
      $('next-what').textContent = 'Nivel ' + l.n + ' · ' + c.next.item.label;
      const pending = l.items.filter((i) => !state.done[i.id]).length;
      const parts = [];
      parts.push(pending === 1 ? 'Es la última tarea de este nivel.' : 'Te quedan ' + pending + ' tareas en este nivel.');
      if (nextRank) parts.push('Faltan ' + (nextRank.min - c.xp) + ' XP para ' + nextRank.name + '.');
      $('next-why').textContent = parts.join(' ');
      $('next-go').hidden = false;
    } else {
      $('next-what').textContent = 'Cerraste el caso.';
      $('next-why').textContent = 'Llegaste al rango máximo con ' + c.xp + ' XP. Gracias por tu trabajo, detective.';
      $('next-go').hidden = true;
    }

    // Insignias
    $('badges-count').textContent = BADGES.filter((b) => c.badges[b.key]).length;
    $('badges-total').textContent = BADGES.length;
    BADGES.forEach((b) => {
      const el = $('badge-' + b.key);
      const on = c.badges[b.key];
      el.classList.toggle('earned', on);
      $('badge-st-' + b.key).textContent = on ? ' (obtenida)' : ' (pendiente: ' + b.hint.toLowerCase() + ')';
      if (!first && on && !prev.badges[b.key]) replay(el, 'pop');
    });

    // Niveles
    const currentIdx = c.next ? c.next.levelIdx : -1;
    LEVELS.forEach((l, idx) => {
      const open = c.unlocked[idx];
      const done = c.levelDone[idx];
      const el = $('lvl-' + l.n);
      el.classList.toggle('locked', !open);
      el.classList.toggle('done', done);
      el.classList.toggle('current', idx === currentIdx);

      const doneN = l.items.filter((i) => state.done[i.id]).length;
      $('count-' + l.n).textContent = open ? doneN + '/' + l.items.length : '';
      const pill = $('pill-' + l.n);
      pill.textContent = done ? 'Completado' : (open ? 'En curso' : 'Bloqueado');
      $('seal-' + l.n).innerHTML = done ? ICONS.check : (open ? String(l.n) : ICONS.candado);

      l.items.forEach((i) => {
        const box = $('chk-' + i.id);
        box.checked = !!state.done[i.id];
        box.disabled = !open;
        $('seg-' + i.id).classList.toggle('on', open && !!state.done[i.id]);
      });

      // Pista: tachada mientras el nivel está bloqueado
      $('redact-' + l.n).hidden = open;
      const txt = $('cluetext-' + l.n);
      txt.hidden = !open;

      const note = $('locknote-' + l.n);
      if (note) {
        note.hidden = open;
        if (!open) {
          const kept = l.items.some((i) => state.done[i.id]);
          $('locktext-' + l.n).textContent = 'Se desbloquea al completar el Nivel ' + LEVELS[idx - 1].n + '.' +
            (kept ? ' Tus marcas quedan guardadas y vuelven a sumar cuando se reabra.' : '');
        }
      }

      if (!first) {
        if (open && !prev.unlocked[idx]) {
          replay(el, 'unlocking');
          replay(txt, 'declassify');
        }
        if (done && !prev.levelDone[idx]) {
          replay(el, 'just-done');
          replay(pill, 'stamped');
          // Queda abierto un instante y después se pliega solo.
          expanded[idx] = true;
          clearTimeout(collapseTimers[idx]);
          collapseTimers[idx] = setTimeout(() => {
            if (!prev || !prev.levelDone[idx]) return;
            const body = $('body-' + l.n);
            if (body.contains(document.activeElement)) $('toggle-' + l.n).focus({ preventScroll: true });
            expanded[idx] = false;
            applyCollapse(l, idx, true);
          }, reduced() ? 400 : COLLAPSE_DELAY);
        }
        if (!done && prev.levelDone[idx]) {
          clearTimeout(collapseTimers[idx]);
          delete expanded[idx];
        }
      }
      applyCollapse(l, idx, done);
    });

    // Sello del expediente
    const stamp = $('stamp');
    stamp.textContent = c.allDone ? 'CASO CERRADO' : 'CASO ABIERTO';
    stamp.classList.toggle('closed', c.allDone);
    if (!first && c.allDone !== prev.allDone) { stamp.classList.remove('intro'); replay(stamp, 'slam'); }
    if (!first && c.rankIdx !== prev.rankIdx) replay($('rank'), 'flip');

    // Avisos de logros (después del primer render)
    if (!first) {
      const msgs = [];
      if (c.allDone && !prev.allDone) {
        toast('trofeo', '¡Caso cerrado!', 'Completaste los cuatro niveles. Llegaste a ' + rank.name + '.');
        msgs.push('Caso cerrado. Completaste los cuatro niveles.');
      } else {
        LEVELS.forEach((l, idx) => {
          if (c.levelDone[idx] && !prev.levelDone[idx]) {
            const nxt = LEVELS[idx + 1];
            toast(l.icon, 'Nivel ' + l.n + ' completado', 'Ganaste la insignia ' + l.badge + '.' + (nxt ? ' Se desbloqueó el Nivel ' + nxt.n + '.' : ''));
            msgs.push('Nivel ' + l.n + ' completado.' + (nxt ? ' Se desbloqueó el Nivel ' + nxt.n + '.' : ''));
          }
        });
        if (c.rankIdx > prev.rankIdx) {
          toast('estrella', 'Nuevo rango: ' + rank.name, 'Sumaste ' + c.xp + ' XP.');
          msgs.push('Nuevo rango: ' + rank.name + '.');
        }
      }
      if (c.badges.pista && !prev.badges.pista && !msgs.length) {
        toast('estrella', 'Primera pista', 'Ya arrancaste la investigación. Seguí así.');
        msgs.push('Ganaste la insignia Primera pista.');
      }
      // Se desmarcó una tarea y se bloquearon niveles siguientes
      const relocked = LEVELS.filter((l, idx) => prev.unlocked[idx] && !c.unlocked[idx]);
      if (relocked.length) {
        const ns = relocked.map((l) => l.n).join(', ');
        toast('candado', relocked.length === 1 ? 'Nivel ' + ns + ' en pausa' : 'Niveles ' + ns + ' en pausa',
          'Volvé a marcar la tarea para reabrirlo. Tus marcas siguientes quedan guardadas.');
        msgs.push('Se bloqueó de nuevo: nivel ' + ns + '.');
      }
      if (msgs.length) announce(msgs.join(' '));
    }

    prev = c;
  }

  /* ================= Eventos ================= */
  levelsEl.addEventListener('change', (e) => {
    const t = e.target;
    if (!t || t.type !== 'checkbox') return;
    const id = t.getAttribute('data-id');
    if (!Object.prototype.hasOwnProperty.call(ITEM, id)) return;
    if (t.checked) {
      state.done[id] = true;
      floatXP(id, ITEM[id].item.xp);
    } else {
      delete state.done[id];
    }
    save();
    render();
  });

  // Abrir o plegar un nivel completo desde su encabezado.
  levelsEl.addEventListener('click', (e) => {
    const top = e.target.closest('.level-top');
    if (!top) return;
    const btn = top.querySelector('.level-toggle');
    if (!btn || btn.hidden) return;
    const idx = Number(btn.dataset.level);
    clearTimeout(collapseTimers[idx]);
    expanded[idx] = btn.getAttribute('aria-expanded') !== 'true';
    applyCollapse(LEVELS[idx], idx, true);
    if (e.target.closest('.level-toggle') === null) btn.focus({ preventScroll: true });
  });

  /* ================= Tema claro / oscuro ================= */
  const THEME_KEY = 'detective-ia-theme';
  const themeBtn = $('theme-toggle');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = () => document.documentElement.getAttribute('data-theme');
  const currentTheme = () => savedTheme() || (systemDark.matches ? 'dark' : 'light');

  function renderTheme() {
    const cur = currentTheme();
    themeBtn.dataset.current = cur;
    $('theme-label').textContent = cur === 'dark' ? 'Modo claro' : 'Modo oscuro';
    themeBtn.setAttribute('aria-label', cur === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    // La barra del navegador en el celular acompaña el tema elegido.
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute('content', cur === 'dark' ? '#10171E' : '#E9EDF1');
    });
  }

  themeBtn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    if (!reduced()) {
      root.classList.add('theme-anim');
      setTimeout(() => root.classList.remove('theme-anim'), 400);
    }
    root.setAttribute('data-theme', next);
    try { window.localStorage.setItem(THEME_KEY, next); } catch (e) { /* sin almacenamiento: dura hasta cerrar */ }
    renderTheme();
    replay(themeBtn, 'spin');
    announce(next === 'dark' ? 'Modo oscuro activado.' : 'Modo claro activado.');
  });
  // Si no eligió un tema, sigue al sistema en vivo.
  const onSystem = () => { if (!savedTheme()) renderTheme(); };
  if (systemDark.addEventListener) systemDark.addEventListener('change', onSystem);
  else if (systemDark.addListener) systemDark.addListener(onSystem);
  renderTheme();

  const nameInput = $('nombre');
  nameInput.value = state.name;
  let nameTimer = 0;
  nameInput.addEventListener('input', () => {
    state.name = nameInput.value.slice(0, NAME_MAX);
    render();
    clearTimeout(nameTimer);
    nameTimer = setTimeout(save, 300);
  });
  nameInput.addEventListener('change', () => { clearTimeout(nameTimer); save(); });

  $('next-go').addEventListener('click', () => {
    const c = compute();
    if (!c.next) return;
    const row = $('row-' + c.next.item.id);
    row.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    $('chk-' + c.next.item.id).focus({ preventScroll: true });
    replay(row, 'spot');
  });

  const resetBtn = $('reset');
  let resetTimer = 0;
  function disarm() {
    resetBtn.dataset.armed = '';
    resetBtn.textContent = 'Reiniciar tablero';
  }
  resetBtn.addEventListener('click', () => {
    if (resetBtn.dataset.armed === '1') {
      clearTimeout(resetTimer);
      state = blank();
      nameInput.value = '';
      save();
      prev = null; // sin animaciones de "nivel bloqueado" al reiniciar
      Object.keys(expanded).forEach((k) => { clearTimeout(collapseTimers[k]); delete expanded[k]; });
      render();
      disarm();
      toast('candado', 'Tablero reiniciado', 'Tu avance se borró de este navegador.');
      announce('Tablero reiniciado.');
    } else {
      resetBtn.dataset.armed = '1';
      resetBtn.textContent = 'Tocá de nuevo para borrar tu avance';
      resetTimer = setTimeout(disarm, 4000);
    }
  });

  // Sincroniza si el tablero está abierto en otra pestaña.
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY) {
      if (e.newValue === 'light' || e.newValue === 'dark') document.documentElement.setAttribute('data-theme', e.newValue);
      else document.documentElement.removeAttribute('data-theme');
      renderTheme();
      return;
    }
    if (e.key !== KEY) return;
    state = parseState(e.newValue);
    if (document.activeElement !== nameInput) nameInput.value = state.name;
    render();
    renderSaved(false);
  });

  render();
  renderSaved(false);
})();
