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
    B: { title: '어른이 건네고,<br>청소년이 고릅니다.<br><em>비북스가 잇습니다.</em>', sub: '' },
    C: { title: '빌리는 책 말고,<br><em>갖는 책</em>', sub: '책값은 어른들이 낼게요. 고르는 건 너의 몫.' }
  };
  function eventLine() {
    if (!filled(C.eventDate)) return '11월 말 토요일, 비북스에서 (날짜 결정 필요)';
    return [C.eventDate, C.eventTime].filter(filled).join(' ') + (filled(C.place) ? ' · ' + C.place : '');
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
    archive: ['내일의 서재 아카이브', '회차마다 쌓이는 서가와 어른들의 한 줄을 남겨요.'],
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
    ['받는 날', '정해진 토요일, 비북스에서 고른 책을 받아가요. 신청을 못 했으면 그날 서가에서 골라요.'],
    ['내일의 서재', '고른 책과 어른들의 한 줄이 회차마다 서가로 쌓여요.']
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
    if (filled(r.targetBooks)) html += '<span class="shelf-count">꽂힌 책 <b>' + real + '</b> / ' + r.targetBooks + '권</span>';
    else html += '<span class="shelf-count">꽂힌 책 <b>' + real + '</b>권</span>' + (r.closed ? '' : '<span class="badge">목표 권수 준비 중</span>');
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
    var total = Math.max(filled(r.targetBooks) ? Number(r.targetBooks) : (r.closed ? 0 : DEFAULT_SLOTS), r.books.length);
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
      var label = displayName(b) + '님이 건넨 책' + (b.example ? ', 예시' : '');
      svg += '<g class="book' + (isNew(b) ? ' new' : '') + (b.example ? ' example' : '') + '" tabindex="0" role="button" aria-haspopup="dialog" data-i="' + i +
        '" aria-label="' + esc(label) + '" style="animation-delay:' + Math.round(i * delayStep) + 'ms">' +
        '<rect class="cover" x="' + x + '" y="' + y + '" width="' + bookW + '" height="' + h + '" rx="2" style="fill:' + bookFill(b) + '"/>' +
        '<rect class="spine-line" x="' + x + '" y="' + (y + h * 0.16) + '" width="' + bookW + '" height="2.5"/>' +
        '<rect class="spine-line" x="' + x + '" y="' + (y + h * 0.78) + '" width="' + bookW + '" height="1.5"/>' +
        '<rect class="glow" x="' + (x - 3) + '" y="' + (y - 3) + '" width="' + (bookW + 6) + '" height="' + (h + 6) + '" rx="4"/>' +
        '<rect class="focus-ring" x="' + (x - 3) + '" y="' + (y - 3) + '" width="' + (bookW + 6) + '" height="' + (h + 6) + '" rx="4"/></g>';
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
    var youth = filled(b.youthCode) ? '청소년 ' + (String(b.youthCode).charAt(0) === '#' ? b.youthCode : '#' + b.youthCode) : '받는 날 이후 연결돼요';
    card.innerHTML =
      '<button type="button" class="bc-close" aria-label="닫기">×</button>' +
      '<span class="bc-mind">건넨 어른' + (b.example ? ' · 예시' : '') + '</span>' +
      '<h4 id="bc-name">' + esc(displayName(b)) + '</h4>' +
      (b.public && filled(b.line) ? '<p class="bc-line">“' + esc(b.line) + '”</p>' : (b.public ? '' : '<p class="bc-line muted">이름 없이 건넨 책이에요.</p>')) +
      (b.pooled ? '<p class="bc-pooled">작은 후원 ' + b.pooled + '건이 모여 한 권이 됐어요.</p>' : '') +
      '<dl><dt>연결</dt><dd>' + esc(youth) + '</dd>' +
      (filled(b.genre || isbnGenre[b.isbn]) ? '<dt>고른 분야</dt><dd>' + esc(b.genre || isbnGenre[b.isbn]) + '</dd>' : '') +
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

  var isbnGenre = {}; // 청소년이 분야 공개에 동의하면 시트가 ISBN을 주고, 분야는 책 목록에서 찾는다
  function initShelf() {
    bindShelf();
    fetch(((C.pick || {}).booksSource) || 'data/books.json').then(function (r) { return r.json(); }).then(function (d) {
      (d.books || []).forEach(function (b) { if (b.isbn && b.genre) isbnGenre[b.isbn] = b.genre; });
    }).catch(function () {});
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
  var amount = 0;
  function renderDonate() {
    var steps = (C.donationSteps || []).map(function (x) { return typeof x === 'number' ? { amount: x, label: manwon(x) } : x; })
      .filter(function (x) { return x && x.amount > 0; });
    $('#amount-btns').innerHTML = steps.map(function (x) {
      return '<button type="button" aria-pressed="false" data-amount="' + x.amount + '"><b>' + esc(x.label || manwon(x.amount)) + '</b><span>' + manwon(x.amount) + '</span></button>';
    }).join('');
    $('#amount-btns').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      amount = Number(b.getAttribute('data-amount'));
      $('#free-amount').value = '';
      setPressed(b); calc();
    });
    $('#free-amount').addEventListener('input', function () {
      var digits = this.value.replace(/[^\d]/g, '').slice(0, 9);
      amount = Number(digits) || 0;
      this.value = digits ? Number(digits).toLocaleString('ko-KR') : '';
      setPressed(null); calc();
    });
    if (filled(C.goalAmount)) { $('#goal').hidden = false; $('#goal').textContent = '1회차 목표: ' + (C.targetBooks || 50) + '권 · ' + won(C.goalAmount); }

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
    var da = $('#d-amount'); if (da) da.value = amount ? amount.toLocaleString('ko-KR') : '';
    var el = $('#books-calc'), price = Number(C.bookPrice);
    if (!price || !amount) { el.hidden = true; return; }
    var n = Math.floor(amount / price);
    el.hidden = false;
    el.innerHTML = n >= 1 ? '책 <b>' + n + '권</b>이 서가에 꽂혀요.'
      : '책 한 권 값은 ' + won(price) + '이에요. 이 마음은 다른 후원과 모여 한 권이 돼요.';
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
    var keep = filled(C.retention) ? C.retention : '정해지는 대로 알려드려요';
    var items = kind === 'donate'
      ? ['수집 항목: 이름·닉네임, 연락처, 이메일, 후원 금액, 입금자명, (현금영수증 신청 시) 발급 번호',
         '쓰는 곳: 입금 확인, 현금영수증 발급, 서가 반영과 결과 안내']
      : ['수집 항목: 닉네임, 학년, 학교 이름, 연락처, 이메일, 고른 책',
         '쓰는 곳: 부천 지역 청소년인지 확인, 책 주문과 받는 날 안내',
         '실명과 가정 형편은 묻지 않아요. 학교 이름은 공개하지 않아요'];
    items.push('보관 기간: ' + keep + ' 뒤 지워요');
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
    // 만화 → 금액 → '후원 신청하기'를 눌러야 폼이 열린다
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
    $('#d-amount').addEventListener('input', function () {
      var d = digits(this.value).slice(0, 9); amount = Number(d) || 0;
      this.value = d ? Number(d).toLocaleString('ko-KR') : ''; setPressed(null);
      var fa = $('#free-amount'); if (fa) fa.value = this.value;
      var el = $('#books-calc'), price = Number(C.bookPrice), n = price ? Math.floor(amount / price) : 0;
      if (price && amount) { el.hidden = false; el.innerHTML = n >= 1 ? '책 <b>' + n + '권</b>이 서가에 꽂혀요.' : '책 한 권 값은 ' + won(price) + '이에요. 이 마음은 다른 후원과 모여 한 권이 돼요.'; } else el.hidden = true;
    });
    $('#d-receipt').addEventListener('change', function () { $('#d-receipt-row').hidden = !this.checked; });
    Array.prototype.forEach.call(form.elements.kind, function (r) {
      r.addEventListener('change', function () { var org = form.elements.kind.value !== '개인'; $('#d-org-row').hidden = !org; form.elements.org.required = org; });
    });
    $('#d-anon').addEventListener('change', function () { $('#d-line-row').classList.toggle('dim', this.checked); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); msg.textContent = '';
      var err = checkFields(form, [
        ['name', null, '이름이나 닉네임을 적어주세요.'], ['phone', isPhone, '연락처를 확인해 주세요. (예: 010-1234-5678)'],
        ['email', isEmail, '이메일을 확인해 주세요.'], ['amount', function (el) { return Number(digits(el.value)) >= 1000; }, '후원 금액을 적어주세요. (1,000원 이상)'],
        ['org', function (el) { return form.elements.kind.value === '개인' || !!el.value.trim(); }, '기관·단체 이름을 적어주세요.'],
        ['payer', null, '입금자명을 적어주세요.'], ['consent', isChecked, '개인정보 수집·이용에 동의해 주세요.']
      ]);
      if (err) { msg.textContent = err; return; }
      var f = form.elements;
      btn.disabled = true; btn.textContent = '보내는 중…';
      post('donate', {
        name: f.name.value, phone: f.phone.value, email: f.email.value, kind: f.kind.value, amount: digits(f.amount.value),
        org: f.org.value, payer: f.payer.value, line: f.line.value, anon: f.anon.checked,
        receipt: f.receipt.checked, receiptNo: f.receiptNo.value, consent: f.consent.checked
      }, f.website.value).then(function (res) {
        if (!res.ok) throw new Error(res.error || '접수하지 못했어요.');
        var a = C.account || {}, done = $('#donate-done');
        form.hidden = true; done.hidden = false;
        done.innerHTML = '<p class="done-h">후원 접수가 됐어요. 고맙습니다.</p><p>접수번호 <b>' + esc(res.id) + '</b></p>' +
          '<p>아직 입금 전이라면 아래 계좌로 보내주세요. 입금이 확인되면 서가에 책이 꽂혀요.</p>' +
          (filled(a.number) ? '<p class="done-acc">' + esc(a.bank) + ' ' + esc(a.number) + ' · ' + esc(a.holder) + '<br>입금자명 ' + esc(f.payer.value) + ' · ' + won(digits(f.amount.value)) + '</p>' : '') +
          '<a class="btn btn-ghost" href="shelf.html">후원현황 보러 가기</a>';
        done.focus();
      }).catch(function (err) {
        msg.textContent = err.message === 'Failed to fetch' ? '보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러주세요.' : err.message;
        btn.disabled = false; btn.textContent = '후원 신청하기';
      });
    });
  }

  /* ── [7] 신청 안내 ────────────────────────── */
  function renderYouth() {
    var date = filled(C.eventDate) ? [C.eventDate, C.eventTime].filter(filled).join(' ') : '정해지는 대로 알려드려요';
    var who = (filled(C.regionLimit) ? C.regionLimit + ' ' : '') + (filled(C.ageRange) ? C.ageRange + ' 청소년' : '청소년') + ', 학교 밖 청소년도 괜찮아요';
    var items = [
      ['날짜', date],
      ['장소', C.place || '비북스'],
      ['대상', who],
      null,
      filled(C.applyDeadlineLabel) ? ['신청 마감', C.applyDeadlineLabel + '까지 (그 뒤엔 행사 날 비북스에서 직접 골라요)'] : null,
      ['책', '한 사람이 한 권' + (filled(C.bookPrice) ? ' (정가 ' + won(C.bookPrice) + ' 이하)' : '') + '. 추천 목록에서 고르거나, 읽고 싶은 책을 직접 골라요'],
      ['묻지 않아요', '실명, 가정 형편 (학교 이름은 지역 확인에만 써요)'],
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
      : '<p class="lead">학교, 동아리, 회사에서 함께 건네고 싶다면 편하게 물어봐 주세요.</p><span class="soon">패키지 준비 중</span>';
    var links = contactLinks();
    $('#org-contact').innerHTML = links.length
      ? links.map(function (l, i) { return '<a class="btn ' + (i ? 'btn-ghost' : 'btn-primary') + '" href="' + esc(l[1]) + '"' + (l[0] === '인스타그램' ? ' target="_blank" rel="noopener"' : '') + '>' + l[0] + '로 문의</a>'; }).join('')
      : '<span class="soon">문의처 준비 중</span>';
  }

  /* ── [9] FAQ · [10] 개인정보 ───────────────── */
  function privacyItems() {
    return [
      '실명, 학교, 얼굴 사진은 공개하지 않아요.',
      '행사 사진은 손과 책 위주로 찍어요. 얼굴은 본인이 동의할 때만 담아요.',
      '청소년 코드는 회차별 순번(#07처럼)만 써요. 다른 정보와 합쳐도 누군지 알 수 없게요.',
      '고른 책은 분야까지만 공개해요. 제목은 본인이 원할 때만요.',
      '모은 정보는 회차가 끝나면 정리해요. 보관 기간: ' + (filled(C.retention) ? C.retention : '정해지는 대로 알려드려요') + '.',
      '모인 금액, 전달한 권수, 남은 금액 처리는 회차가 끝난 뒤 공지해요.'
    ];
  }
  function faqData() {
    var fa = C.faqAnswers || {}, price = Number(C.bookPrice) || 20000;
    var who = (filled(C.regionLimit) ? C.regionLimit + ' ' : '') + (filled(C.ageRange) ? C.ageRange + ' ' : '') +
      '청소년이면 누구나 신청할 수 있어요. 학교에 다니지 않는 청소년도 괜찮아요. 학교 이름은 지역 확인에만 쓰고 공개하지 않아요.';
    var when = [C.eventDate, C.eventTime].filter(filled).join(' ');
    return {
      adult: [
        ['얼마부터 후원할 수 있나요?', ['책 한 권 값 ' + won(price) + '이 한 칸이에요. 1권 · 5권(' + manwon(price * 5) + ') · 50권(' + manwon(price * 50) + ') 중에서 고르거나 원하는 금액을 직접 적어도 돼요.',
          won(price) + '보다 적은 후원은 다른 후원과 모여 한 권이 돼요.']],
        ['후원금은 어디에 쓰이나요?', ['부천 청소년이 스스로 고른 책을 사는 데만 써요. 신청이 들어오면 비북스가 책을 주문해 준비해요.']],
        ['남으면 어떻게 되나요?', [filled(fa.leftover) ? fa.leftover : NOT_YET]],
        ['영수증을 받을 수 있나요?', [filled(fa.receipt) ? fa.receipt : NOT_YET]],
        ['이름을 밝히지 않고 후원할 수 있나요?', ['네. 후원 신청할 때 "' + anonName() + '로 참여"에 체크하면 후원현황과 서가에 이름과 한 줄이 보이지 않아요. "' + anonName() + '"로만 표시돼요.']],
        ['기관·단체·기업·교회도 함께할 수 있나요?', ['네. 후원 신청할 때 "기관·단체·기업·교회"를 고르고 이름을 적어주세요. 한 반, 한 동아리 몫처럼 여러 권을 함께 건넬 수도 있어요. 궁금한 건 아래 연락처로 물어봐 주세요.']]
      ],
      youth: [
        ['누가 신청할 수 있나요?', [who]],
        ['정말 무료예요?', ['네, 무료예요. 책값은 어른들이 미리 냈어요. 한 사람이 한 권(정가 ' + won(price) + ' 이하)을 받아요.']],
        ['부모님과 같이 가도 되나요?', ['같이 와도 괜찮아요. 다만 책을 고르는 동안은 청소년만 서가 구역에 들어가고, 보호자는 카페 공간에서 기다려요. 만 14세 미만은 보호자 동의가 필요해서 비북스로 먼저 연락 주세요.']],
        ['내 이름이나 고른 책이 공개되나요?', ['실명, 학교, 얼굴 사진은 공개하지 않아요. 청소년 코드(#07처럼)와, 동의한 경우 고른 책의 분야만 보여요.']],
        ['어떻게 고르고, 언제 받나요?', ['"책 고르기"에서 추천 목록을 보고 고르거나, 목록에 없는 책을 직접 적어 신청해요. ' + (((C.pick || {}).customRule) || ''),
          (filled(C.applyDeadlineLabel) ? '온라인 신청은 ' + C.applyDeadlineLabel + '까지예요. ' : '') + (when ? '책은 ' + when + ' 비북스에서 받아가요.' : '')]]
      ]
    };
  }
  function renderFaq() {
    var data = faqData(), tabs = $('#faq-tabs'), list = $('#faq-list');
    function draw(k) {
      Array.prototype.forEach.call(tabs.querySelectorAll('button'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-k') === k)); });
      list.innerHTML = data[k].map(function (q, i) {
        var id = 'qa-' + k + '-' + i;
        return '<div class="qa"><button type="button" class="qa-q" aria-expanded="false" aria-controls="' + id + '">' + esc(q[0]) + '<i aria-hidden="true">+</i></button>' +
          '<div class="qa-a" id="' + id + '" hidden>' + q[1].filter(filled).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div></div>';
      }).join('');
    }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) draw(b.getAttribute('data-k')); });
    list.addEventListener('click', function (e) {
      var q = e.target.closest('.qa-q'); if (!q) return;
      var open = q.getAttribute('aria-expanded') !== 'true';
      q.setAttribute('aria-expanded', String(open)); $('#' + q.getAttribute('aria-controls')).hidden = !open;
    });
    draw(location.hash === '#youth' ? 'youth' : 'adult');
  }
  function renderPrivacy() {
    $('#privacy').innerHTML = privacyItems().map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');
  }

  /* ── 공통: 머리말 · 꼬리말 · 하단 바 · 이전/다음 ── */
  // [id, 주소, 메뉴 이름, 블록 설명]
  var PAGES = [
    ['shelf', 'shelf.html', '후원현황', '지금까지 모인 책과 금액이에요.'],
    ['about', 'about.html', '스토리', '한 사람으로부터 시작된 이야기예요.'],
    ['donate', 'donate.html', '후원 참여', '책 한 권 값부터 함께해요.'],
    ['faq', 'faq.html', 'Q&A', '어른과 청소년이 자주 묻는 것들이에요.'],
    ['pick', 'pick.html', '책 고르기', '부천 청소년이면 누구나 한 권을 골라요.']
  ];
  var NAV = { shelf: '후원현황', about: '스토리', donate: '후원 참여', faq: 'Q&A', pick: '책 고르기' };
  var PAGE = document.body.getAttribute('data-page') || 'home';
  function pickOff(id) { return id === 'pick' && (C.pick || {}).enabled === false; }
  function pages() { return PAGES.filter(function (p) { return !pickOff(p[0]); }); }

  function renderChrome() {
    var head = $('#site-header');
    if (head) {
      head.innerHTML = '<a class="brand" href="index.html">비북스 <span>청소년 책사줄게</span></a>' +
        '<nav class="topnav" aria-label="메뉴">' + pages().filter(function (p) { return NAV[p[0]]; }).map(function (p) {
          return '<a href="' + p[1] + '"' + (p[0] === PAGE ? ' aria-current="page"' : '') + '>' + NAV[p[0]] + '</a>';
        }).join('') + '</nav>' +
        (PAGE === 'home' ? '' : '<a class="menu-link" href="index.html#menu">전체 메뉴</a>');
    }
    var foot = $('#site-footer');
    if (foot) {
      var links = contactLinks();
      foot.innerHTML = '<div class="wrap"><div class="foot-row"><div><p class="foot-brand">운영 비북스 · 부천 원미동</p>' +
        '<ul class="foot-contact">' + (links.length ? links.map(function (l) {
          return '<li>' + l[0] + ' <a href="' + esc(l[1]) + '"' + (l[0] === '인스타그램' ? ' target="_blank" rel="noopener"' : '') + '>' + esc(l[2]) + '</a></li>';
        }).join('') : '<li class="muted">연락처 준비 중</li>') + '</ul></div>' +
        '<nav class="foot-links" aria-label="안내"><a href="faq.html#privacy-sec">개인정보와 익명 처리</a><a href="about.html#sources">출처</a></nav></div>' +
        '<p class="small muted">청소년 책사줄게는 전국 동네서점이 함께하는 캠페인이에요. 원미동 비북스는 부천에서 두 번째로 함께해요.</p></div>';
    }
    // 모바일 하단 바: 첫 화면과 책 고르기에는 두지 않는다
    if (PAGE !== 'home' && PAGE !== 'pick') {
      var btns = [['donate', 'donate.html', '후원 참여', 'btn-primary'], ['pick', 'pick.html', '책 고르기', 'btn-accent']]
        .filter(function (b) { return b[0] !== PAGE && !pickOff(b[0]); });
      if (btns.length) document.body.insertAdjacentHTML('beforeend', '<div class="dock show" aria-label="빠른 이동">' + btns.map(function (b) {
        return '<a class="btn ' + b[3] + '" href="' + b[1] + '">' + b[2] + '</a>';
      }).join('') + '</div>');
    }
    var nav = $('#page-nav');
    if (nav) {
      var ps = pages(), i = ps.map(function (p) { return p[0]; }).indexOf(PAGE);
      var prev = ps[i - 1], next = ps[i + 1];
      nav.innerHTML = (prev ? '<a class="pn prev" href="' + prev[1] + '"><span>이전</span>' + prev[2] + '</a>' : '<a class="pn prev" href="index.html"><span>처음으로</span>전체 메뉴</a>') +
        (next ? '<a class="pn next" href="' + next[1] + '"><span>다음</span>' + next[2] + '</a>' : '<a class="pn next" href="index.html"><span>처음으로</span>전체 메뉴</a>');
    }
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
    var goalB = Number(C.targetBooks) || 50, goalA = Number(C.goalAmount) || goalB * (Number(C.bookPrice) || 20000);
    function set(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
    set('st-books', T.books); set('st-books-goal', '/ ' + goalB + '권');
    set('st-amount', manShort(T.amount)); set('st-amount-goal', '/ ' + manShort(goalA) + ' 원');
    set('st-donors', T.donors == null ? '–' : T.donors); set('st-youth', T.youth);
    var pct = Math.min(100, Math.round(T.amount / goalA * 100));
    var bar = document.getElementById('st-bar'); if (bar) bar.style.width = pct + '%';
    set('st-pct', pct + '%');
    var bar2 = document.getElementById('st-bar-l'); if (bar2) bar2.setAttribute('aria-valuenow', pct);
  }
  // 50칸 서가: 칸마다 책이 위에서 내려와 꽂힌다 (새 책은 반짝)
  function slotsHtml(T, goal) {
    var r = T.round, out = [];
    for (var i = 0; i < goal; i++) {
      var b = r.books[i];
      out.push(b ? '<i class="bk' + (isNew(b) ? ' new' : '') + '" style="--c:' + bookFill(b) + ';--h:' + (72 + hash((b.id || i) + 'h') % 24) + '%;--d:' + Math.min(i * 45, 1800) + 'ms"></i>' : '<i class="em"></i>');
    }
    return out.join('');
  }
  function renderStatusHero() {
    var box = $('#lp-shelf'); if (!box) return;
    var goal = Number(C.targetBooks) || 50;
    box.innerHTML = slotsHtml({ round: { books: [] } }, goal);
    var cp = C.copy || {};
    ['seedTitle', 'seed', 'campaign'].forEach(function (k) { var el = document.getElementById('lp-' + k); if (el && filled(cp[k])) el.textContent = cp[k]; });
    var d = $('#lp-date'); if (d) d.textContent = (C.eventDate ? '책 고르는 날 ' + C.eventDate : '');
    loadShelfAny().then(function (rounds) {
      var T = shelfTotals(rounds);
      box.innerHTML = slotsHtml(T, goal);
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
      return '<li><span class="dn-name">' + esc(name) + (d.org ? ' <em>단체</em>' : '') + '</span>' +
        '<span class="dn-books">' + (d.books >= 1 ? '책 ' + d.books + '권' : '작은 후원') + '</span>' +
        (filled(d.line) ? '<span class="dn-line">“' + esc(d.line) + '”</span>' : '') + '<span class="dn-date">' + esc(fmtDate(d.at)) + '</span></li>';
    }).join('') : '<li class="dn-empty">첫 번째로 함께할 어른을 기다려요. <a href="donate.html">후원 참여 →</a></li>';
    var yl = $('#dash-youth');
    if (yl) yl.innerHTML = T.got.length ? T.got.map(function (y) {
      var g = isbnGenre[y.isbn];
      return '<li><b>' + esc(String(y.code).charAt(0) === '#' ? y.code : '#' + y.code) + '</b>' + (g ? '<span>' + esc(g) + '</span>' : '') + '</li>';
    }).join('') : '<li class="dn-empty">책 받는 날' + (C.eventDate ? ' ' + esc(C.eventDate) : '') + ' 이후에 채워져요. 이름 대신 #01 같은 코드와 고른 분야만 보여요.</li>';
    var pg = $('#dash-photos');
    if (pg) {
      var ph = (C.photos || []).filter(function (x) { return x && x.src; });
      pg.innerHTML = ph.length ? ph.map(function (x) { return '<figure><img src="' + esc(x.src) + '" alt="' + esc(x.alt || '책을 받은 날') + '" loading="lazy"></figure>'; }).join('')
        : [0, 1, 2].map(function () { return '<figure class="ph-empty"><span>책 받은 날 사진</span></figure>'; }).join('');
    }
    var pd = $('#dash-pending');
    if (pd) { pd.hidden = !T.pending; pd.textContent = T.pending ? '작은 후원이 모이는 중 · 다음 한 권까지 ' + won(T.pending) : ''; }
  }

  /* ── 네컷 만화 (스토리 · 후원 참여) ── 포스터의 아이 그림을 그대로 쓴다 */
  var INK = PC.ink, SAL = PC.sal, CREAM = PC.cream, SKY = '#b9c8ca';
  function sv(inner) { return '<svg viewBox="0 0 320 220" role="img" aria-hidden="true"><rect width="320" height="220" fill="' + SKY + '"/>' + inner + '<rect y="196" width="320" height="24" fill="' + SAL + '"/><rect y="192" width="320" height="5" fill="' + INK + '"/></svg>'; }
  function R(x, y, w, h, f, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (r ? ' rx="' + r + '"' : '') + ' fill="' + f + '"/>'; }
  function T_(x, y, t, size, f, anchor) { return '<text x="' + x + '" y="' + y + '" font-size="' + (size || 13) + '" font-weight="900" fill="' + (f || INK) + '" text-anchor="' + (anchor || 'middle') + '" font-family="Noto Sans KR, sans-serif">' + t + '</text>'; }
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
    story: [
      ['한 사람으로부터', function () { return sv(R(150, 120, 70, 72, CREAM, 4) + R(150, 120, 70, 8, INK) + T_(185, 165, '0.1평', 15) + '<ellipse cx="248" cy="168" rx="16" ry="6" fill="' + INK + '"/>' + R(236, 150, 24, 20, SAL, 3) +
        '<path d="M248 150 C246 136 238 128 230 126 C236 136 240 142 248 150 Z" fill="#6f8f95"/><path d="M248 150 C252 134 262 128 270 128 C264 138 258 144 248 150 Z" fill="#6f8f95"/>' + adult(95, { hair: 'long', top: 'jacket' })); },
        '0.1평 점주 한 분이 부천 청소년을 위해 씨앗 펀딩을 맡겼어요.'],
      ['청소년 책사줄게란?', function () { return sv(adult(70) + R(140, 120, 40, 50, CREAM, 3) + R(140, 120, 7, 50, INK) + '<path d="M120 100 h80" stroke="' + INK + '" stroke-width="4" marker-end="url(#ar)"/>' +
        '<defs><marker id="ar" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="' + INK + '"/></marker></defs>' + teen(250, { hair: 'bob', top: 'stripe', book: true })); },
        '어른이 책값을 내고, 청소년이 읽고 싶은 책 한 권을 스스로 골라 가져요.'],
      ['청주에서 전국으로, 부천까지', function () {
        var pin = function (x, y, label, big) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (big ? 11 : 8) + '" fill="' + (big ? SAL : INK) + '" stroke="' + INK + '" stroke-width="3"/>' + T_(x, y + 30, label, big ? 14 : 12); };
        return sv('<path d="M40 130 C90 60 150 150 200 90 S270 60 290 100" fill="none" stroke="' + INK + '" stroke-width="3" stroke-dasharray="6 6"/>' +
          pin(40, 130, '청주') + pin(120, 95, '전국') + pin(200, 92, '빛나는친구들', false) + pin(290, 100, '비북스', true) + T_(200, 150, '부천', 12) + T_(290, 150, '부천', 12));
      }, '충북 청주의 동네책방에서 시작해 전국 동네서점으로 번졌고, 부천에서는 빛나는친구들이 먼저 함께했어요.'],
      ['부천 두 번째, 비북스', function () {
        var awn = ''; for (var a = 0; a < 8; a++) awn += R(70 + a * 22, 70, 22, 18, a % 2 ? CREAM : SAL);
        return sv(R(70, 88, 176, 104, CREAM) + awn + T_(158, 64, '비북스', 16) + shelfProp(84, 100, 90, 2, 16) + R(190, 120, 42, 72, INK, 3) +
          teen(40, { hair: 'short', top: 'stripe' }, 112) + teen(290, { hair: 'long', top: 'dress' }, 104));
      }, '그리고 원미동 비북스가 부천에서 두 번째로 함께해요.']
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
  function renderComics() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-comic]'), function (box) {
      var set = COMICS[box.getAttribute('data-comic')]; if (!set) return;
      box.innerHTML = set.map(function (c, i) {
        return '<li class="cm"><div class="cm-pic">' + c[1]() + '<span class="cm-n">' + (i + 1) + '</span></div><h3>' + esc(c[0]) + '</h3><p>' + esc(c[2]) + '</p></li>';
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
})();
