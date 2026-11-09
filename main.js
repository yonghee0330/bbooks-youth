/* 청소년 책사줄게 · 화면 그리기 (빌드 없음, 설정은 config.js) */
(function () {
  'use strict';
  var C = window.CONFIG || {};
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DEFAULT_SLOTS = 30;
  var NOT_YET = '정해지는 대로 이 페이지에 알려드릴게요.';

  function $(s, el) { return (el || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function won(n) { return Number(n).toLocaleString('ko-KR') + '원'; }
  function manwon(n) { return n % 10000 === 0 ? (n / 10000) + '만원' : won(n); }
  function filled(v) { return v !== null && v !== undefined && String(v).trim() !== ''; }
  function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  // 이미지가 있으면 보여주고, 없으면 대체 그래픽을 그대로 둔다
  function tryImage(src, onload) { var im = new Image(); im.onload = function () { onload(im); }; im.src = src; }

  /* ── [1] 히어로 ───────────────────────────── */
  var HERO = {
    A: { title: '책 한 권을 갖는 경험이,<br><em>더 나은 내일</em>을 당깁니다.', sub: '원미동 비북스의 청소년 책사줄게' },
    B: { title: '어른이 건네고,<br>청소년이 고릅니다.<br><em>비북스가 연결합니다.</em>', sub: '' },
    C: { title: '빌리는 책 말고,<br><em>갖는 책</em>', sub: '책값은 어른들이 낼게요. 고르는 건 너의 몫.' }
  };
  function eventLine() {
    return '';   // 날짜 없음: 런칭하면 바로 고르고, 책이 도착하면 안내를 받아 방문해서 받아가요
  }
  function renderHero() {
    var v = HERO[String(C.heroVariant || 'A').toUpperCase()] || HERO.A;
    $('#hero-title').innerHTML = v.title;
    $('.hero-sub').textContent = v.sub;
    $('#hero-date').textContent = eventLine();

    // 대체 그래픽: 세 칸 서가에 책 몇 권
    var g = $('#hero-svg .ill-books'), out = '', shelves = [96, 170, 238];
    shelves.forEach(function (base, r) {
      var x = 32;
      for (var i = 0; x < 280; i++) {
        var k = hash('h' + r + i), w = 12 + (k % 9), h = 44 + (k % 22);
        if (r === 1 && i === 6) { x += 26; continue; } // 빈 칸 하나
        var trust = (k % 3) !== 0, l = (k % 5) * 4;
        var fill = trust ? 'hsl(var(--trust-h) var(--trust-s) calc(var(--trust-l0) + ' + l + '%))'
                         : 'hsl(var(--sorry-h) var(--sorry-s) calc(var(--sorry-l0) + ' + (l - 6) + '%))';
        if (x + w > 288) break;
        out += '<rect x="' + x + '" y="' + (base - h) + '" width="' + w + '" height="' + h + '" rx="1.5" style="fill:' + fill + '"/>';
        x += w + 2;
      }
    });
    g.innerHTML = out;
    if ((C.images || {}).hero) tryImage('images/hero.jpg', function () {
      $('#hero-img').src = 'images/hero.jpg'; $('#hero-img').hidden = false; $('#hero-svg').style.display = 'none';
    });
  }

  /* ── [3] 차별점 ───────────────────────────── */
  var DIFF = {
    event: ['행사형', '정해진 토요일 하루, 책방 전체가 청소년 서가가 돼요.'],
    archive: ['내일의 서재 아카이브', '계속 쌓여 가는 서가와 어른들의 한 줄을 남겨요.'],
    neighborhood: ['원미동 동네 기반', '골목과 공간에서, 동네 어른들이 동네 청소년에게 건네요.'],
    curation: ['0.1평 점주 큐레이션', '여러 점주가 한 칸씩 고른 서가에서 골라요.'],
    bmoim: ['비모임 후속 경험', '책을 고른 뒤 이어지는 모임과 글쓰기에 초대해요.']
  };
  function renderDiff() {
    var ids = (C.differentiators || []).filter(function (k) { return DIFF[k]; }).slice(0, 3);
    if (!ids.length) ids = ['event', 'archive', 'neighborhood'];
    $('#diff-cards').innerHTML = ids.map(function (k, i) {
      return '<article class="card"><span class="card-n">0' + (i + 1) + '</span><h3>' + DIFF[k][0] + '</h3><p>' + DIFF[k][1] + '</p></article>';
    }).join('');
  }

  /* ── [4] 진행 ─────────────────────────────── */
  var ICONS = [
    '<path d="M12 21s-7-4.4-9.3-9A5.2 5.2 0 0 1 12 6.6 5.2 5.2 0 0 1 21.3 12C19 16.6 12 21 12 21z"/>',
    '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    '<path d="M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2z"/><path d="M22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z"/>',
    '<path d="M3 21h18M3 3h18M3 12h18"/><path d="M6 12V5M9 12V6M12 12V4.5M7 21v-7M10.5 21v-6M15 21v-7"/>'
  ];
  var STEPS = [
    ['후원', '어른이 책 한 권 값부터 건네요. 입금이 확인되면 서가에 책이 꽂혀요.'],
    ['신청', (C.pick || {}).enabled === false ? '청소년은 닉네임으로 신청해요.' : '청소년은 읽고 싶은 책을 고르고 닉네임으로 신청해요. 비북스가 책을 주문해 준비해요.'],
    ['받기', '책이 도착하면 안내가 가요. 비북스에 방문해서 받아가요.'],
    ['내일의 서재', '고른 책과 어른들의 한 줄이 서가로 계속 쌓여요.']
  ];
  function renderSteps() {
    $('#steps-list').innerHTML = STEPS.map(function (s, i) {
      return '<li class="step"><div class="step-pic" id="step-pic-' + (i + 1) + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[i] +
        '</svg></div><span class="step-n">STEP ' + (i + 1) + '</span><h3>' + s[0] + '</h3><p>' + s[1] + '</p></li>';
    }).join('');
    if ((C.images || {}).steps) STEPS.forEach(function (s, i) {
      tryImage('images/step-' + (i + 1) + '.png', function (im) {
        im.alt = s[0]; var box = $('#step-pic-' + (i + 1)); box.innerHTML = ''; box.appendChild(im);
      });
    });
  }

  /* ── [5] 내일의 서재: 데이터 로더 ──────────── */
  // shelfSource 하나만 바꾸면 JSON 파일 · Apps Script(JSON) · 공개 CSV 어느 쪽이든 같은 구조로 읽는다
  // 'sheet' = 접수 시트의 후원 탭(입금확인)에서 바로. 실패하면 data/shelf.json으로
  function shelfUrl() { return C.shelfSource === 'sheet' ? (filled(C.api) ? C.api + '?action=shelf' : 'data/shelf.json') : (C.shelfSource || 'data/shelf.json'); }
  function loadShelfAny() {
    var src = shelfUrl();
    return loadShelf(src).catch(function (err) {
      if (src === 'data/shelf.json') throw err;
      console.warn('시트에서 서가를 읽지 못해 data/shelf.json을 씁니다:', err);
      return loadShelf('data/shelf.json');
    });
  }
  function loadShelf(src) {
    var isCsv = /\.csv(\?|#|$)|output=csv/i.test(src);
    return fetch(src, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return isCsv ? r.text().then(csvToShelf) : r.json();
    }).then(function (d) { var rounds = normalizeShelf(d); rounds.meta = d || {}; return rounds; });
  }

  function parseCsv(text) {
    var rows = [], row = [], cur = '', q = false;
    text = text.replace(/^﻿/, '');
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') q = false;
        else cur += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cur); rows.push(row); row = []; cur = '';
      } else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x.trim() !== ''; }); });
  }
  function truthy(v) { return /^(true|1|o|y|yes|예|동의|공개|확인)$/i.test(String(v || '').trim()); }

  // 시트 열: 회차-순번 · 닉네임 · 공개 여부 · 한 줄 · 청소년 코드 · 분야 · 날짜 · 입금확인 (· 예시)
  function csvToShelf(text) {
    var rows = parseCsv(text); if (!rows.length) return { rounds: [] };
    var head = rows.shift().map(function (h) { return h.replace(/\s/g, ''); });
    function col(names) { for (var i = 0; i < names.length; i++) { var k = head.indexOf(names[i]); if (k >= 0) return k; } return -1; }
    var ix = {
      id: col(['회차-순번', '회차순번', 'id']), nick: col(['닉네임', 'nickname']), pub: col(['공개여부', 'public']),
      line: col(['한줄', 'line']), youth: col(['청소년코드', 'youthCode']),
      genre: col(['분야', 'genre']), date: col(['날짜', 'addedAt']), paid: col(['입금확인', 'paid']), ex: col(['예시', 'example'])
    };
    var byRound = {};
    rows.forEach(function (r) {
      function v(k) { return ix[k] >= 0 ? (r[ix[k]] || '').trim() : ''; }
      if (ix.paid >= 0 && !truthy(v('paid'))) return; // 입금확인 TRUE인 행만
      var id = v('id'); if (!id) return;
      var round = parseInt(id.split('-')[0], 10) || 1;
      (byRound[round] = byRound[round] || []).push({
        id: id, nickname: v('nick'), public: truthy(v('pub')), line: v('line'),
        youthCode: v('youth') || null, genre: v('genre') || null, addedAt: v('date'), example: truthy(v('ex'))
      });
    });
    var nums = Object.keys(byRound).map(Number).sort(function (a, b) { return a - b; });
    var last = nums[nums.length - 1];
    // CSV에는 회차 정보가 없으니 마지막 회차만 진행 중, 나머지는 아카이브로 본다
    return { rounds: nums.map(function (n) { return { round: n, title: n + '회차', targetBooks: null, closed: n !== last, books: byRound[n] }; }) };
  }

  function normalizeShelf(data) {
    var rounds = (data && data.rounds) || [];
    rounds.forEach(function (r) {
      r.title = r.title || (r.round + '회차');
      r.books = (r.books || []).slice().sort(function (a, b) {
        return String(a.addedAt || '').localeCompare(String(b.addedAt || '')) || String(a.id).localeCompare(String(b.id), 'ko', { numeric: true });
      });
      if (!filled(r.targetBooks) && !r.closed && filled(C.targetBooks)) r.targetBooks = Number(C.targetBooks);
    });
    return rounds.sort(function (a, b) { return a.round - b.round; });
  }

  /* ── [5] 내일의 서재: 그리기 ───────────────── */
  var shelfState = { rounds: [], current: null, played: {} };

  function isNew(b) {
    if (!b.addedAt) return false;
    var s = String(b.addedAt), t = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s);
    var d = Date.now() - t.getTime();
    return d >= 0 && d < 864e5;
  }
  var BOOK_COLORS = ['#4a2018', '#e09a7a', '#6f8f95', '#c4643f', '#8a4a34', '#9fb4b6', '#b9694b'];
  function bookFill(b) { return BOOK_COLORS[hash(b.id || '') % BOOK_COLORS.length]; }
  function anonName() { return C.anonName || '키다리아저씨'; }
  function displayName(b) { return b.public && filled(b.nickname) ? b.nickname : anonName(); }

  function renderTabs() {
    var tabs = $('#round-tabs'), rs = shelfState.rounds;
    if (rs.length < 2) { tabs.hidden = true; return; }
    tabs.hidden = false;
    tabs.innerHTML = rs.map(function (r) {
      var on = r === shelfState.current;
      return '<button type="button" role="tab" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-round="' + r.round + '">' +
        esc(r.title) + (r.closed ? ' · 아카이브' : '') + '</button>';
    }).join('');
  }

  function renderMeta(r) {
    var real = r.books.filter(function (b) { return !b.example; }).length;
    var ex = r.books.length - real, html = '';
    html += '<span class="shelf-count">꽂힌 책 <b>' + real + '</b>권</span>';
    if (r.closed) html += '<span class="badge">아카이브 · 고정된 서가</span>';
    if (ex) html += '<span class="badge">예시 ' + ex + '권 — 실제 후원이 아니에요</span>';
    if (!r.closed && Number(r.pending) > 0) html += '<span class="badge pending-badge">작은 후원이 모이는 중 · 다음 한 권까지 ' + won(r.pending) + '</span>';
    $('#shelf-meta').innerHTML = html;
  }

  function renderShelf() {
    var r = shelfState.current, wrap = $('#shelf-wrap');
    closeCard(false);
    var old = $('.shelf-svg', wrap); if (old) old.remove();
    $('#shelf-loading').hidden = true;
    renderMeta(r);

    var cw = Math.max(260, wrap.clientWidth - 28);
    var perRow = Math.max(7, Math.min(20, Math.floor(cw / 44)));
    var slotW = cw / perRow, bookW = Math.min(slotW * 0.78, 30);
    var rowH = cw < 500 ? 78 : 96, boardH = 8, pad = 30; // 위쪽 여백은 떨어지는 책 자리
    var total = r.closed ? r.books.length : Math.max(DEFAULT_SLOTS, Math.ceil((r.books.length + 1) / perRow) * perRow);
    var rows = Math.max(1, Math.ceil(total / perRow));
    var H = pad + rows * (rowH + boardH);

    var svg = '<svg class="shelf-svg' + (shelfState.played[r.round] || REDUCED ? '' : ' pending') + '" viewBox="0 0 ' + cw + ' ' + H +
      '" width="' + cw + '" height="' + H + '" role="group" aria-label="' + esc(r.title) + ' 서가, ' + total + '칸 중 ' + r.books.length + '권">';
    for (var row = 0; row < rows; row++) {
      var base = pad + row * (rowH + boardH) + rowH;
      svg += '<rect class="board" x="0" y="' + base + '" width="' + cw + '" height="' + boardH + '" rx="2"/>' +
             '<rect class="board-edge" x="0" y="' + (base + boardH - 2) + '" width="' + cw + '" height="2"/>';
    }
    var delayStep = Math.min(70, 1800 / Math.max(1, r.books.length));
    for (var i = 0; i < total; i++) {
      var rw = Math.floor(i / perRow), cl = i % perRow;
      var floor = pad + rw * (rowH + boardH) + rowH;
      var cx = cl * slotW + slotW / 2, x = cx - bookW / 2;
      var b = r.books[i];
      if (!b) {
        var eh = rowH * 0.72;
        svg += '<rect class="slot" x="' + x + '" y="' + (floor - eh) + '" width="' + bookW + '" height="' + (eh - 2) + '" rx="2"/>';
        continue;
      }
      var h = rowH * (0.7 + (hash(b.id + 'h') % 23) / 100), y = floor - h;
      var label = displayName(b) + '님이 건넨 책' + (filled(b.youthCode) ? ', 청소년에게 연결됨' : '') + (b.example ? ', 예시' : '');
      svg += '<g class="book' + (isNew(b) ? ' new' : '') + (b.example ? ' example' : '') + '" tabindex="0" role="button" aria-haspopup="dialog" data-i="' + i +
        '" aria-label="' + esc(label) + '" style="animation-delay:' + Math.round(i * delayStep) + 'ms">' +
        '<rect class="cover" x="' + x + '" y="' + y + '" width="' + bookW + '" height="' + h + '" rx="2" style="fill:' + bookFill(b) + '"/>' +
        '<rect class="spine-line" x="' + x + '" y="' + (y + h * 0.16) + '" width="' + bookW + '" height="2.5"/>' +
        '<rect class="spine-line" x="' + x + '" y="' + (y + h * 0.78) + '" width="' + bookW + '" height="1.5"/>' +
        '<rect class="glow" x="' + (x - 3) + '" y="' + (y - 3) + '" width="' + (bookW + 6) + '" height="' + (h + 6) + '" rx="4"/>' +
        '<rect class="focus-ring" x="' + (x - 3) + '" y="' + (y - 3) + '" width="' + (bookW + 6) + '" height="' + (h + 6) + '" rx="4"/>' +
        (filled(b.youthCode) ? '<rect class="link-mark" x="' + (x + bookW * 0.3) + '" y="' + (y - 7) + '" width="' + (bookW * 0.4) + '" height="9" rx="2"/>' : '') + '</g>';
    }
    svg += '</svg>';
    wrap.insertAdjacentHTML('afterbegin', svg);
    shelfState.perRow = perRow;
    observeShelf();
  }

  // 서가가 화면에 보이면 순서대로 채운다 (회차마다 한 번)
  var shelfIO;
  function observeShelf() {
    var el = $('.shelf-svg'); if (!el || !el.classList.contains('pending')) return;
    if (!('IntersectionObserver' in window)) { play(el); return; }
    if (shelfIO) shelfIO.disconnect();
    shelfIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { play(el); shelfIO.disconnect(); } });
    }, { threshold: 0.25 });
    shelfIO.observe(el);
  }
  function play(el) {
    el.classList.remove('pending'); el.classList.add('play');
    shelfState.played[shelfState.current.round] = true;
  }

  function fmtDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? Number(m[2]) + '.' + Number(m[3]) : (s || ''); }

  /* 책 카드 */
  var openBook = null;
  function openCard(g) {
    var r = shelfState.current, b = r.books[Number(g.getAttribute('data-i'))]; if (!b) return;
    closeCard(false);
    openBook = g; g.classList.add('is-open');
    var card = $('#book-card');
    var yc = filled(b.youthCode) ? (String(b.youthCode).charAt(0) === '#' ? b.youthCode : '#' + b.youthCode) : '';
    var youth = yc ? (filled(b.youthName) ? b.youthName : '익명 청소년') + ' ' + yc : '책을 받으면 연결돼요';
    card.innerHTML =
      '<button type="button" class="bc-close" aria-label="닫기">×</button>' +
      '<span class="bc-mind">건넨 어른' + (b.example ? ' · 예시' : '') + '</span>' +
      '<h4 id="bc-name">' + esc(displayName(b)) + '</h4>' +
      (b.public && filled(b.line) ? '<p class="bc-line">“' + esc(b.line) + '”</p>' : (b.public ? '' : '<p class="bc-line muted">이름 없이 건넨 책이에요.</p>')) +
      (b.pooled ? '<p class="bc-pooled">작은 후원 ' + b.pooled + '건이 모여 한 권이 됐어요.</p>' : '') +
      '<dl><dt>연결</dt><dd>' + esc(youth) + '</dd>' +
      (filled(b.youthBook) ? '<dt>고른 책</dt><dd>' + esc(b.youthBook) + '</dd>' : '') +
      (filled(b.addedAt) ? '<dt>꽂힌 날</dt><dd>' + esc(fmtDate(b.addedAt)) + '</dd>' : '') + '</dl>';
    card.hidden = false;
    var wrap = $('#shelf-wrap'), wr = wrap.getBoundingClientRect(), br = g.getBoundingClientRect();
    var cwid = card.offsetWidth, left = br.left - wr.left + br.width / 2 - cwid / 2;
    left = Math.max(10, Math.min(left, wr.width - cwid - 10));
    card.style.left = left + 'px';
    card.style.top = (br.bottom - wr.top + 8) + 'px';
    $('.bc-close', card).addEventListener('click', function () { closeCard(true); });
    $('.bc-close', card).focus({ preventScroll: true });
  }
  function closeCard(restore) {
    var card = $('#book-card'); if (card.hidden) return;
    card.hidden = true;
    if (openBook) { openBook.classList.remove('is-open'); if (restore) openBook.focus({ preventScroll: true }); }
    openBook = null;
  }

  function bindShelf() {
    var wrap = $('#shelf-wrap');
    wrap.addEventListener('click', function (e) {
      var g = e.target.closest && e.target.closest('.book');
      if (g) { if (g === openBook) closeCard(true); else openCard(g); }
    });
    wrap.addEventListener('keydown', function (e) {
      var g = e.target.closest && e.target.closest('.book');
      if (e.key === 'Escape') { closeCard(true); return; }
      if (!g) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCard(g); return; }
      var books = Array.prototype.slice.call(wrap.querySelectorAll('.book')), i = books.indexOf(g), n = -1;
      if (e.key === 'ArrowRight') n = i + 1; else if (e.key === 'ArrowLeft') n = i - 1;
      else if (e.key === 'ArrowDown') n = i + shelfState.perRow; else if (e.key === 'ArrowUp') n = i - shelfState.perRow;
      else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = books.length - 1;
      if (n !== -1) { e.preventDefault(); n = Math.max(0, Math.min(books.length - 1, n)); books[n].focus(); }
    });
    document.addEventListener('click', function (e) {
      if (openBook && !$('#shelf-wrap').contains(e.target)) closeCard(false);
    });
    $('#round-tabs').addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn) return;
      selectRound(Number(btn.getAttribute('data-round')), true);
    });
    $('#round-tabs').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var rs = shelfState.rounds, i = rs.indexOf(shelfState.current) + (e.key === 'ArrowRight' ? 1 : -1);
      if (rs[i]) selectRound(rs[i].round, true);
    });
    var lastW = wrap.clientWidth, t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () { if (shelfState.current && Math.abs(wrap.clientWidth - lastW) > 30) { lastW = wrap.clientWidth; renderShelf(); } }, 200);
    });
  }
  function selectRound(n, focusTab) {
    shelfState.current = shelfState.rounds.filter(function (r) { return r.round === n; })[0] || shelfState.current;
    renderTabs(); renderShelf();
    if (focusTab) { var b = $('#round-tabs [aria-selected="true"]'); if (b) b.focus(); }
  }

  function initShelf() {
    bindShelf();
    loadShelfAny().then(function (rounds) {
      var meta = rounds.meta;
      if (!rounds.length) { rounds = [{ round: 1, title: '1회차', targetBooks: filled(C.targetBooks) ? Number(C.targetBooks) : null, closed: false, books: [] }]; rounds.meta = meta; }
      shelfState.rounds = rounds;
      renderDash(rounds);
      var open = rounds.filter(function (r) { return !r.closed; });
      shelfState.current = open.length ? open[open.length - 1] : rounds[rounds.length - 1];
      renderTabs(); renderShelf();
    }).catch(function (err) {
      console.warn('서가 데이터를 읽지 못했어요:', err);
      $('#shelf-loading').textContent = '서가를 불러오지 못했어요. 잠시 뒤 다시 열어주세요.';
    });
  }

  /* ── [6] 후원 ─────────────────────────────── */
  var amount = 0, moreMode = false;
  // 책 권수는 0.5권(1만 원) 단위: 5만 원 = 2.5권
  function halfBooks(amt) { var h = Math.floor((Number(amt) || 0) / ((Number(C.bookPrice) || 20000) / 2)) / 2; return String(h).replace(/\.0$/, ''); }
  function moreMin() { return (Number(C.bookPrice) || 20000) / 2; }  // 자유 입력 최소 = 반 권(1만 원)
  function renderDonate() {
    var steps = (C.donationSteps || []).map(function (x) { return typeof x === 'number' ? { amount: x, label: manwon(x) } : x; })
      .filter(function (x) { return x && x.amount > 0; });
    $('#amount-btns').innerHTML = steps.map(function (x) {
      return '<button type="button" aria-pressed="false" data-amount="' + x.amount + '"><b>' + esc(x.label || manwon(x.amount)) + '</b><span>' + manwon(x.amount) + '</span></button>';
    }).join('') + '<button type="button" aria-pressed="false" data-more="1"><b>자유 입력</b><span>1만 원 단위</span></button>';
    $('#free-min').textContent = manwon(moreMin()) + ' 단위';
    $('#amount-btns').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.getAttribute('data-more')) {
        moreMode = true; $('#free-row').hidden = false;
        amount = Number(String($('#free-amount').value).replace(/[^\d]/g, '')) || 0;
        setPressed(b); calc(); $('#free-amount').focus({ preventScroll: true });
      } else {
        moreMode = false; $('#free-row').hidden = true; $('#free-amount').value = '';
        amount = Number(b.getAttribute('data-amount'));
        setPressed(b); calc();
      }
    });
    $('#free-amount').addEventListener('input', function () {
      var digits = this.value.replace(/[^\d]/g, '').slice(0, 9);
      amount = Number(digits) || 0;
      this.value = digits ? Number(digits).toLocaleString('ko-KR') : '';
      calc();
    });
    var first = $('#amount-btns button'); if (first) first.click();  // 처음엔 1권이 골라져 있어요

    var a = C.account || {}, box = $('#account');
    if (filled(a.bank) && filled(a.number) && filled(a.holder)) {
      box.innerHTML = '<p class="acc-label">후원 계좌</p><div class="acc-row"><span>' + esc(a.bank) + '</span><span class="acc-num" id="acc-num">' + esc(a.number) +
        '</span><span>예금주 ' + esc(a.holder) + '</span><button type="button" id="copy-acc">계좌번호 복사</button><span class="copy-msg" id="copy-msg" aria-live="polite"></span></div>';
      $('#copy-acc').addEventListener('click', copyAccount);
    } else {
      box.innerHTML = '<p class="acc-label">후원 계좌</p><p class="muted" style="margin:0">계좌는 준비 중이에요. 정해지는 대로 여기에 적어둘게요.</p>';
    }
  }
  function setPressed(btn) {
    Array.prototype.forEach.call(document.querySelectorAll('#amount-btns button'), function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
  }
  function calc() {
    var da = $('#d-amount'); if (da) { da.value = amount ? amount.toLocaleString('ko-KR') : ''; da.readOnly = true; }  // 금액은 권수에 맞춰 자동 — 직접 못 고쳐요
    var el = $('#books-calc'), price = Number(C.bookPrice);
    if (!price || !amount) { el.hidden = !moreMode; if (moreMode) el.innerHTML = '후원할 금액을 ' + won(moreMin()) + ' 단위로 적어주세요. (' + won(moreMin()) + ' = 책 0.5권)'; return; }
    var half = price / 2, n = halfBooks(amount);
    el.hidden = false;
    el.innerHTML = moreMode && amount % half ? '금액은 ' + won(half) + ' 단위로 적어주세요. (' + won(half) + ' = 책 0.5권)'
      : n.indexOf('.') < 0 ? '책 <b>' + n + '권</b>이 서가에 꽂혀요.'
      : '책 <b>' + n + '권</b> 몫이에요. 남는 반 권은 다른 후원과 모여 서가에 꽂혀요.';
  }
  function copyAccount() {
    var num = (C.account.number || '').trim(), msg = $('#copy-msg');
    function fallback() {
      var sel = window.getSelection(), range = document.createRange();
      range.selectNodeContents($('#acc-num')); sel.removeAllRanges(); sel.addRange(range);
      msg.textContent = '계좌번호를 선택해 두었어요. 길게 눌러 복사해 주세요.';
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(num).then(function () { msg.textContent = '복사했어요.'; }, fallback);
    } else fallback();
  }

  /* ── 접수: 시트(Apps Script)로 보내기 ── */
  function post(form, data, hp) {
    if (!filled(C.api)) return Promise.reject(new Error('접수 준비 중이에요. 조금 뒤에 다시 와주세요.'));
    return fetch(C.api, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 단순 요청이라 CORS 사전 확인 없이 간다
      body: JSON.stringify({ form: form, data: data, website: hp || '' })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function consentHtml(kind) {
    var items = kind === 'donate'
      ? ['수집 항목: 이름·닉네임, 연락처, 이메일, 후원 금액, 입금자명, 지정 대상, (현금영수증·지출증빙 신청 시) 발급 번호',
         '쓰는 곳: 청소년 책사줄게 입금 확인, 현금영수증·지출증빙 발급, 서가 반영과 결과 안내']
      : ['수집 항목: 닉네임, 학년, 학교 이름, 연락처, 이메일, 고른 책',
         '쓰는 곳: 청소년 책사줄게 진행(부천 지역 확인, 책 주문·도착 안내, 2개월에 한 권 기준 확인)',
         '후원현황에는 닉네임과 고른 책 제목이 보여요. 실명은 묻지 않고, 학교·연락처는 공개하지 않아요'];
    items.push('받은 정보는 청소년 책사줄게 진행에만 쓰고, 다른 용도로 따로 보관하지 않아요.');
    items.push('동의하지 않으면 접수할 수 없어요');
    return '<ul>' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
  }
  function fillConsent() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-consent]'), function (el) { el.innerHTML = consentHtml(el.getAttribute('data-consent')); });
  }
  function digits(v) { return String(v || '').replace(/[^\d]/g, ''); }
  // 입력 확인: 첫 번째 문제 칸으로 옮기고 문구를 돌려준다
  function checkFields(form, rules) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i], el = form.elements[r[0]], bad = typeof r[1] === 'function' ? !r[1](el) : !String(el.value || '').trim();
      if (bad) { var f = el.length && !el.tagName ? el[0] : el; if (f && f.focus) f.focus(); return r[2]; }
    }
    return '';
  }
  var isPhone = function (el) { return /^0\d{8,10}$/.test(digits(el.value)); };
  var isEmail = function (el) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(el.value).trim()); };
  var isChecked = function (el) { return el.checked; };
  window.YBG = { post: post, checkFields: checkFields, isPhone: isPhone, isEmail: isEmail, isChecked: isChecked, filled: filled };

  function initDonateForm() {
    var form = $('#donate-form'); if (!form) return;
    var btn = $('button[type=submit]', form), msg = $('.form-msg', form);
    if (!filled(C.api)) { btn.disabled = true; btn.textContent = '접수 준비 중'; }
    $('#d-line').addEventListener('input', function () { $('#d-line-cnt').textContent = this.value.length + '/40'; });
    // 만화 → 금액 → '책사줄게 참여하기'를 눌러야 폼이 열린다
    var open = $('#d-open');
    if (open) open.addEventListener('click', function () {
      form.hidden = false; open.hidden = true;
      if (amount) $('#d-amount').value = amount.toLocaleString('ko-KR');
      form.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { var f = form.querySelector('input[name=kind]:checked'); if (f) f.focus({ preventScroll: true }); }, REDUCED ? 0 : 350);
    });
    if (location.hash === '#form' && open) open.click();
    var now = $('#donors-now');
    if (now) loadShelfAny().then(function (rounds) {
      var n = shelfTotals(rounds).donors;
      now.innerHTML = n ? '지금 <b>' + n + '명</b>의 어른이 함께해요.' : '첫 번째로 함께할 어른을 기다려요.';
    }).catch(function () {});
    $('#d-receipt').addEventListener('change', function () { $('#d-receipt-row').hidden = !this.checked; });
    Array.prototype.forEach.call(form.elements.kind, function (r) {
      r.addEventListener('change', function () { var org = form.elements.kind.value !== '개인'; $('#d-org-row').hidden = !org; form.elements.org.required = org; });
    });
    $('#d-anon').addEventListener('change', function () { $('#d-line-row').classList.toggle('dim', this.checked); });
    Array.prototype.forEach.call(form.elements.to, function (r) {
      r.addEventListener('change', function () { var pick = form.elements.to.value === 'pick'; $('#d-target-row').hidden = !pick; form.elements.target.required = pick; });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); msg.textContent = '';
      var err = checkFields(form, [
        ['name', null, '이름이나 닉네임을 적어주세요.'], ['phone', isPhone, '연락처를 확인해 주세요. (예: 010-1234-5678)'],
        ['email', isEmail, '이메일을 확인해 주세요.'], ['amount', function (el) { var v = Number(digits(el.value)); return moreMode ? v >= moreMin() && v % ((Number(C.bookPrice) || 20000) / 2) === 0 : v >= 1000; }, moreMode ? '후원 금액을 ' + won(moreMin()) + ' 단위로 적어주세요. (최소 ' + won(moreMin()) + ')' : '몇 권을 후원할지 위에서 골라주세요.'],
        ['org', function (el) { return form.elements.kind.value === '개인' || !!el.value.trim(); }, '기관·단체 이름을 적어주세요.'],
        ['target', function (el) { return form.elements.to.value !== 'pick' || !!el.value.trim(); }, '어느 학교·반·모임에 건넬지 적어주세요.'],
        ['payer', null, '입금자명을 적어주세요.'], ['consent', isChecked, '개인정보 수집·이용에 동의해 주세요.']
      ]);
      if (err) { msg.textContent = err; return; }
      var f = form.elements;
      btn.disabled = true; btn.textContent = '보내는 중…';
      post('donate', {
        name: f.name.value, phone: f.phone.value, email: f.email.value, kind: f.kind.value, amount: digits(f.amount.value),
        org: f.org.value, payer: f.payer.value, line: f.line.value, anon: f.anon.checked, target: f.to.value === 'pick' ? f.target.value : '',
        receipt: f.receipt.checked, receiptNo: f.receiptNo.value, consent: f.consent.checked
      }, f.website.value).then(function (res) {
        if (!res.ok) throw new Error(res.error || '접수하지 못했어요.');
        var a = C.account || {}, done = $('#donate-done');
        form.hidden = true; done.hidden = false;
        done.innerHTML = '<p class="done-h">책사줄게 참여 신청이 됐어요. 고맙습니다.</p><p>접수번호 <b>' + esc(res.id) + '</b></p>' +
          '<p>아직 입금 전이라면 아래 계좌로 보내주세요. 입금이 확인되면 서가에 책이 꽂혀요.</p>' +
          (filled(a.number) ? '<p class="done-acc">' + esc(a.bank) + ' ' + esc(a.number) + ' · ' + esc(a.holder) + '<br>입금자명 ' + esc(f.payer.value) + ' · ' + won(digits(f.amount.value)) + '</p>' : '') +
          '<a class="btn btn-ghost" href="shelf.html">후원현황 보러 가기</a>';
        done.focus();
      }).catch(function (err) {
        msg.textContent = err.message === 'Failed to fetch' ? '보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러주세요.' : err.message;
        btn.disabled = false; btn.textContent = '책사줄게 참여하기';
      });
    });
  }

  /* ── [7] 신청 안내 ────────────────────────── */
  function renderYouth() {
    var who = (filled(C.regionLimit) ? C.regionLimit + ' ' : '') + (filled(C.ageRange) ? C.ageRange + ' 청소년' : '청소년');
    var items = [
      ['받기', '책이 도착하면 안내가 가요. ' + (C.place || '비북스') + '에 방문해서 받아가요'],
      ['대상', who],
      null,
      ['횟수', '2개월에 한 권, 한 해 최대 6권 (1월에 신청하면 3월에 다시 · 달 기준)'],
      ['책', '한 사람이 한 권' + (filled(C.bookPrice) ? ' (정가 ' + won(C.bookPrice) + ' 이하)' : '') + '. 추천 목록에서 고르거나, 읽고 싶은 책을 직접 골라요'],
      ['묻지 않아요', '실명 (학교 이름은 지역 확인에만 써요)'],
      ['신청', '실명 대신 닉네임으로']
    ].filter(Boolean);
    $('#youth-info').innerHTML = items.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('');
  }

  /* ── [8] 기관·기업 ────────────────────────── */
  function contactLinks() {
    var c = C.contact || {}, out = [];
    if (filled(c.email)) out.push(['이메일', 'mailto:' + c.email, c.email]);
    if (filled(c.phone)) out.push(['전화', 'tel:' + String(c.phone).replace(/[^\d+]/g, ''), c.phone]);
    if (filled(c.instagram)) {
      var h = String(c.instagram).replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
      out.push(['인스타그램', 'https://instagram.com/' + h, '@' + h]);
    }
    return out;
  }
  function renderOrg() {
    var pkg = C.orgPackage || [];
    if (typeof pkg === 'string') pkg = filled(pkg) ? [pkg] : [];
    $('#org-package').innerHTML = pkg.length
      ? '<ul class="pkg">' + pkg.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>'
      : '<p class="lead">학교, 동아리, 회사에서 함께 건네고 싶다면 편하게 물어봐 주세요.</p>';
    var links = contactLinks();
    $('#org-contact').innerHTML = links.length
      ? links.map(function (l, i) { return '<a class="btn ' + (i ? 'btn-ghost' : 'btn-primary') + '" href="' + esc(l[1]) + '"' + (l[0] === '인스타그램' ? ' target="_blank" rel="noopener"' : '') + '>' + l[0] + (l[0] === '인스타그램' ? '으로' : '로') + ' 문의</a>'; }).join('')
      : '<span class="soon">문의처 준비 중</span>';
  }

  /* ── [9] FAQ · [10] 개인정보 ───────────────── */
  function privacyItems() {
    return [
      '받은 정보는 청소년 책사줄게를 진행하는 데만 써요. 다른 용도로 따로 보관하지 않아요.',
      '실명, 학교, 연락처는 공개하지 않아요.',
      '책을 받은 청소년은 후원현황에 닉네임과 고른 책 제목이 보여요. 실명, 학교, 연락처, 이메일은 어디에도 공개하지 않아요.',
      '모인 금액, 전달한 권수, 남은 금액 처리는 정기적으로 공지해요.'
    ];
  }
  function faqData() {
    var fa = C.faqAnswers || {}, price = Number(C.bookPrice) || 20000;
    var who = (filled(C.regionLimit) ? C.regionLimit + ' ' : '') + (filled(C.ageRange) ? C.ageRange + ' ' : '') +
      '청소년이면 누구나 신청할 수 있어요. 학교 이름은 지역 확인에만 쓰고 공개하지 않아요.';
    return {
      adult: [
        ['얼마부터 함께할 수 있나요?', ['책 1권(' + won(price) + ')부터 5권, 그 이상은 원하는 만큼 함께할 수 있어요.']],
        ['후원금은 어디에 쓰이나요?', ['부천 청소년이 스스로 고른 책을 사는 데만 써요. 신청이 들어오면 비북스가 책을 주문해 준비해요.']],
        ['남으면 어떻게 되나요?', [filled(fa.leftover) ? fa.leftover : NOT_YET]],
        ['영수증을 받을 수 있나요?', [filled(fa.receipt) ? fa.receipt : NOT_YET]],
        ['이름을 밝히지 않고 후원할 수 있나요?', ['네. 참여할 때 "' + anonName() + '로 참여"에 체크하면 후원현황과 서가에 이름과 한 줄이 보이지 않아요. "' + anonName() + '"로만 표시돼요.']],
        ['기관·단체·기업·종교단체도 함께할 수 있나요?', ['네. 참여할 때 "기관·단체·기업·종교단체"를 고르고 이름을 적어주세요. 한 반, 한 동아리 몫처럼 여러 권을 함께 건넬 수도 있어요. 궁금한 건 아래 연락처로 물어봐 주세요.']],
        ['한 청소년에게 몇 권씩 건네나요?', ['후원한 책은 부천 청소년에게 2개월에 한 권씩, 한 해 최대 6권까지 나눠 건네요. 더 많은 청소년이 책을 만날 수 있게 한 번에 한 권씩이에요. 한 주에 10명까지 신청을 받아요.']],
        ['특정 학교나 모임에 건넬 수 있나요?', ['네. 참여할 때 "지정해서 건네기"를 고르고 학교·반·모임을 적어주세요. 그곳 청소년들이 책을 고르도록 비북스가 이어 드려요.']]
      ],
      youth: [
        ['누가 신청할 수 있나요?', [who]],
        ['정말 무료예요?', ['네, 무료예요. 어른들이 미리 책값을 내 두셨어요. 한 사람이 한 번에 한 권(정가 ' + won(price) + ' 이하)을 받아요.']],
        ['몇 번 받을 수 있나요?', ['책은 2개월에 한 권씩, 한 해 최대 6권까지 받을 수 있어요. 1월에 신청했다면 3월에 다시 신청할 수 있어요. 날짜가 아니라 달을 기준으로 해요.']],
        ['어떻게 고르나요?', ['「책 고르기」에서 추천 목록을 보고 골라도 되고, 목록에 없는 책을 직접 골라도 돼요. ' + (((C.pick || {}).customRule) || '')]],
        ['책은 어떻게 받나요?', ['신청하면 비북스가 책을 주문해요. 책이 도착하면 연락이 오고, 부천 원미동 비북스에 방문해서 받아가요. 택배는 없어요.']],
        ['내 신청을 어디서 봐요?', ['같은 폰·컴퓨터에서 「내 신청」을 열면 접수번호가 보여요. 다른 기기에서 신청했다면 안 보일 수 있어요. 그때는 비북스에 물어봐 주세요.']]
      ]
    };
  }
  function faqStartKey() {
    if (SIDE === 'teen') return 'youth';
    if (location.hash === '#youth' || location.hash === '#teen') return 'youth';
    if (location.hash === '#adult') return 'adult';
    try {
      var q = new URLSearchParams(location.search).get('side');
      if (q === 'teen') return 'youth';
      if (q === 'adult') return 'adult';
    } catch (e) { /* URLSearchParams 없는 옛 브라우저 */ }
    return 'adult';
  }
  function renderFaq() {
    var data = faqData(), tabs = $('#faq-tabs'), list = $('#faq-list');
    if (!list) return;
    function draw(k) {
      if (tabs) Array.prototype.forEach.call(tabs.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-selected', String(b.getAttribute('data-k') === k));
      });
      list.innerHTML = (data[k] || []).map(function (q, i) {
        var id = 'qa-' + k + '-' + i;
        return '<div class="qa"><button type="button" class="qa-q" aria-expanded="false" aria-controls="' + id + '">' + esc(q[0]) + '<i aria-hidden="true">+</i></button>' +
          '<div class="qa-a" id="' + id + '" hidden>' + q[1].filter(filled).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div></div>';
      }).join('');
    }
    if (tabs && !tabs.hidden) {
      tabs.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) draw(b.getAttribute('data-k')); });
    }
    list.addEventListener('click', function (e) {
      var q = e.target.closest('.qa-q'); if (!q) return;
      var open = q.getAttribute('aria-expanded') !== 'true';
      q.setAttribute('aria-expanded', String(open)); $('#' + q.getAttribute('aria-controls')).hidden = !open;
    });
    draw(faqStartKey());
  }
  function renderPrivacy() {
    $('#privacy').innerHTML = privacyItems().map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');
  }

  /* ── 공통: 머리말 · 꼬리말 · 하단 바 · 이전/다음 ── */
  // data-root: teen/ 아래 페이지는 "../" — 링크·스크립트 기준 경로
  var ROOT = document.body.getAttribute('data-root') || '';
  try {
    var sideQ = new URLSearchParams(location.search).get('side');
    if (sideQ === 'teen' || sideQ === 'adult') document.body.setAttribute('data-side', sideQ);
  } catch (e) { /* ignore */ }
  var PAGE = document.body.getAttribute('data-page') || 'home';
  var SIDE = document.body.getAttribute('data-side') || (PAGE === 'pick' || PAGE.indexOf('teen') === 0 ? 'teen' : (PAGE === 'gate' ? 'gate' : 'adult'));
  function href(path) { return ROOT + path; }
  // [id, 주소(루트 기준), 메뉴 이름]
  var ADULT_PAGES = [
    ['shelf', 'shelf.html', '후원현황'],
    ['about', 'about.html', '스토리'],
    ['donate', 'donate.html', '후원 참여'],
    ['faq', 'faq.html', 'Q&A']
  ];
  var TEEN_PAGES = [
    ['pick', 'pick.html', '고르기'],
    ['teen-status', 'teen/status.html', '내 신청'],
    ['teen-howto', 'teen/howto.html', '받는 법'],
    ['teen-ask', 'teen/ask.html', '문의']
  ];
  function pages() { return SIDE === 'teen' ? TEEN_PAGES : ADULT_PAGES; }
  function hubHref() {
    if (SIDE === 'teen') return href('teen/home.html');
    if (SIDE === 'adult') return href('adult.html');
    return href('index.html');
  }
  function brandHref() { return SIDE === 'gate' ? href('index.html') : hubHref(); }

  function renderChrome() {
    var head = $('#site-header');
    if (head) {
      var navHtml = '';
      if (SIDE === 'adult' || SIDE === 'teen') {
        navHtml = '<nav class="topnav' + (SIDE === 'teen' ? ' topnav-teen' : '') + '" aria-label="메뉴">' +
          pages().map(function (p) {
            return '<a href="' + href(p[1]) + '"' + (p[0] === PAGE ? ' aria-current="page"' : '') + '>' + p[2] + '</a>';
          }).join('') + '</nav>';
      }
      head.innerHTML = '<a class="brand" href="' + brandHref() + '">비북스 <span>청소년 책사줄게</span></a>' + navHtml +
        (PAGE === 'home' || PAGE === 'gate' ? '' : '<a class="menu-link" href="' + hubHref() + '#menu">전체 메뉴</a>') +
        (SIDE === 'adult' || SIDE === 'teen' ? '<a class="side-switch" href="' + href('index.html') + '">입구</a>' : '');
    }
    var foot = $('#site-footer');
    if (foot) {
      var links = contactLinks();
      var footExtra = SIDE === 'teen'
        ? '<nav class="foot-links" aria-label="안내"><a href="' + href('teen/ask.html') + '">문의</a><a href="' + href('faq.html') + '?side=teen#privacy-sec">개인정보</a></nav>'
        : '<nav class="foot-links" aria-label="안내"><a href="' + href('faq.html') + '#privacy-sec">개인정보와 익명 처리</a><a href="' + href('about.html') + '#sources">출처</a></nav>';
      foot.innerHTML = '<div class="wrap"><div class="foot-row"><div><p class="foot-brand">운영 비북스 · 부천 원미동</p>' +
        '<ul class="foot-contact">' + (links.length ? links.map(function (l) {
          return '<li>' + l[0] + ' <a href="' + esc(l[1]) + '"' + (l[0] === '인스타그램' ? ' target="_blank" rel="noopener"' : '') + '>' + esc(l[2]) + '</a></li>';
        }).join('') : '<li class="muted">연락처 준비 중</li>') + '</ul></div>' + footExtra + '</div>' +
        '<p class="small muted">청소년 책사줄게는 전국 동네서점이 함께하는 캠페인이에요. 부천 원미동 비북스에서도 함께 시작해요.</p></div>';
    }
    // 모바일 하단 바: 게이트·허브·고르기에는 두지 않음. 사이드별로 한 버튼만
    if (PAGE !== 'home' && PAGE !== 'gate' && PAGE !== 'pick') {
      var dockBtn = SIDE === 'teen'
        ? '<a class="btn btn-accent" href="' + href('pick.html') + '">책 고르기</a>'
        : '<a class="btn btn-primary" href="' + href('donate.html') + '">후원 참여</a>';
      if ((SIDE === 'teen' && PAGE !== 'pick') || (SIDE === 'adult' && PAGE !== 'donate')) {
        document.body.insertAdjacentHTML('beforeend', '<div class="dock show" aria-label="빠른 이동">' + dockBtn + '</div>');
      }
    }
    var nav = $('#page-nav');
    if (nav) {
      var ps = pages(), i = ps.map(function (p) { return p[0]; }).indexOf(PAGE);
      var prev = i > 0 ? ps[i - 1] : null, next = i >= 0 && i < ps.length - 1 ? ps[i + 1] : null;
      nav.innerHTML = (prev ? '<a class="pn prev" href="' + href(prev[1]) + '"><span>이전</span>' + prev[2] + '</a>' : '<a class="pn prev" href="' + hubHref() + '"><span>처음으로</span>메뉴</a>') +
        (next ? '<a class="pn next" href="' + href(next[1]) + '"><span>다음</span>' + next[2] + '</a>' : '<a class="pn next" href="' + hubHref() + '"><span>처음으로</span>메뉴</a>');
    }
  }

  function renderTeenStatus() {
    var box = $('#my-apply'); if (!box) return;
    var done = null;
    try { done = JSON.parse(localStorage.getItem('ybg-applied') || 'null'); } catch (e) { done = null; }
    if (done && done.id) {
      box.innerHTML = '<p class="done-h">신청이 기록돼 있어요.</p>' +
        '<dl class="teen-dl"><dt>접수번호</dt><dd><b>' + esc(done.id) + '</b></dd>' +
        (filled(done.nick) ? '<dt>닉네임</dt><dd>' + esc(done.nick) + '</dd>' : '') +
        (filled(done.book) ? '<dt>고른 책</dt><dd>' + esc(done.book) + '</dd>' : '') + '</dl>' +
        '<p class="small muted">책이 도착하면 연락처로 안내가 가요. <a href="' + href('teen/howto.html') + '">받는 법 보기</a></p>';
    } else {
      box.innerHTML = '<p>아직 이 기기에서 신청한 기록이 없어요.</p>' +
        '<p><a class="btn btn-accent" href="' + href('pick.html') + '">책 고르러 가기</a></p>';
    }
  }
  function renderTeenContact() {
    var box = $('#teen-contact'); if (!box) return;
    var links = contactLinks();
    box.innerHTML = '<h2>비북스에 묻기</h2><ul class="foot-contact">' +
      (links.length ? links.map(function (l) {
        return '<li>' + l[0] + ' <a href="' + esc(l[1]) + '"' + (l[0] === '인스타그램' ? ' target="_blank" rel="noopener"' : '') + '>' + esc(l[2]) + '</a></li>';
      }).join('') : '<li class="muted">연락처 준비 중</li>') + '</ul>';
  }
  function fillHowtoPlace() {
    var el = $('#howto-place'); if (el && filled(C.place)) el.textContent = C.place;
  }

  /* ── 첫 화면: 포스터 — 키가 자라는 아이들 (남·여 섞어서) ── */
  var PC = { ink: '#4a2018', sal: '#e09a7a', skin: '#f3ebe3', cream: '#efe0cf' };
  var KIDS = [
    { hair: 'long', top: 'dress' },
    { hair: 'short', top: 'stripe' },
    { hair: 'pony', top: 'raglan' },
    { hair: 'short', top: 'stripe', book: true },
    { hair: 'bob', top: 'jacket', book: true },
    { hair: 'shag', top: 'ink', book: true },
    { hair: 'long', top: 'jacket', book: true }
  ];
  var kidSeq = 0;
  function kid(i, n, x, H, k, G0) {
    var G = G0 || 430, t = i / (n - 1), o = [];
    var ry = H * (0.085 - 0.02 * t), rx = ry * 0.86, w = H * (0.25 - 0.06 * t);
    var cy = G - H + ry, neckY = cy + ry * 0.92, sh = neckY + H * 0.012;
    var hip = G - H * (0.40 + 0.06 * t), tb = hip + H * 0.03;
    var armW = w * 0.22, gap = w * 0.07, legW = (w * 0.86 - gap) / 2;
    function r(x0, y0, ww, hh, f, rr) { return '<rect x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + ww.toFixed(1) + '" height="' + hh.toFixed(1) + '"' + (rr ? ' rx="' + rr.toFixed(1) + '"' : '') + ' fill="' + f + '"/>'; }
    function e(cx0, cy0, ex, ey, f) { return '<ellipse cx="' + cx0.toFixed(1) + '" cy="' + cy0.toFixed(1) + '" rx="' + ex.toFixed(1) + '" ry="' + ey.toFixed(1) + '" fill="' + f + '"/>'; }
    var pid = 'st' + (kidSeq++), stripe = k.top === 'stripe';
    if (stripe) o.push('<defs><pattern id="' + pid + '" width="10" height="' + (H * 0.045).toFixed(1) + '" patternUnits="userSpaceOnUse">' +
      r(0, 0, 10, H * 0.045, PC.sal) + r(0, 0, 10, H * 0.022, PC.ink) + '</pattern></defs>');
    var shirt = stripe ? 'url(#' + pid + ')' : k.top === 'ink' || k.top === 'jacket' ? PC.ink : PC.sal;
    var sleeve = k.top === 'raglan' ? PC.ink : shirt;
    // 뒷머리
    if (k.hair === 'long') o.push(r(x - rx * 1.15, cy - ry * 0.3, rx * 2.3, sh - cy + H * 0.1, PC.ink, rx * 0.5));
    if (k.hair === 'bob') o.push(r(x - rx * 1.2, cy - ry * 0.3, rx * 2.4, ry * 1.3, PC.ink, rx * 0.45));
    if (k.hair === 'pony') o.push('<ellipse cx="' + (x + rx * 1.05).toFixed(1) + '" cy="' + (cy + ry * 0.1).toFixed(1) + '" rx="' + (rx * 0.38).toFixed(1) + '" ry="' + (ry * 0.8).toFixed(1) + '" fill="' + PC.ink + '" transform="rotate(-18 ' + (x + rx).toFixed(1) + ' ' + cy.toFixed(1) + ')"/>');
    o.push(e(x, cy - ry * 0.16, rx * 1.08, ry * 0.94, PC.ink)); // 머리 윗부분
    o.push(r(x - rx * 0.28, cy + ry * 0.6, rx * 0.56, sh - cy - ry * 0.5, PC.skin)); // 목
    // 다리
    o.push(r(x - legW - gap / 2, hip, legW, G - hip, PC.ink, legW * 0.2), r(x + gap / 2, hip, legW, G - hip, PC.ink, legW * 0.2));
    // 팔 (책을 든 아이는 팔이 책 높이까지)
    var armEnd = hip + H * 0.05;
    o.push(r(x - w / 2 - armW * 0.75, sh + H * 0.008, armW, armEnd - sh, sleeve, armW * 0.5), r(x + w / 2 - armW * 0.25, sh + H * 0.008, armW, armEnd - sh, sleeve, armW * 0.5));
    // 몸통
    if (k.top === 'dress') o.push('<path d="M' + (x - w / 2).toFixed(1) + ' ' + (sh + w * 0.2).toFixed(1) + ' Q' + (x - w / 2).toFixed(1) + ' ' + sh.toFixed(1) + ' ' + (x - w * 0.3).toFixed(1) + ' ' + sh.toFixed(1) +
      ' L' + (x + w * 0.3).toFixed(1) + ' ' + sh.toFixed(1) + ' Q' + (x + w / 2).toFixed(1) + ' ' + sh.toFixed(1) + ' ' + (x + w / 2).toFixed(1) + ' ' + (sh + w * 0.2).toFixed(1) +
      ' L' + (x + w * 0.62).toFixed(1) + ' ' + (hip + H * 0.13).toFixed(1) + ' L' + (x - w * 0.62).toFixed(1) + ' ' + (hip + H * 0.13).toFixed(1) + ' Z" fill="' + PC.sal + '"/>');
    else o.push(r(x - w / 2, sh, w, tb - sh, shirt, w * 0.22));
    if (k.top === 'jacket') o.push(r(x - w * 0.16, sh + 1, w * 0.32, tb - sh - 2, PC.sal));
    if (k.top === 'raglan') o.push(r(x - w * 0.18, sh, w * 0.36, H * 0.02, PC.ink)); // 목 둘레
    // 한 손에 든 책 (오른손)
    if (k.book) {
      var bw = w * 0.42, bh = w * 0.56, hx = x + w / 2 + armW * 0.25, by = armEnd - bh * 0.55;
      var cover = k.top === 'jacket' || k.top === 'ink' ? PC.sal : PC.cream;
      o.push(r(hx - bw * 0.35, by, bw, bh, cover, 1.5), r(hx - bw * 0.35, by, bw * 0.16, bh, PC.ink), r(hx - bw * 0.05, by + bh * 0.22, bw * 0.5, bh * 0.07, PC.ink));
      o.push('<circle cx="' + hx.toFixed(1) + '" cy="' + (armEnd - armW * 0.25).toFixed(1) + '" r="' + (armW * 0.5).toFixed(1) + '" fill="' + PC.skin + '"/>');
    }
    // 얼굴 · 앞머리 · 눈
    o.push(e(x, cy + ry * 0.08, rx, ry * 0.9, PC.skin));
    o.push(e(x, cy - ry * 0.56, rx * (k.hair === 'short' ? 0.98 : 1.04), ry * 0.46, PC.ink));
    if (k.hair === 'shag') o.push(r(x - rx * 1.06, cy - ry * 0.4, rx * 0.3, ry * 0.7, PC.ink, rx * 0.12), r(x + rx * 0.76, cy - ry * 0.4, rx * 0.3, ry * 0.7, PC.ink, rx * 0.12));
    o.push('<circle cx="' + (x - rx * 0.36).toFixed(1) + '" cy="' + (cy + ry * 0.22).toFixed(1) + '" r="' + (rx * 0.09).toFixed(1) + '" fill="' + PC.ink + '"/>',
      '<circle cx="' + (x + rx * 0.36).toFixed(1) + '" cy="' + (cy + ry * 0.22).toFixed(1) + '" r="' + (rx * 0.09).toFixed(1) + '" fill="' + PC.ink + '"/>');
    return '<g class="kid" style="animation-delay:' + (i * 90) + 'ms">' + o.join('') + '</g>';
  }
  function renderPoster() {
    var svg = $('#poster-kids'); if (!svg) return;
    var n = KIDS.length, left = 95, step = (1000 - left * 2) / (n - 1);
    svg.innerHTML = KIDS.map(function (k, i) { return kid(i, n, left + i * step, 200 + i * 30, k); }).join('');
    var d = $('#poster-date'); if (d) d.textContent = eventLine();
  }

  /* ── 이번 주 책 고르기 현황 (청소년) ──
   * 한 주(월~일)에 10명까지. 서버(action=week)가 센 숫자를 그대로 보여준다. */
  function loadWeek() {
    if (!filled(C.api)) return Promise.reject(new Error('no api'));
    return fetch(C.api + (C.api.indexOf('?') < 0 ? '?' : '&') + 'action=week', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error('bad'); return j; });
  }
  function fmtMD(iso) { var k = new Date(new Date(iso).getTime() + 9 * 3600 * 1000); return (k.getUTCMonth() + 1) + '.' + k.getUTCDate(); }
  function weekMsg(w) {
    return w.open ? '이번 주 ' + w.remaining + '명 더 신청할 수 있어요. 일요일 자정까지 받아요.'
      : '이번 주 책사줄게는 마감됐어요. 일요일 자정이 지나면(' + fmtMD(w.resetAt) + ' 월요일 0시부터) 새로 신청할 수 있어요.';
  }
  window.ybgWeek = loadWeek; window.ybgWeekMsg = weekMsg;
  function renderTeenWeek() {
    var card = $('#teen-week'); if (!card) return;
    function set(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
    loadWeek().then(function (w) {
      set('tw-used', w.used); set('tw-limit', '/ ' + w.limit + '권');
      set('tw-state', w.open ? '신청 중' : '이번 주 마감');
      card.classList.toggle('closed', !w.open);
      var bar = $('#tw-bar'); if (bar) { bar.firstElementChild.style.width = Math.min(100, Math.round(w.used / w.limit * 100)) + '%'; bar.setAttribute('aria-valuenow', w.used); bar.setAttribute('aria-valuemax', w.limit); }
      set('tw-msg', weekMsg(w));
      set('tw-books', w.books); set('tw-applied', w.applied); set('tw-left', w.left); set('tw-recv', w.received);
      var tot = Math.max(1, w.books), bar2 = $('#tw-bar2'); if (bar2) { bar2.firstElementChild.style.width = Math.min(100, Math.round(w.left / tot * 100)) + '%'; bar2.setAttribute('aria-valuenow', w.left); bar2.setAttribute('aria-valuemax', w.books); }
    }).catch(function () { set('tw-msg', '현황을 불러오지 못했어요. 잠시 뒤 다시 열어주세요.'); });
  }

  /* ── 후원현황: 첫 화면 히어로 + shelf.html 대시보드가 같이 쓰는 숫자 ── */
  function manShort(n) { n = Number(n) || 0; return n >= 10000 ? (Math.round(n / 1000) / 10).toString().replace(/\.0$/, '') + '만' : n.toLocaleString('ko-KR'); }
  function shelfTotals(rounds) {
    var meta = rounds.meta || {}, t = meta.totals, open = rounds.filter(function (r) { return !r.closed; });
    var r = open[open.length - 1] || rounds[rounds.length - 1] || { books: [] };
    var books = r.books.filter(function (b) { return !b.example; }).length;
    return {
      round: r, books: t ? t.books : books, amount: t ? t.amount : books * (Number(C.bookPrice) || 20000),
      donors: t ? t.donors : null, youth: t ? t.youth : 0, pending: Number(r.pending) || 0,
      list: meta.donors || [], got: meta.youth || []
    };
  }
  function fillStats(T) {
    function set(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
    set('st-books', T.books);
    set('st-amount', manShort(T.amount)); set('st-amount-goal', '원 · 책 ' + halfBooks(T.amount) + '권');
    set('st-donors', T.donors == null ? '–' : T.donors); set('st-youth', T.youth);
  }
  // 서가: 책이 늘면 칸도 늘어요(20칸 단위). 칸마다 책이 위에서 내려와 꽂힌다 (새 책은 반짝)
  function slotsHtml(T, goal) {
    var r = T.round, out = [];
    for (var i = 0; i < goal; i++) {
      var b = r.books[i];
      out.push(b ? '<i class="bk' + (isNew(b) ? ' new' : '') + (filled(b.youthCode) ? ' linked' : '') + '" style="--c:' + bookFill(b) + ';--h:' + (72 + hash((b.id || i) + 'h') % 24) + '%;--d:' + Math.min(i * 45, 1800) + 'ms"></i>' : '<i class="em"></i>');
    }
    return out.join('');
  }
  function renderStatusHero() {
    var box = $('#lp-shelf'); if (!box) return;
    box.innerHTML = slotsHtml({ round: { books: [] } }, 20);
    var cp = C.copy || {};
    ['seedTitle', 'seed', 'campaign'].forEach(function (k) { var el = document.getElementById('lp-' + k); if (el && filled(cp[k])) el.textContent = cp[k]; });
    loadShelfAny().then(function (rounds) {
      var T = shelfTotals(rounds);
      box.innerHTML = slotsHtml(T, Math.max(20, Math.ceil((T.round.books.length + 1) / 20) * 20));
      fillStats(T);
      setTimeout(function () { box.classList.add('go'); }, REDUCED ? 0 : 40);
    }).catch(function () { fillStats({ books: 0, amount: 0, donors: null, youth: 0 }); box.classList.add('go'); });
  }

  /* ── shelf.html 대시보드: 함께한 어른 · 책을 받은 청소년 · 사진 ── */
  function renderDash(rounds) {
    var T = shelfTotals(rounds); fillStats(T);
    var dl = $('#dash-donors');
    if (dl) dl.innerHTML = T.list.length ? T.list.map(function (d) {
      var name = d.anon || !filled(d.name) ? anonName() : d.name;
      return '<li' + (d.seed ? ' class="dn-seed"' : '') + '><span class="dn-name">' + esc(name) + (d.seed ? ' <em>' + (SIDE === 'teen' ? '씨앗 · 0.1평 점주' : '씨앗 펀딩 · 0.1평 점주') + '</em>' : '') + (d.org ? ' <em>단체</em>' : '') + '</span>' +
        (d.people > 1 ? '<span class="dn-books">' + d.people + '명</span>' : '') +
        (filled(d.line) ? '<span class="dn-line">“' + esc(d.line) + '”</span>' : '') + '<span class="dn-date">' + esc(fmtDate(d.at)) + '</span></li>';
    }).join('') : '<li class="dn-empty">첫 번째로 함께할 어른을 기다려요.' + (SIDE === 'teen' ? '' : ' <a href="' + href('donate.html') + '">후원 참여 →</a>') + '</li>';
    var yl = $('#dash-youth');
    if (yl) yl.innerHTML = T.got.length ? T.got.map(function (y) {
      var code = String(y.code).charAt(0) === '#' ? y.code : '#' + y.code;
      return '<li><span class="dn-name">' + esc(filled(y.name) ? y.name : '익명 청소년') + ' <em>' + esc(code) + '</em></span>' +
        (filled(y.title) ? '<span class="dn-line">“' + esc(y.title) + '”</span>' : '') + '</li>';
    }).join('') : '<li class="dn-empty">청소년이 책을 받으면 채워져요. 닉네임과 고른 책 제목이 보여요.</li>';
    var pg = $('#dash-photos');
    if (pg) {
      var ph = (C.photos || []).filter(function (x) { return x && x.src; });
      pg.innerHTML = ph.length ? ph.map(function (x) { return '<figure><img src="' + esc(x.src) + '" alt="' + esc(x.alt || '책을 받은 날') + '" loading="lazy"></figure>'; }).join('')
        : [0, 1, 2].map(function () { return '<figure class="ph-empty"><span>책을 받은 모습</span></figure>'; }).join('');
    }
    var pd = $('#dash-pending');
    if (pd) { pd.hidden = !T.pending; pd.textContent = T.pending ? '작은 후원이 모이는 중 · 다음 한 권까지 ' + won(T.pending) : ''; }
  }

  /* ── 네컷 만화 (스토리 · 후원 참여) ── 포스터의 아이 그림을 그대로 쓴다 */
  var INK = PC.ink, SAL = PC.sal, CREAM = PC.cream, SKY = '#b9c8ca';
  function sv(inner) { return '<svg viewBox="0 0 320 220" role="img" aria-hidden="true"><rect width="320" height="220" fill="' + SKY + '"/>' + inner + '<rect y="196" width="320" height="24" fill="' + SAL + '"/><rect y="192" width="320" height="5" fill="' + INK + '"/></svg>'; }
  function R(x, y, w, h, f, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (r ? ' rx="' + r + '"' : '') + ' fill="' + f + '"/>'; }
  function T_(x, y, t, size, f, anchor) { return '<text x="' + x + '" y="' + y + '" font-size="' + (size || 13) + '" font-weight="900" fill="' + (f || INK) + '" text-anchor="' + (anchor || 'middle') + '" font-family="Pretendard Variable, Pretendard, sans-serif">' + t + '</text>'; }
  function shelfProp(x, y, w, rows, filledN) {
    var o = R(x, y, w, rows * 30 + 6, CREAM, 3), k = 0;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < Math.floor((w - 8) / 9); c++) { k++; if (k <= filledN) o += R(x + 5 + c * 9, y + 6 + r * 30 + (k % 3) * 2, 7, 22 - (k % 3) * 2, BOOK_COLORS[k % BOOK_COLORS.length], 1); }
      o += R(x, y + 30 + r * 30, w, 4, INK);
    }
    return o;
  }
  function adult(x, k) { return kid(6, 7, x, 158, k || { hair: 'short', top: 'jacket' }, 192); }
  function teen(x, k, H) { return kid(3, 7, x, H || 128, k || { hair: 'pony', top: 'raglan' }, 192); }
  var COMICS = {
    // 스토리 컷 순서: 그림 2 → 3 → 1 → 4 (번호는 화면 순서대로 1~4)
    story: [
      ['청소년 책사줄게란?', function () { return sv(adult(70) + R(140, 120, 40, 50, CREAM, 3) + R(140, 120, 7, 50, INK) + '<path d="M120 100 h80" stroke="' + INK + '" stroke-width="4" marker-end="url(#ar)"/>' +
        '<defs><marker id="ar" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="' + INK + '"/></marker></defs>' + teen(250, { hair: 'bob', top: 'stripe', book: true })); },
        '어른이 책값을 내고, 청소년이 읽고 싶은 책 한 권을 스스로 골라 가져요.'],
      ['청주에서 전국으로, 부천까지', function () {
        var pin = function (x, y, label, big) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (big ? 11 : 8) + '" fill="' + (big ? SAL : INK) + '" stroke="' + INK + '" stroke-width="3"/>' + T_(x, y + 30, label, big ? 14 : 12); };
        return sv('<path d="M40 130 C90 60 150 150 200 90 S270 60 290 100" fill="none" stroke="' + INK + '" stroke-width="3" stroke-dasharray="6 6"/>' +
          pin(40, 130, '청주') + pin(120, 95, '전국') + pin(200, 92, '빛나는친구들', false) + pin(290, 100, '비북스', true) + T_(200, 150, '부천', 12) + T_(290, 150, '부천', 12));
      }, '충북 청주의 동네책방에서 시작해 전국 동네서점으로 번졌고, 부천에서는 빛나는친구들이 먼저 함께했어요.'],
      ['한 사람으로부터', function () { return sv(R(150, 120, 70, 72, CREAM, 4) + R(150, 120, 70, 8, INK) + T_(185, 165, '0.1평', 15) + '<ellipse cx="248" cy="168" rx="16" ry="6" fill="' + INK + '"/>' + R(236, 150, 24, 20, SAL, 3) +
        '<path d="M248 150 C246 136 238 128 230 126 C236 136 240 142 248 150 Z" fill="#6f8f95"/><path d="M248 150 C252 134 262 128 270 128 C264 138 258 144 248 150 Z" fill="#6f8f95"/>' + adult(95, { hair: 'long', top: 'jacket' })); },
        '0.1평 점주 한 분이 부천 청소년을 위해 씨앗 펀딩을 맡겼어요.'],
      ['부천 원미동에서도', function () {
        var awn = ''; for (var a = 0; a < 8; a++) awn += R(70 + a * 22, 70, 22, 18, a % 2 ? CREAM : SAL);
        return sv(R(70, 88, 176, 104, CREAM) + awn + T_(158, 64, '비북스', 16) + shelfProp(84, 100, 90, 2, 16) + R(190, 120, 42, 72, INK, 3) +
          teen(40, { hair: 'short', top: 'stripe' }, 112) + teen(290, { hair: 'long', top: 'dress' }, 104));
      }, '그리고 부천 원미동 비북스에서도 함께 시작해요.']
    ],
    donate: [
      ['어른이 건네요', function () { return sv(adult(90) + R(150, 104, 64, 34, CREAM, 4) + R(150, 104, 64, 34, 'none') + '<rect x="150" y="104" width="64" height="34" rx="4" fill="none" stroke="' + INK + '" stroke-width="3"/>' + T_(182, 127, '2만 원', 13) + T_(250, 80, '= 책 1권', 15)); },
        '어른이 책 한 권 값(2만 원)부터 건네요. 몇 권이든 좋아요.'],
      ['비북스가 모아요', function () { return sv(R(60, 92, 86, 100, CREAM, 10) + '<rect x="60" y="92" width="86" height="100" rx="10" fill="none" stroke="' + INK + '" stroke-width="3"/>' + R(72, 80, 62, 14, INK, 4) +
        '<circle cx="90" cy="160" r="11" fill="' + SAL + '"/><circle cx="114" cy="168" r="11" fill="' + SAL + '"/><circle cx="103" cy="142" r="11" fill="' + SAL + '"/>' +
        R(180, 70, 110, 100, CREAM, 4) + R(194, 140, 16, 20, INK) + R(218, 120, 16, 40, SAL) + R(242, 100, 16, 60, INK) + R(266, 86, 16, 74, SAL) + T_(235, 92, '공개', 12)); },
        '비북스가 후원금을 따로 모아 두고, 모인 금액과 쓴 곳을 모두 공개해요.'],
      ['청소년이 골라요', function () { return sv(shelfProp(150, 62, 150, 4, 60) + teen(90, { hair: 'pony', top: 'raglan' }, 134)); },
        '부천 청소년이 읽고 싶은 책을 스스로 골라요. 신청이 들어오면 비북스가 주문해 준비해요.'],
      ['내 책이 돼요', function () { return sv(teen(110, { hair: 'bob', top: 'jacket', book: true }, 146) + R(190, 110, 100, 82, CREAM, 4) + R(190, 150, 100, 4, INK) +
        R(200, 116, 9, 34, INK) + R(212, 120, 9, 30, SAL) + R(224, 114, 9, 36, '#6f8f95') + '<rect x="238" y="112" width="9" height="38" fill="' + SAL + '" class="cm-new"/>' + T_(240, 180, '한 칸 채움', 12)); },
        '빌리지 않고, 내 이름으로 갖는 책이 돼요. 후원현황 서가에도 한 칸이 채워져요.']
    ]
  };
  // 그린 그림이 있는 컷은 그림으로 (없으면 위의 SVG 그림)
  var COMIC_ART = {
    story: [
      ['images/story/2.webp', '어른이 상자에 책값을 넣고, 옆에서 청소년이 서가의 책을 골라요.'],
      ['images/story/3.webp', '작은 책방에서 서가를 지나 큰 서점까지 점선 길이 이어지고, 사람들이 책을 들고 걸어가요.'],
      ['images/story/1.webp', '0.1평 서가 앞에서 한 어른이 책을 꽂고 있어요.'],
      ['images/story/4.webp', '비북스 가게 문 앞에서 점주가 책을 든 청소년을 맞이해요.']
    ],
    donate: [
      ['images/donate/1.webp', '어른이 2만 원이라고 적힌 봉투를 상자에 넣고, 옆에 책 한 권이 놓여 있어요.'],
      ['images/donate/2.webp', '동전이 담긴 유리병 옆에 「모인 금액」과 「사용 내역」이 적힌 표가 놓여 있어요.'],
      ['images/donate/3.webp', '청소년이 서가에서 읽고 싶은 책 한 권을 골라 꺼내요.'],
      ['images/donate/4.webp', '청소년이 책을 품에 안고 웃고, 옆 서가에 「한 칸 채움」이라고 적혀 있어요.']
    ]
  };
  function renderComics() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-comic]'), function (box) {
      var set = COMICS[box.getAttribute('data-comic')]; if (!set) return;
      var art = COMIC_ART[box.getAttribute('data-comic')] || [];
      box.innerHTML = set.map(function (c, i) {
        var pic = art[i] ? '<img src="' + art[i][0] + '" alt="' + esc(art[i][1]) + '" width="1499" height="1049" loading="' + (i ? 'lazy' : 'eager') + '" decoding="async">' : c[1]();
        return '<li class="cm"><div class="cm-pic' + (art[i] ? ' cm-art' : '') + '">' + pic + '<span class="cm-n">' + (i + 1) + '</span></div><h3>' + esc(c[0]) + '</h3><p>' + esc(c[2]) + '</p></li>';
      }).join('');
    });
  }

  // 책 고르기 페이지를 끄면 링크를 숨긴다
  if ((C.pick || {}).enabled === false) Array.prototype.forEach.call(document.querySelectorAll('[data-pick]'), function (el) { el.hidden = true; });

  // 페이지마다 있는 부분만 그린다
  renderChrome();
  if ($('#hero-title')) renderHero();
  renderPoster(); renderStatusHero(); renderComics();
  if ($('#diff-cards')) renderDiff();
  if ($('#steps-list')) renderSteps();
  if ($('#amount-btns')) renderDonate();
  fillConsent(); initDonateForm();
  if ($('#youth-info')) renderYouth();
  if ($('#org-package')) renderOrg();
  if ($('#faq-list')) renderFaq();
  if ($('#privacy')) renderPrivacy();
  if ($('#shelf-wrap')) initShelf();
  renderTeenStatus(); renderTeenContact(); fillHowtoPlace();
  renderTeenWeek();
})();
