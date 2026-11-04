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
    }).then(normalizeShelf);
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

  // 시트 열: 회차-순번 · 닉네임 · 공개 여부 · 믿음/미안함 · 한 줄 · 청소년 코드 · 분야 · 날짜 · 입금확인 (· 예시)
  function csvToShelf(text) {
    var rows = parseCsv(text); if (!rows.length) return { rounds: [] };
    var head = rows.shift().map(function (h) { return h.replace(/\s/g, ''); });
    function col(names) { for (var i = 0; i < names.length; i++) { var k = head.indexOf(names[i]); if (k >= 0) return k; } return -1; }
    var ix = {
      id: col(['회차-순번', '회차순번', 'id']), nick: col(['닉네임', 'nickname']), pub: col(['공개여부', 'public']),
      mind: col(['믿음/미안함', '마음', 'mind']), line: col(['한줄', 'line']), youth: col(['청소년코드', 'youthCode']),
      genre: col(['분야', 'genre']), date: col(['날짜', 'addedAt']), paid: col(['입금확인', 'paid']), ex: col(['예시', 'example'])
    };
    var byRound = {};
    rows.forEach(function (r) {
      function v(k) { return ix[k] >= 0 ? (r[ix[k]] || '').trim() : ''; }
      if (ix.paid >= 0 && !truthy(v('paid'))) return; // 입금확인 TRUE인 행만
      var id = v('id'); if (!id) return;
      var round = parseInt(id.split('-')[0], 10) || 1;
      (byRound[round] = byRound[round] || []).push({
        id: id, nickname: v('nick'), public: truthy(v('pub')), mind: v('mind') || '믿음', line: v('line'),
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
  function mindKey(b) { return String(b.mind).indexOf('미안') >= 0 ? 'sorry' : 'trust'; }
  function bookFill(b) {
    var k = mindKey(b), off = (hash(b.id) % 6) * 3 - 6; // 같은 계열 안에서 명도만 조금씩
    return 'hsl(var(--' + k + '-h) var(--' + k + '-s) calc(var(--' + k + '-l0) + ' + off + '%))';
  }
  function displayName(b) { return b.public && filled(b.nickname) ? b.nickname : '원미동 이웃'; }

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
      var label = displayName(b) + '님이 건넨 책, ' + (mindKey(b) === 'sorry' ? '미안함' : '믿음') + (b.example ? ', 예시' : '');
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
    renderRecent(r);
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

  function renderRecent(r) {
    var list = r.books.filter(function (b) { return b.public; }).slice().reverse().slice(0, 10);
    $('#recent').innerHTML = list.length ? list.map(function (b) {
      return '<li><i class="sw sw-' + mindKey(b) + '" style="background:' + bookFill(b) + '"></i><span><span class="r-name">' + esc(displayName(b)) +
        (b.example ? ' <span class="badge">예시</span>' : '') + '</span>' + esc(b.line || '') + '</span><span class="r-date">' + esc(fmtDate(b.addedAt)) + '</span></li>';
    }).join('') : '<li><span class="empty">아직 공개된 한 줄이 없어요. 첫 책을 꽂아주세요.</span></li>';
  }
  function fmtDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? Number(m[2]) + '.' + Number(m[3]) : (s || ''); }

  /* 책 카드 */
  var openBook = null;
  function openCard(g) {
    var r = shelfState.current, b = r.books[Number(g.getAttribute('data-i'))]; if (!b) return;
    closeCard(false);
    openBook = g; g.classList.add('is-open');
    var card = $('#book-card'), k = mindKey(b);
    var youth = filled(b.youthCode) ? '청소년 ' + (String(b.youthCode).charAt(0) === '#' ? b.youthCode : '#' + b.youthCode) : '받는 날 이후 연결돼요';
    card.innerHTML =
      '<button type="button" class="bc-close" aria-label="닫기">×</button>' +
      '<span class="bc-mind ' + k + '">' + (k === 'sorry' ? '미안함' : '믿음') + (b.example ? ' · 예시' : '') + '</span>' +
      '<h4 id="bc-name">' + esc(displayName(b)) + '</h4>' +
      (b.public && filled(b.line) ? '<p class="bc-line">“' + esc(b.line) + '”</p>' : '<p class="bc-line muted">한 줄은 공개하지 않았어요.</p>') +
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
      if (!rounds.length) rounds = [{ round: 1, title: '1회차', targetBooks: filled(C.targetBooks) ? Number(C.targetBooks) : null, closed: false, books: [] }];
      shelfState.rounds = rounds;
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
    var steps = (C.donationSteps || []).filter(function (n) { return n > 0; });
    $('#amount-btns').innerHTML = steps.map(function (n) {
      return '<button type="button" aria-pressed="false" data-amount="' + n + '">' + manwon(n) + '</button>';
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
    if (filled(C.goalAmount)) { $('#goal').hidden = false; $('#goal').textContent = '이번 회차 목표 금액은 ' + won(C.goalAmount) + '이에요.'; }

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
  var hasRadio = function (el) { return !!el.value; };
  window.YBG = { post: post, checkFields: checkFields, isPhone: isPhone, isEmail: isEmail, isChecked: isChecked, filled: filled };

  function initDonateForm() {
    var form = $('#donate-form'); if (!form) return;
    var btn = $('button[type=submit]', form), msg = $('.form-msg', form);
    if (!filled(C.api)) { btn.disabled = true; btn.textContent = '접수 준비 중'; }
    $('#d-line').addEventListener('input', function () { $('#d-line-cnt').textContent = this.value.length + '/40'; });
    $('#d-amount').addEventListener('input', function () {
      var d = digits(this.value).slice(0, 9); amount = Number(d) || 0;
      this.value = d ? Number(d).toLocaleString('ko-KR') : ''; setPressed(null);
      var fa = $('#free-amount'); if (fa) fa.value = this.value;
      var el = $('#books-calc'), price = Number(C.bookPrice), n = price ? Math.floor(amount / price) : 0;
      if (price && amount) { el.hidden = false; el.innerHTML = n >= 1 ? '책 <b>' + n + '권</b>이 서가에 꽂혀요.' : '책 한 권 값은 ' + won(price) + '이에요. 이 마음은 다른 후원과 모여 한 권이 돼요.'; } else el.hidden = true;
    });
    $('#d-receipt').addEventListener('change', function () { $('#d-receipt-row').hidden = !this.checked; });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); msg.textContent = '';
      var err = checkFields(form, [
        ['name', null, '이름이나 닉네임을 적어주세요.'], ['phone', isPhone, '연락처를 확인해 주세요. (예: 010-1234-5678)'],
        ['email', isEmail, '이메일을 확인해 주세요.'], ['amount', function (el) { return Number(digits(el.value)) >= 1000; }, '후원 금액을 적어주세요. (1,000원 이상)'],
        ['payer', null, '입금자명을 적어주세요.'], ['mind', hasRadio, '믿음 / 미안함 중 하나를 골라주세요.'],
        ['line', null, '청소년에게 남기는 한 줄을 적어주세요.'], ['consent', isChecked, '개인정보 수집·이용에 동의해 주세요.']
      ]);
      if (err) { msg.textContent = err; return; }
      var f = form.elements;
      btn.disabled = true; btn.textContent = '보내는 중…';
      post('donate', {
        name: f.name.value, phone: f.phone.value, email: f.email.value, kind: f.kind.value, amount: digits(f.amount.value),
        payer: f.payer.value, mind: f.mind.value, line: f.line.value, public: f.public.checked,
        receipt: f.receipt.checked, receiptNo: f.receiptNo.value, consent: f.consent.checked
      }, f.website.value).then(function (res) {
        if (!res.ok) throw new Error(res.error || '접수하지 못했어요.');
        var a = C.account || {}, done = $('#donate-done');
        form.hidden = true; done.hidden = false;
        done.innerHTML = '<p class="done-h">후원 접수가 됐어요. 고맙습니다.</p><p>접수번호 <b>' + esc(res.id) + '</b></p>' +
          '<p>아직 입금 전이라면 아래 계좌로 보내주세요. 입금이 확인되면 서가에 책이 꽂혀요.</p>' +
          (filled(a.number) ? '<p class="done-acc">' + esc(a.bank) + ' ' + esc(a.number) + ' · ' + esc(a.holder) + '<br>입금자명 ' + esc(f.payer.value) + ' · ' + won(digits(f.amount.value)) + '</p>' : '') +
          '<a class="btn btn-ghost" href="shelf.html">내일의 서재 보러 가기</a>';
        done.focus();
      }).catch(function (err) {
        msg.textContent = err.message === 'Failed to fetch' ? '보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러주세요.' : err.message;
        btn.disabled = false; btn.textContent = '후원 접수하기';
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
  function renderFaq() {
    var fa = C.faqAnswers || {};
    var who = (filled(C.ageRange) ? '나이 기준은 ' + C.ageRange + '예요. ' : '') +
      (filled(C.regionLimit) ? C.regionLimit + ' 청소년이면 신청할 수 있어요. ' : '') +
      '학교에 다니지 않는 청소년도 괜찮아요. 신청할 때 학교 이름을 적지만 지역 확인에만 쓰고 공개하지 않아요. 실명과 가정 형편은 묻지 않아요.';
    var list = [
      ['진짜 공짜예요? 조건이 있나요?', ['네, 무료예요. 책값은 후원한 어른들이 미리 냈어요.', '조건은 하나예요. 읽고 싶은 책을 스스로 고르는 것. 한 사람이 한 권을 골라요.']],
      ['누가 신청할 수 있나요?', [who]],
      ['목록에 없는 책도 고를 수 있나요?', [((C.pick || {}).customRule) || NOT_YET]],
      ['신청 마감이 지나면요?', [filled(C.applyDeadlineLabel) ? '온라인 신청은 ' + C.applyDeadlineLabel + '까지 받아요. 그 뒤에는 ' + (C.eventDate || '행사 날') + ' 비북스에 와서 서가에서 직접 골라요.' : NOT_YET]],
      ['부모님과 같이 가도 되나요?', ['같이 와도 괜찮아요. 다만 책을 고르는 동안은 청소년만 서가 구역에 들어가고, 보호자는 카페 공간에서 기다려요.']],
      ['후원금은 어디에 쓰이나요? 남으면요?', ['청소년이 고르는 책값으로 쓰여요. 모인 금액과 전달한 권수는 회차가 끝난 뒤 공지해요.', '남거나 모자랄 때: ' + (filled(fa.leftover) ? fa.leftover : NOT_YET)]],
      ['기부금영수증을 받을 수 있나요?', [filled(fa.receipt) ? fa.receipt : '확인 중이에요. ' + NOT_YET]],
      ['내 이름이나 고른 책이 공개되나요?', privacyItems().slice(0, 4).concat(['후원자 닉네임과 한 줄은 공개에 동의한 경우에만 서가에 보여요. 아니면 "원미동 이웃"으로 표시해요.'])]
    ];
    $('#faq-list').innerHTML = list.map(function (q) {
      return '<details><summary>' + esc(q[0]) + '</summary><div class="ans">' + q[1].map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div></details>';
    }).join('');
  }
  function renderPrivacy() {
    $('#privacy').innerHTML = privacyItems().map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');
  }

  /* ── 공통: 머리말 · 꼬리말 · 하단 바 · 이전/다음 ── */
  // [id, 주소, 메뉴 이름, 블록 설명]
  var PAGES = [
    ['about', 'about.html', '책사줄게 이야기', '청주의 작은 책방에서 시작된 흐름을 원미동에서 이어요.'],
    ['shelf', 'shelf.html', '내일의 서재', '후원이 들어올 때마다 책이 한 권씩 꽂혀요.'],
    ['donate', 'donate.html', '후원하기', '책 한 권 값부터 함께해요.'],
    ['pick', 'pick.html', '책 고르기', '부천 청소년이면 누구나. 추천 목록에서 고르거나 직접 골라 신청해요.'],
    ['org', 'org.html', '기관·기업', '한 반, 한 동아리 몫을 함께 건네요.'],
    ['faq', 'faq.html', '자주 묻는 질문', '공짜인지, 누가 되는지, 무엇이 공개되는지.']
  ];
  var NAV = { about: '이야기', shelf: '내일의 서재', donate: '후원', pick: '책 고르기', faq: 'FAQ' };
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
        '<p class="small muted">책방, 앤에서 시작된 흐름을 잇습니다. 비북스는 원조 서점이나 팀 동네서점과 별개로 운영해요.</p></div>';
    }
    // 모바일 하단 바: 첫 화면과 책 고르기에는 두지 않는다
    if (PAGE !== 'home' && PAGE !== 'pick') {
      var btns = [['donate', 'donate.html', '후원하기', 'btn-primary'], ['pick', 'pick.html', '책 고르기', 'btn-accent']]
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
  function kid(i, n, x, H, k) {
    var G = 430, t = i / (n - 1), o = [];
    var ry = H * (0.085 - 0.02 * t), rx = ry * 0.86, w = H * (0.25 - 0.06 * t);
    var cy = G - H + ry, neckY = cy + ry * 0.92, sh = neckY + H * 0.012;
    var hip = G - H * (0.40 + 0.06 * t), tb = hip + H * 0.03;
    var armW = w * 0.22, gap = w * 0.07, legW = (w * 0.86 - gap) / 2;
    function r(x0, y0, ww, hh, f, rr) { return '<rect x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + ww.toFixed(1) + '" height="' + hh.toFixed(1) + '"' + (rr ? ' rx="' + rr.toFixed(1) + '"' : '') + ' fill="' + f + '"/>'; }
    function e(cx0, cy0, ex, ey, f) { return '<ellipse cx="' + cx0.toFixed(1) + '" cy="' + cy0.toFixed(1) + '" rx="' + ex.toFixed(1) + '" ry="' + ey.toFixed(1) + '" fill="' + f + '"/>'; }
    var pid = 'st' + i, stripe = k.top === 'stripe';
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

  /* ── 첫 화면: 메뉴 블록 ── */
  var BLOCK_WHO = { about: '이야기', shelf: '모두의 서가', donate: '건네는 어른', pick: '고르는 청소년', org: '함께하기', faq: '궁금한 것' };
  function renderHome() {
    var grid = $('#menu-grid'); if (!grid) return;
    var order = ['shelf', 'donate', 'pick', 'about', 'org', 'faq'];
    var by = {}; pages().forEach(function (p) { by[p[0]] = p; });
    grid.innerHTML = order.filter(function (k) { return by[k]; }).map(function (k) {
      var p = by[k];
      return '<li class="blk blk-' + k + '"><a href="' + p[1] + '"><span class="blk-who">' + BLOCK_WHO[k] + '</span>' +
        '<strong class="blk-title">' + p[2] + '</strong><span class="blk-desc">' + p[3] + '</span>' +
        (k === 'shelf' ? '<span class="mini-shelf" id="mini-shelf" aria-hidden="true"></span><span class="blk-stat" id="shelf-stat"></span>' : '') +
        (k === 'pick' ? '<span class="blk-stat" id="pick-stat"></span>' : '') +
        '<span class="blk-go" aria-hidden="true">→</span></a></li>';
    }).join('');

    // 내일의 서재 블록: 지금 서가 모습을 작게
    loadShelfAny().then(function (rounds) {
      var open = rounds.filter(function (r) { return !r.closed; }), r = open[open.length - 1] || rounds[rounds.length - 1];
      if (!r) return;
      var real = r.books.filter(function (b) { return !b.example; }).length;
      var total = Math.max(filled(r.targetBooks) ? Number(r.targetBooks) : DEFAULT_SLOTS, r.books.length);
      $('#mini-shelf').innerHTML = Array.apply(null, { length: Math.min(total, 30) }).map(function (_, i) {
        var b = r.books[i];
        return b ? '<i style="background:' + bookFill(b) + ';height:' + (70 + hash(b.id + 'h') % 28) + '%"></i>' : '<i class="e"></i>';
      }).join('');
      $('#shelf-stat').textContent = '꽂힌 책 ' + real + '권' + (filled(r.targetBooks) ? ' / ' + r.targetBooks + '권' : '');
    }).catch(function () { /* 블록은 글만으로도 충분하다 */ });
    if (by.pick) fetch(((C.pick || {}).booksSource) || 'data/books.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      var n = (d.books || []).length; if (n) $('#pick-stat').textContent = n + '권 중에서 골라요';
    }).catch(function () {});
  }

  // 책 고르기 페이지를 끄면 링크를 숨긴다
  if ((C.pick || {}).enabled === false) Array.prototype.forEach.call(document.querySelectorAll('[data-pick]'), function (el) { el.hidden = true; });

  // 페이지마다 있는 부분만 그린다
  renderChrome();
  if ($('#hero-title')) renderHero();
  renderPoster(); renderHome();
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
