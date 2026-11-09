/* 청소년 책사줄게 · 책 고르기 — 장바구니처럼 고르고, 그 자리에서 신청(접수 시트 '신청' 탭) */
(function () {
  'use strict';
  var C = window.CONFIG || {};
  var P = C.pick || {};
  var MAX = Math.max(1, Math.min(2, Number(P.maxPicks) || 2)); // 신청 도서 + 예비 도서
  var KEY = 'ybg-picks', DONE_KEY = 'ybg-applied', CUSTOM_KEY = 'ybg-custom';

  function $(s, el) { return (el || document).querySelector(s); }
  function rich(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }  // **굵게**
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function filled(v) { return v !== null && v !== undefined && String(v).trim() !== ''; }
  function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

  var books = [], byId = {}, picks = [], lists = [], custom = {}, state = { q: '', genre: '', sort: '', list: '', group: '' };

  /* ── 저장 (이 기기에만) ── */
  function loadPicks() {
    try { picks = JSON.parse(localStorage.getItem(KEY) || '[]').filter(function (id) { return byId[id]; }).slice(0, MAX); }
    catch (e) { picks = []; }
  }
  function savePicks() {
    // 고른 목록에서 빠진 '직접 고른 책'은 지운다
    Object.keys(custom).forEach(function (id) { if (picks.indexOf(id) < 0) { delete custom[id]; delete byId[id]; } });
    try { localStorage.setItem(KEY, JSON.stringify(picks)); localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom)); } catch (e) { /* 저장 못 해도 화면은 동작 */ }
  }
  function loadCustom() {
    try { custom = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '{}') || {}; } catch (e) { custom = {}; }
    Object.keys(custom).forEach(function (id) { byId[id] = custom[id]; });
  }

  function soldOut(b) { return b.stock !== null && b.stock !== undefined && Number(b.stock) <= 0; }
  function label(i) { return i === 0 ? '신청 도서' : '예비 도서'; }

  /* ── 안내 ── */
  function renderRules() {
    var items = ['한 사람이 한 권' + (filled(C.bookPrice) ? ', 정가 ' + Number(C.bookPrice).toLocaleString('ko-KR') + '원 이하 책' : '') + '을 받아요. 참고서·문제집은 제외예요.'];
    items.push('책은 2개월에 한 권씩, 한 해 최대 6권까지 받을 수 있어요. 1월에 신청했다면 3월에 다시 신청할 수 있어요(달 기준).');
    items.push('신청하면 비북스가 책을 주문해 준비해요.');
    if (MAX > 1) items.push('예비 도서를 한 권 더 고를 수 있어요(선택). 신청 도서를 구하기 어려우면 예비 도서로 구해 드려요.');
    items.splice(0, 0, (filled(C.regionLimit) ? C.regionLimit + ' ' : '') + (filled(C.ageRange) ? C.ageRange + ' ' : '') + '청소년이면 누구나 신청할 수 있어요. ' + (filled(C.gradeNote) ? '**' + C.gradeNote + '** ' : '') + '학교 밖 청소년도 신청할 수 있어요.');
    items.push('실명 대신 닉네임으로 신청해요. 학교 이름은 지역 확인에만 써요.');
    items.push('**온라인으로 고르는 것 말고도, 비북스에 직접 와서 책을 눈으로 보고 고를 수 있어요. 현장에서 고르면 비북스 키링을 선물로 드려요.** 방법은 문의로 물어봐 주세요.');
    items.push('책이 도착하면 연락처로 안내해 드려요. 안내를 받고 비북스에 방문해서 받아가요.');
    $('#pick-rules').innerHTML = items.map(function (t) { return '<li>' + rich(t) + '</li>'; }).join('');
  }

  /* ── 목록 ── */
  function cover(b, big) {
    if (filled(b.cover)) {
      var src = big && filled(b.coverLarge) ? b.coverLarge : b.cover;
      // 큰 표지가 안 열리면 작은 썸네일로
      return '<img src="' + esc(src) + '" data-fb="' + esc(b.cover) + '" alt="" loading="lazy" onerror="if(this.dataset.fb&&this.src!==this.dataset.fb)this.src=this.dataset.fb">';
    }
    var k = hash(b.id + b.title), hue = [152, 30, 200, 12, 95, 265][k % 6], l = 30 + (k % 4) * 5;
    return '<span class="gen-cover" style="background:hsl(' + hue + ' 32% ' + l + '%)"><span class="gc-t">' + esc(b.title) +
      '</span><span class="gc-a">' + esc(b.author) + '</span></span>';
  }
  function listCount(l) {
    if (!l) return 0;
    if (l.groups && l.groups.length) {
      return l.groups.reduce(function (n, g) { return n + ((g.books && g.books.length) || 0); }, 0);
    }
    return (l.books && l.books.length) || 0;
  }
  function currentGroup() {
    var cur = currentList(); if (!cur || !cur.groups || !cur.groups.length) return null;
    return cur.groups.filter(function (g) { return g.id === state.group; })[0] || cur.groups[0];
  }
  function currentBookIds() {
    var cur = currentList();
    if (!cur) return books.map(function (b) { return b.id; });
    var g = currentGroup();
    return g ? (g.books || []) : (cur.books || []);
  }
  function visible() {
    var q = state.q.trim().toLowerCase();
    var list = currentBookIds().map(function (id) { return byId[id]; }).filter(function (b) {
      if (!b || b.custom) return false;
      if (state.genre && b.genre !== state.genre) return false;
      if (!q) return true;
      return [b.title, b.author, b.publisher, b.genre].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    if (state.sort) list = list.slice().sort(function (a, b) { return String(a[state.sort]).localeCompare(String(b[state.sort]), 'ko'); });
    return list;
  }
  function stockTag(b) {
    return b.stock === null || b.stock === undefined ? '' :
      '<span class="stock' + (soldOut(b) ? ' out' : '') + '">' + (soldOut(b) ? '다 나갔어요' : Number(b.stock) + '권 남음') + '</span>';
  }
  function pickBtn(b, wide) {
    var at = picks.indexOf(b.id), out = soldOut(b) && at < 0, cls = 'pick-btn' + (wide ? ' wide' : '');
    return at >= 0
      ? '<button type="button" class="' + cls + ' on" data-id="' + esc(b.id) + '" aria-pressed="true">✓ ' + label(at) + '</button>'
      : '<button type="button" class="' + cls + '" data-id="' + esc(b.id) + '" aria-pressed="false"' + (out ? ' disabled' : '') + '>' + (out ? '다 나갔어요' : '고르기') + '</button>';
  }
  function renderGrid() {
    var list = visible(), ex = books.filter(function (b) { return b.example; }).length;
    $('#list-meta').innerHTML = '<span>총 <b>' + list.length + '</b>권</span>' +
      (ex ? '<span class="badge">예시 목록이에요 — 큐레이션이 정해지면 바뀌어요</span>' : '') +
      '<span class="muted">표지를 누르면 책 소개를 볼 수 있어요</span>';
    $('#book-grid').innerHTML = list.length ? list.map(function (b) {
      var at = picks.indexOf(b.id), out = soldOut(b) && at < 0;
      return '<li class="book-item' + (at >= 0 ? ' picked' : '') + (out ? ' sold' : '') + '">' +
        '<button type="button" class="cover" data-detail="' + esc(b.id) + '" aria-label="' + esc(b.title) + ' 책 소개 보기">' + cover(b, true) +
        (b.featured ? '<span class="feat">추천</span>' : '') +
        (filled(b.note) ? '<span class="obi">' + esc(b.note) + (filled(b.curator) ? ' — ' + esc(b.curator) : '') + '</span>' : '') + '</button>' +
        '<div class="bi-body"><h3 class="bi-title">' + esc(b.title) + '</h3>' +
        (filled(b.edition) ? '<p class="bi-ed">' + esc(b.edition) + '</p>' : '') +
        '<p class="bi-by">' + esc([b.author, b.publisher].filter(filled).join(' · ')) + '</p>' +
        '<p class="bi-tags">' + (filled(b.genre) ? '<span class="tag">' + esc(b.genre) + '</span>' : '') + stockTag(b) + '</p>' + pickBtn(b) + '</div></li>';
    }).join('') : '<li class="empty-list">찾는 책이 이 목록에 없어요. 위의 「직접 고르기」에서 골라도 돼요.</li>';
  }

  /* ── 책 소개 ── */
  var detailId = null;
  function renderDetail() {
    var b = byId[detailId]; if (!b) return;
    var by = [b.author, filled(b.translators) ? b.translators + ' 옮김' : ''].filter(filled).join(' · ');
    var pub = [b.publisher, filled(b.published) ? b.published.slice(0, 4) : '', b.price ? '정가 ' + Number(b.price).toLocaleString('ko-KR') + '원' : ''].filter(filled).join(' · ');
    var intro = filled(b.intro)
      ? '<div class="dt-blurb"><p class="dt-blurb-label">이런 책이에요</p><p class="dt-intro">' + esc(b.intro) + '</p></div>'
      : '<p class="dt-intro muted">책 소개를 준비하고 있어요.</p>';
    $('#detail-body').innerHTML =
      '<div class="dt-top"><div class="dt-cover">' + cover(b, true) + '</div><div class="dt-meta">' +
      (b.featured ? '<span class="feat static">추천</span>' : '') +
      '<h2 id="detail-title">' + esc(b.title) + '</h2>' + (filled(b.edition) ? '<p class="bi-ed">' + esc(b.edition) + '</p>' : '') +
      '<p class="bi-by">' + esc(by) + '</p><p class="bi-by">' + esc(pub) + '</p>' +
      '<p class="bi-tags">' + (filled(b.genre) ? '<span class="tag">' + esc(b.genre) + '</span>' : '') + stockTag(b) + '</p></div></div>' +
      (filled(b.pick) ? '<div class="dt-pick"><p class="dt-pick-label">' + esc(b.pickBy || '비북스') + '\u2019s b.books pick</p><p>' + esc(b.pick) + '</p></div>' : '') +
      (filled(b.note) ? '<p class="dt-note">' + esc(b.note) + (filled(b.curator) ? ' — ' + esc(b.curator) : '') + '</p>' : '') +
      intro +
      (filled(b.link) ? '<a class="dt-link" href="' + esc(b.link) + '" target="_blank" rel="noopener">책 정보 더 보기 ↗</a>' : '') +
      pickBtn(b, true) +
      '<p class="small muted dt-src">표지·서지: 카카오 책 검색' + (b.introSource === 'youth' ? ' · 소개: 비북스' : '') + '</p>';
  }
  function openDetail(id) {
    detailId = id; renderDetail();
    var d = $('#detail'); if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function closeDetail() { var d = $('#detail'); if (d.close) d.close(); else d.removeAttribute('open'); }
  function renderGenres() {
    var gs = [];
    currentBookIds().map(function (id) { return byId[id]; }).forEach(function (b) {
      if (b && filled(b.genre) && gs.indexOf(b.genre) < 0) gs.push(b.genre);
    });
    $('#genres').innerHTML = [''].concat(gs).map(function (g) {
      return '<button type="button" class="chip" aria-pressed="' + (state.genre === g) + '" data-genre="' + esc(g) + '">' + (g ? esc(g) : '전체') + '</button>';
    }).join('');
  }

  /* ── 고르는 방법: 큐레이션 목록 탭 + 직접 고르기 ── */
  function currentList() { return lists.filter(function (l) { return l.id === state.list; })[0] || null; }
  function renderGroupTabs() {
    var el = $('#group-tabs'), cur = currentList();
    if (!cur || !cur.groups || !cur.groups.length || state.list === 'custom') {
      el.hidden = true; el.innerHTML = ''; return;
    }
    if (!state.group || !cur.groups.some(function (g) { return g.id === state.group; })) state.group = cur.groups[0].id;
    el.hidden = false;
    el.innerHTML = cur.groups.map(function (g, i) {
      var n = (g.books || []).length;
      return (i ? '<span class="group-sep" aria-hidden="true">|</span>' : '') +
        '<button type="button" role="tab" data-group="' + esc(g.id) + '" aria-selected="' + (state.group === g.id) + '">' +
        esc(g.title) + '<span>' + (filled(g.name) ? esc(g.name) + ' · ' : '') + n + '권</span></button>';
    }).join('');
  }
  function renderListIntro() {
    var el = $('#list-intro'), cur = currentList(), it = cur && state.list !== 'custom' ? cur.intro : null;
    if (!it || !it.paragraphs || !it.paragraphs.length) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = '<h3 class="li-label">' + esc(it.label || '소개') + '</h3>' +
      it.paragraphs.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      (filled(it.sign) ? '<p class="li-sign">— ' + esc(it.sign) + '</p>' : '');
  }
  function renderGroupDesc() {
    var el = $('#group-desc'), g = state.list === 'custom' ? null : currentGroup();
    if (!g || !filled(g.desc)) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = '<p class="gd-kicker">' + esc(g.title) + '</p><h3 class="gd-name">' + esc(g.name || '') + '</h3>' +
      (filled(g.tags) ? '<p class="gd-tags">' + esc(g.tags) + '</p>' : '') + '<p class="gd-text">' + esc(g.desc) + '</p>';
  }
  function renderTabs() {
    var tabs = lists.map(function (l) {
      var n = listCount(l);
      return '<button type="button" role="tab" data-list="' + esc(l.id) + '" aria-selected="' + (state.list === l.id) + '"' + (n ? '' : ' class="soon-tab"') + '>' +
        esc(l.title) + '<span>' + (n ? n + '권' : '준비 중') + '</span></button>';
    });
    if (P.custom !== false) tabs.push('<button type="button" role="tab" data-list="custom" aria-selected="' + (state.list === 'custom') + '" class="custom-tab">직접 고르기<span>목록에 없는 책</span></button>');
    $('#list-tabs').innerHTML = tabs.join('');
    var cur = currentList(), isCustom = state.list === 'custom', n = listCount(cur);
    $('#list-desc').textContent = isCustom ? '' : cur ? (cur.desc || '') + (filled(cur.by) && cur.desc.indexOf(cur.by) < 0 ? ' — ' + cur.by : '') : '';
    $('#list-panel').hidden = isCustom || (cur && !n);
    $('#custom-panel').hidden = !isCustom;
    if (cur && !n) $('#list-desc').textContent = (cur.desc || '') + ' 곧 채워질 거예요.';
    renderListIntro(); renderGroupTabs(); renderGroupDesc();
  }
  function selectList(id) {
    state.list = id; state.genre = ''; state.q = ''; state.group = ''; $('#q').value = '';
    var cur = currentList();
    if (cur && cur.groups && cur.groups.length) state.group = cur.groups[0].id;
    renderTabs(); if (id !== 'custom') { renderGenres(); renderGrid(); }
  }
  function selectGroup(id) {
    state.group = id; state.genre = ''; state.q = ''; $('#q').value = '';
    renderGroupTabs(); renderGroupDesc(); renderGenres(); renderGrid();
  }
  /* ── 직접 고르기: 카카오 책 검색(시트 스크립트가 대신 불러줘요) → 나온 책 중에 고르기 ── */
  var lastResults = [], searchSeq = 0;
  function won(n) { return Number(n).toLocaleString('ko-KR') + '원'; }
  function overLimit(b) { var lim = Number(C.bookPrice) || 0; return lim > 0 && b.price > lim; }
  function pickedIsbn(isbn) { return !!isbn && picks.some(function (id) { return byId[id] && byId[id].isbn === isbn; }); }

  function renderResults() {
    var ul = $('#bs-results');
    ul.innerHTML = lastResults.map(function (b, i) {
      var over = overLimit(b), got = pickedIsbn(b.isbn);
      var meta = [b.authors, b.publisher, b.year].filter(filled).join(' · ');
      var tag = b.status && b.status !== '정상판매' ? '<span class="bs-tag">' + esc(b.status) + ' · 구하기 어려울 수 있어요</span>' : '';
      var btn = got ? '<button type="button" class="pick-btn on" data-rs="' + i + '" disabled>✓ 골랐어요</button>'
        : over ? '<button type="button" class="pick-btn" data-rs="' + i + '" disabled>정가 ' + won(C.bookPrice) + ' 초과</button>'
        : '<button type="button" class="pick-btn" data-rs="' + i + '" aria-label="' + esc(b.title) + ' 고르기">고르기</button>';
      return '<li class="bs-item' + (over ? ' over' : '') + '"><span class="bs-cover">' + (b.thumb ? '<img src="' + esc(b.thumb) + '" alt="" loading="lazy">' : '') + '</span>' +
        '<div class="bs-info"><strong>' + esc(b.title) + '</strong><span>' + esc(meta) + '</span><span class="bs-price">' + (b.price > 0 ? '정가 ' + won(b.price) : '정가를 확인 중이에요') + '</span>' + tag + '</div>' + btn + '</li>';
    }).join('');
  }
  function setStatus(msg, bad) { var el = $('#bs-status'); el.textContent = msg; el.classList.toggle('bad', !!bad); }
  function doSearch(q) {
    var seq = ++searchSeq, form = $('#bsearch-form'), btn = $('button', form);
    $('#bs-manual').hidden = true; lastResults = []; renderResults();
    if (q.length < 2) { setStatus('책 제목을 두 글자 이상 적어주세요.', true); return; }
    setStatus('「' + q + '」 찾는 중…'); btn.disabled = true;
    fetch(P.searchApi + (P.searchApi.indexOf('?') < 0 ? '?' : '&') + 'action=search&q=' + encodeURIComponent(q), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (res) {
        if (seq !== searchSeq) return;
        if (!res.ok) throw new Error(res.error || '검색하지 못했어요.');
        lastResults = res.books || []; renderResults();
        if (lastResults.length) setStatus('「' + q + '」로 찾은 책 ' + lastResults.length + '권이에요. 읽고 싶은 책을 골라주세요.');
        else { setStatus('「' + q + '」로 찾은 책이 없어요. 제목을 바꿔 다시 찾아보거나, 아래에서 직접 적어주세요.', true); $('#bs-manual').hidden = false; $('#bs-manual').open = true; }
      })
      .catch(function (err) {
        if (seq !== searchSeq) return;
        console.warn('책 검색 실패:', err);
        setStatus('책 검색을 지금 쓸 수 없어요. 아래에서 책 제목을 직접 적어주세요.', true); $('#bs-manual').hidden = false; $('#bs-manual').open = true;
      })
      .then(function () { if (seq === searchSeq) btn.disabled = false; });
  }
  function addCustom(b) {
    if (picks.length >= MAX) { toast(MAX > 1 ? '신청 도서 1권과 예비 도서 1권, 두 권까지 고를 수 있어요. 내 선택에서 하나를 빼고 다시 골라주세요.' : '한 권만 고를 수 있어요. 고른 책을 빼고 다시 골라주세요.'); return false; }
    var id = 'c' + Date.now().toString(36);
    custom[id] = byId[id] = { id: id, custom: true, title: b.title, author: b.authors || '', publisher: b.publisher || '', isbn: b.isbn || '', price: b.price || 0, cover: b.thumb || '' };
    picks.push(id); savePicks(); renderGrid(); renderTray(); return true;
  }
  function initCustom() {
    $('#custom-rule').innerHTML = '<p><strong>목록에 없는 책도 골라도 돼요.</strong></p><p>' + esc(P.customRule || '') + '</p>';
    // 직접 적기(검색을 못 쓰거나 책이 안 나올 때만 열려요)
    var form = $('#custom-form'), msg = $('.form-msg', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, title = f.title.value.trim();
      if (!title) { msg.textContent = '책 제목을 적어주세요.'; f.title.focus(); return; }
      if (addCustom({ title: title, authors: f.author.value.trim(), publisher: f.publisher.value.trim() })) { form.reset(); msg.textContent = ''; toast('「' + title + '」을 골랐어요. 아래 신청하기에서 마무리해요.'); }
    });
    var sf = $('#bsearch-form');
    P.searchApi = filled(P.searchApi) ? P.searchApi : C.api;   // 책 검색도 접수 시트 주소 하나로
    if (!filled(P.searchApi)) {   // 검색 주소가 없으면 직접 적기만
      sf.hidden = true; $('#bs-manual').hidden = false; $('#bs-manual').open = true; setStatus('');
      return;
    }
    setStatus('책 제목을 적으면 카카오 책 검색에서 찾아줘요. 나온 책 중에 골라요.');
    sf.addEventListener('submit', function (e) { e.preventDefault(); doSearch($('#bq').value.replace(/\s+/g, ' ').trim()); });
    $('#bs-results').addEventListener('click', function (e) {
      var b = e.target.closest('[data-rs]'); if (!b || b.disabled) return;
      var book = lastResults[Number(b.getAttribute('data-rs'))]; if (!book) return;
      if (addCustom(book)) { renderResults(); toast('「' + book.title + '」을 골랐어요. 아래 신청하기에서 마무리해요.'); }
    });
  }

  /* ── 고르기 ── */
  var toastT;
  function toast(msg) {
    var el = $('#tray-sum'); el.textContent = msg; el.classList.add('warn');
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('warn'); renderTray(); }, 2600);
  }
  function toggle(id) {
    var at = picks.indexOf(id);
    if (at >= 0) picks.splice(at, 1);
    else if (picks.length >= MAX) { toast(MAX > 1 ? '신청 도서 1권과 예비 도서 1권, 두 권까지 고를 수 있어요. 하나를 빼고 다시 골라주세요.' : '한 권만 고를 수 있어요. 고른 책을 빼고 다시 골라주세요.'); return; }
    else picks.push(id);
    savePicks(); renderGrid(); renderTray(); if (lastResults.length) renderResults();
  }

  /* ── 내 선택 · 신청 ── */
  function bookText(b) {
    return (b.custom ? '[직접] ' : '') + b.title + (filled(b.edition) ? ' (' + b.edition + ')' : '') +
      [b.author, b.publisher].filter(filled).map(function (x) { return ' / ' + x; }).join('');
  }
  function applied() { try { return JSON.parse(localStorage.getItem(DONE_KEY) || 'null'); } catch (e) { return null; } }

  /* ── 이번 주 신청 현황: 한 주(월~일)에 10명까지. 다 차면 일요일 자정 이후 새로 신청 ── */
  var week = null;
  function weekClosed() { return !!week && !week.open; }
  function renderWeek() {
    var el = $('#week-banner'); if (!el) return;
    if (!week) { el.hidden = true; return; }
    el.hidden = false; el.classList.toggle('closed', !week.open);
    el.innerHTML = '<b>이번 주 ' + week.used + ' / ' + week.limit + '권</b> · ' + esc(window.ybgWeekMsg ? window.ybgWeekMsg(week) : '');
  }
  function loadWeekState() {
    if (!window.ybgWeek) return;
    window.ybgWeek().then(function (w) { week = w; renderWeek(); renderTray(); }).catch(function () { /* 현황을 못 불러와도 신청은 서버가 판단해요 */ });
  }
  function renderTray() {
    var n = picks.length, done = applied();
    $('#nav-count').textContent = n;
    if (!$('#tray-sum').classList.contains('warn')) {
      $('#tray-sum').innerHTML = done && !n ? '신청 완료 · 접수번호 <b>' + esc(done.id) + '</b>'
        : n ? '<b>' + esc(byId[picks[0]].title) + '</b>' + (n > 1 ? ' 외 예비 도서 1권' : '') : '아직 고른 책이 없어요';
    }
    $('#tray-go').disabled = (!n && !done) || (n && weekClosed());
    $('#tray-go').textContent = n && weekClosed() ? '이번 주 마감' : !n && done ? '신청 내역' : '신청하기';
    var sb = $('#youth-form button[type=submit]'); if (sb) { sb.disabled = weekClosed(); if (weekClosed()) sb.textContent = '이번 주 마감'; }

    $('#tray-list').innerHTML = n ? picks.map(function (id, i) {
      var b = byId[id];
      return '<li><span class="tl-n">' + label(i) + '</span><div class="tl-book"><b>' + esc(b.title) + '</b><span>' + esc([b.author, b.publisher].filter(filled).join(' · ')) +
        (b.custom ? ' <em class="tag-custom">직접 고름 · 확인 후 주문' + (b.price > 0 ? ' · 정가 ' + won(b.price) : '') + '</em>' : '') + '</span></div>' +
        '<div class="tl-act">' + (n > 1 && i === 1 ? '<button type="button" data-up="' + esc(id) + '">먼저 받기</button>' : '') +
        '<button type="button" data-del="' + esc(id) + '">빼기</button></div></li>';
    }).join('') : (done ? '' : '<li class="tl-empty">아직 고른 책이 없어요. 목록에서 골라주세요.</li>');

    $('#tray-pickup').innerHTML = '<p class="acc-label">책 받기</p><p>책이 도착하면 안내가 가요.<br><span class="small">신청할 때 적은 연락처로 연락드려요.</span></p>';

    $('#youth-form').hidden = !n;
    $('#tray-note').hidden = !n;
    var dn = $('#youth-done');
    if (!n && done) { dn.hidden = false; dn.innerHTML = doneHtml(done); } else if (n) dn.hidden = true;
  }
  function doneHtml(d) {
    return '<p class="done-h">신청이 됐어요.</p><p>접수번호 <b>' + esc(d.id) + '</b> · ' + esc(d.nick) + '</p>' +
      '<p>신청 도서: ' + esc(d.book) + '</p>' + (d.book2 ? '<p>예비 도서: ' + esc(d.book2) + '</p>' : '') + '<p>비북스가 책을 주문해 준비해요. 책이 도착하면 연락처와 이메일로 안내해 드려요.' + (d.book2 ? ' 신청 도서를 구하기 어려우면 예비 도서로 구해 드려요.' : ' 책을 구하기 어렵거나 문제가 있으면 따로 연락드려요.') + '</p>';
  }

  function initYouthForm() {
    var form = $('#youth-form'), Y = window.YBG, btn = $('button[type=submit]', form), msg = $('.form-msg', form);
    form.elements.route.addEventListener('change', function () {
      var etc = this.value === '기타'; $('#y-route-etc-row').hidden = !etc; if (!etc) form.elements.routeEtc.value = '';
    });
    form.elements.age.addEventListener('change', function () {
      var out = this.value === '학교 밖 청소년';
      $('#y-school-row').hidden = out; form.elements.school.required = !out;
    });
    if (!Y || !filled(C.api)) { btn.disabled = true; btn.textContent = '접수 준비 중'; }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); msg.textContent = '';
      if (!picks.length) { msg.textContent = '받을 책을 먼저 골라주세요.'; return; }
      var err = Y.checkFields(form, [
        ['nick', null, '닉네임을 적어주세요.'], ['age', null, '학년을 골라주세요.'],
        ['school', function (el) { return form.elements.age.value === '학교 밖 청소년' || !!el.value.trim(); }, '학교 이름을 적어주세요.'],
        ['bucheon', Y.isChecked, '부천에 살거나 부천에 있는 학교에 다니는 청소년만 신청할 수 있어요.'],
        ['phone', Y.isPhone, '연락처를 확인해 주세요. (예: 010-1234-5678)'], ['email', Y.isEmail, '이메일을 확인해 주세요.'],
        ['over14', Y.isChecked, '중학교 1학년부터 신청할 수 있어요.'], ['route', null, '비북스 책사줄게를 어떻게 알게 됐는지 골라주세요.'],
        ['consent', Y.isChecked, '개인정보 수집·이용에 동의해 주세요.']
      ]);
      if (err) { msg.textContent = err; return; }
      var f = form.elements, b1 = byId[picks[0]], b2 = picks[1] ? byId[picks[1]] : null;
      btn.disabled = true; btn.textContent = '보내는 중…';
      Y.post('youth', {
        nick: f.nick.value, age: f.age.value, school: f.school.value, bucheon: f.bucheon.checked, phone: f.phone.value, email: f.email.value,
        book1: bookText(b1), isbn1: b1.isbn || '', book2: b2 ? bookText(b2) : '', isbn2: b2 ? (b2.isbn || '') : '',
        custom1: !!b1.custom, custom2: !!(b2 && b2.custom),
        route: f.route.value, routeEtc: f.route.value === '기타' ? f.routeEtc.value : '',
        anon: false, hideTitle: false, pv: 2, consent: f.consent.checked
      }, f.website.value).then(function (res) {
        if (!res.ok) throw new Error(res.error || '접수하지 못했어요.');
        var rec = { id: res.id, nick: f.nick.value, book: b1.title, book2: b2 ? b2.title : '' };
        try { localStorage.setItem(DONE_KEY, JSON.stringify(rec)); } catch (x) { /* 저장 못 해도 접수는 됐다 */ }
        picks = []; savePicks(); form.reset(); renderGrid(); renderTray();
        $('#youth-done').focus();
      }).catch(function (err) {
        msg.textContent = err.message === 'Failed to fetch' ? '보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러주세요.' : err.message;
      }).then(function () { if (filled(C.api)) { btn.disabled = false; btn.textContent = '이 책으로 신청하기'; } loadWeekState(); });
    });
  }

  function openTray() {
    var d = $('#tray'); renderTray();
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function closeTray() { var d = $('#tray'); if (d.close) d.close(); else d.removeAttribute('open'); }

  function bind() {
    $('#book-grid').addEventListener('click', function (e) {
      var d = e.target.closest('[data-detail]'); if (d) { openDetail(d.getAttribute('data-detail')); return; }
      var b = e.target.closest('.pick-btn'); if (b && !b.disabled) toggle(b.getAttribute('data-id'));
    });
    $('#detail').addEventListener('click', function (e) {
      if (e.target === this || e.target.id === 'detail-close') { closeDetail(); return; }
      var b = e.target.closest('.pick-btn'); if (b && !b.disabled) { var id = b.getAttribute('data-id'), had = picks.indexOf(id) >= 0; toggle(id); if (had) renderDetail(); else closeDetail(); }
    });
    $('#list-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-list]'); if (b) selectList(b.getAttribute('data-list'));
    });
    $('#group-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-group]'); if (b) selectGroup(b.getAttribute('data-group'));
    });
    $('#genres').addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      state.genre = b.getAttribute('data-genre'); renderGenres(); renderGrid();
    });
    $('#q').addEventListener('input', function () { state.q = this.value; renderGrid(); });
    $('#sort').addEventListener('change', function () { state.sort = this.value; renderGrid(); });
    $('#tray-go').addEventListener('click', openTray);
    $('#open-tray').addEventListener('click', openTray);
    $('#tray-close').addEventListener('click', closeTray);
    $('#tray').addEventListener('click', function (e) {
      if (e.target === this) { closeTray(); return; } // 바깥(배경) 누르면 닫기
      var del = e.target.getAttribute('data-del'), up = e.target.getAttribute('data-up');
      if (del) { picks.splice(picks.indexOf(del), 1); savePicks(); renderGrid(); renderTray(); if (lastResults.length) renderResults(); }
      if (up) { picks = [up].concat(picks.filter(function (x) { return x !== up; })); savePicks(); renderGrid(); renderTray(); }
    });
    // 다른 탭에서 바꾼 선택도 따라간다
    window.addEventListener('storage', function (e) { if (e.key === KEY) { loadPicks(); renderGrid(); renderTray(); } });
  }

  // 머리말(main.js가 그림)에 '내 선택' 버튼을 붙인다
  function addTrayLink() {
    var head = $('#site-header'); if (!head || $('#open-tray')) return;
    head.insertAdjacentHTML('beforeend', '<button type="button" class="tray-link" id="open-tray">내 선택 <span class="count" id="nav-count">0</span></button>');
  }

  function init() {
    addTrayLink(); renderRules(); bind(); initYouthForm(); initCustom();
    fetch(P.booksSource || 'data/books.json', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
    }).then(function (data) {
      books = (data.books || []).filter(function (b) { return b && b.id && b.title; });
      books.forEach(function (b) { byId[b.id] = b; });
      // 큐레이션 목록이 없으면 전체를 한 목록으로
      lists = (data.lists && data.lists.length ? data.lists : [{ id: 'all', title: '추천 목록', books: books.map(function (b) { return b.id; }) }])
        .map(function (l) {
          l.books = (l.books || []).filter(function (id) { return byId[id]; });
          if (l.groups && l.groups.length) {
            l.groups = l.groups.map(function (g) {
              g.books = (g.books || []).filter(function (id) { return byId[id]; });
              return g;
            }).filter(function (g) { return g.books.length; });
          }
          return l;
        });
      var first = lists.filter(function (l) { return listCount(l); })[0];
      state.list = first ? first.id : (P.custom !== false ? 'custom' : lists[0].id);
      if (first && first.groups && first.groups.length) state.group = first.groups[0].id;
      loadCustom();
      var hasStock = books.some(function (b) { return b.stock !== null && b.stock !== undefined; });
      if (filled(data.updatedAt)) $('#updated').textContent = (hasStock ? '목록과 남은 권수는 ' : '목록은 ') + data.updatedAt + ' 기준이에요.';
      loadPicks(); renderTabs(); renderGenres(); renderGrid(); renderTray(); loadWeekState();
    }).catch(function (err) {
      console.warn('책 목록을 읽지 못했어요:', err);
      $('#book-grid').innerHTML = '<li class="empty-list">책 목록을 불러오지 못했어요. 잠시 뒤 다시 열어주세요.</li>';
    });
  }
  init();
})();
