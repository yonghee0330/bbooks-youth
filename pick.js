/* 청소년 책사줄게 · 책 고르기 — 장바구니처럼 고르고, 그 자리에서 신청(접수 시트 '신청' 탭) */
(function () {
  'use strict';
  var C = window.CONFIG || {};
  var P = C.pick || {};
  var MAX = Math.max(1, Math.min(2, Number(P.maxPicks) || 2)); // 1지망 + 대신 받을 책
  var KEY = 'ybg-picks', DONE_KEY = 'ybg-applied', CUSTOM_KEY = 'ybg-custom';
  // 온라인 신청 마감: 마감일 밤 12시(한국 시간)까지
  var CLOSED = !!C.applyDeadline && Date.now() > new Date(C.applyDeadline + 'T23:59:59+09:00').getTime();

  function $(s, el) { return (el || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function filled(v) { return v !== null && v !== undefined && String(v).trim() !== ''; }
  function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

  var books = [], byId = {}, picks = [], lists = [], custom = {}, state = { q: '', genre: '', sort: '', list: '' };

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
  function label(i) { return i === 0 ? '고른 책' : '대신 받을 책'; }

  /* ── 안내 ── */
  function renderRules() {
    var items = ['한 사람이 한 권' + (filled(C.bookPrice) ? ', 정가 ' + Number(C.bookPrice).toLocaleString('ko-KR') + '원 이하 책' : '') + '을 받아요.'];
    items.push('신청하면 비북스가 책을 주문해 준비해요.' + (MAX > 1 ? ' 구하기 어려울 때를 위해 대신 받을 책을 하나 더 골라둘 수 있어요.' : ''));
    items.push((filled(C.regionLimit) ? C.regionLimit + ' 청소년이면 누구나 신청할 수 있어요. ' : '') + '실명 대신 닉네임으로 신청해요.');
    var when = [C.eventDate, C.eventTime].filter(filled).join(' ');
    items.push('받는 날: ' + (when || '정해지는 대로 알려드려요') + (filled(C.place) ? ' · ' + C.place : ''));
    if (filled(C.applyDeadlineLabel)) items.push('온라인 신청: ' + C.applyDeadlineLabel + '까지. 그 뒤엔 행사 날 비북스에서 직접 골라요.');
    $('#pick-rules').innerHTML = items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');
    if (CLOSED) {
      var note = $('#closed-note'); note.hidden = false;
      note.textContent = '온라인 신청은 ' + (C.applyDeadlineLabel || '') + '에 마감됐어요. ' + (C.eventDate || '행사 날') + ' 비북스에 와서 직접 골라주세요. 목록은 둘러보기용으로 남겨둘게요.';
    }
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
  function visible() {
    var q = state.q.trim().toLowerCase(), cur = currentList();
    var ids = cur ? cur.books : books.map(function (b) { return b.id; });
    var list = ids.map(function (id) { return byId[id]; }).filter(function (b) {
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
    var intro = filled(b.intro) ? '<p class="dt-intro">' + esc(b.intro) + (/[.!?。…"”]$/.test(b.intro) ? '' : '…') + '</p>'
      : '<p class="dt-intro muted">책 소개를 준비하고 있어요.</p>';
    $('#detail-body').innerHTML =
      '<div class="dt-top"><div class="dt-cover">' + cover(b, true) + '</div><div class="dt-meta">' +
      (b.featured ? '<span class="feat static">추천</span>' : '') +
      '<h2 id="detail-title">' + esc(b.title) + '</h2>' + (filled(b.edition) ? '<p class="bi-ed">' + esc(b.edition) + '</p>' : '') +
      '<p class="bi-by">' + esc(by) + '</p><p class="bi-by">' + esc(pub) + '</p>' +
      '<p class="bi-tags">' + (filled(b.genre) ? '<span class="tag">' + esc(b.genre) + '</span>' : '') + stockTag(b) + '</p></div></div>' +
      (filled(b.note) ? '<p class="dt-note">' + esc(b.note) + (filled(b.curator) ? ' — ' + esc(b.curator) : '') + '</p>' : '') +
      intro +
      (filled(b.link) ? '<a class="dt-link" href="' + esc(b.link) + '" target="_blank" rel="noopener">책 소개 더 보기 (다음 책) ↗</a>' : '') +
      pickBtn(b, true) +
      (b.coverSource === 'kakao' || filled(b.intro) ? '<p class="small muted dt-src">도서 정보: 카카오 책 검색</p>' : '');
  }
  function openDetail(id) {
    detailId = id; renderDetail();
    var d = $('#detail'); if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function closeDetail() { var d = $('#detail'); if (d.close) d.close(); else d.removeAttribute('open'); }
  function renderGenres() {
    var gs = [], cur = currentList();
    (cur ? cur.books.map(function (id) { return byId[id]; }) : books).forEach(function (b) { if (b && filled(b.genre) && gs.indexOf(b.genre) < 0) gs.push(b.genre); });
    $('#genres').innerHTML = [''].concat(gs).map(function (g) {
      return '<button type="button" class="chip" aria-pressed="' + (state.genre === g) + '" data-genre="' + esc(g) + '">' + (g ? esc(g) : '전체') + '</button>';
    }).join('');
  }

  /* ── 고르는 방법: 큐레이션 목록 탭 + 직접 고르기 ── */
  function currentList() { return lists.filter(function (l) { return l.id === state.list; })[0] || null; }
  function renderTabs() {
    var tabs = lists.map(function (l) {
      var n = (l.books || []).length;
      return '<button type="button" role="tab" data-list="' + esc(l.id) + '" aria-selected="' + (state.list === l.id) + '"' + (n ? '' : ' class="soon-tab"') + '>' +
        esc(l.title) + '<span>' + (n ? n + '권' : '준비 중') + '</span></button>';
    });
    if (P.custom !== false) tabs.push('<button type="button" role="tab" data-list="custom" aria-selected="' + (state.list === 'custom') + '" class="custom-tab">직접 고르기<span>목록에 없는 책</span></button>');
    $('#list-tabs').innerHTML = tabs.join('');
    var cur = currentList(), isCustom = state.list === 'custom';
    $('#list-desc').textContent = isCustom ? '' : cur ? (cur.desc || '') + (filled(cur.by) && cur.desc.indexOf(cur.by) < 0 ? ' — ' + cur.by : '') : '';
    $('#list-panel').hidden = isCustom || (cur && !(cur.books || []).length);
    $('#custom-panel').hidden = !isCustom;
    if (cur && !(cur.books || []).length) $('#list-desc').textContent = (cur.desc || '') + ' 곧 채워질 거예요.';
  }
  function selectList(id) {
    state.list = id; state.genre = ''; state.q = ''; $('#q').value = '';
    renderTabs(); if (id !== 'custom') { renderGenres(); renderGrid(); }
  }
  function initCustom() {
    $('#custom-rule').innerHTML = '<p><strong>목록에 없는 책도 골라도 돼요.</strong></p><p>' + esc(P.customRule || '') + '</p>';
    var form = $('#custom-form'), msg = $('.form-msg', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, title = f.title.value.trim();
      if (!title) { msg.textContent = '책 제목을 적어주세요.'; f.title.focus(); return; }
      if (picks.length >= MAX) { msg.textContent = MAX > 1 ? '두 권까지 고를 수 있어요. 내 선택에서 하나를 빼고 다시 골라주세요.' : '한 권만 고를 수 있어요. 고른 책을 빼고 다시 골라주세요.'; return; }
      var id = 'c' + Date.now().toString(36);
      custom[id] = byId[id] = { id: id, custom: true, title: title, author: f.author.value.trim(), publisher: f.publisher.value.trim() };
      picks.push(id); savePicks(); renderGrid(); renderTray(); form.reset();
      msg.textContent = '';
      toast('「' + title + '」을 골랐어요. 아래 신청하기에서 마무리해요.');
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
    else if (picks.length >= MAX) { toast(MAX > 1 ? '두 권까지 고를 수 있어요. 하나를 빼고 다시 골라주세요.' : '한 권만 고를 수 있어요. 고른 책을 빼고 다시 골라주세요.'); return; }
    else picks.push(id);
    savePicks(); renderGrid(); renderTray();
  }

  /* ── 내 선택 · 신청 ── */
  function bookText(b) {
    return (b.custom ? '[직접] ' : '') + b.title + (filled(b.edition) ? ' (' + b.edition + ')' : '') +
      [b.author, b.publisher].filter(filled).map(function (x) { return ' / ' + x; }).join('');
  }
  function applied() { try { return JSON.parse(localStorage.getItem(DONE_KEY) || 'null'); } catch (e) { return null; } }

  function renderTray() {
    var n = picks.length, done = applied();
    $('#nav-count').textContent = n;
    if (!$('#tray-sum').classList.contains('warn')) {
      $('#tray-sum').innerHTML = done && !n ? '신청 완료 · 접수번호 <b>' + esc(done.id) + '</b>'
        : n ? '<b>' + esc(byId[picks[0]].title) + '</b>' + (n > 1 ? ' 외 대신 받을 책 1권' : '') : '아직 고른 책이 없어요';
    }
    $('#tray-go').disabled = !n && !done;
    $('#tray-go').textContent = !n && done ? '신청 내역' : '신청하기';

    $('#tray-list').innerHTML = n ? picks.map(function (id, i) {
      var b = byId[id];
      return '<li><span class="tl-n">' + label(i) + '</span><div class="tl-book"><b>' + esc(b.title) + '</b><span>' + esc([b.author, b.publisher].filter(filled).join(' · ')) +
        (b.custom ? ' <em class="tag-custom">직접 고름 · 확인 후 주문</em>' : '') + '</span></div>' +
        '<div class="tl-act">' + (n > 1 && i === 1 ? '<button type="button" data-up="' + esc(id) + '">먼저 받기</button>' : '') +
        '<button type="button" data-del="' + esc(id) + '">빼기</button></div></li>';
    }).join('') : (done ? '' : '<li class="tl-empty">아직 고른 책이 없어요. 목록에서 골라주세요.</li>');

    var when = [C.eventDate, C.eventTime].filter(filled).join(' ');
    $('#tray-pickup').innerHTML = '<p class="acc-label">받는 날</p><p>' + esc(when || '정해지는 대로 알려드려요') +
      (filled(C.place) ? ' · ' + esc(C.place) : '') + '<br><span class="small">신청할 때 적은 닉네임으로 받아가요.</span></p>';

    $('#youth-form').hidden = !n || CLOSED;
    $('#tray-note').hidden = !n;
    if (CLOSED) $('#tray-note').textContent = '온라인 신청은 마감됐어요. 행사 날 비북스에 와서 직접 골라주세요.';
    var dn = $('#youth-done');
    if (!n && done) { dn.hidden = false; dn.innerHTML = doneHtml(done); } else if (n) dn.hidden = true;
  }
  function doneHtml(d) {
    return '<p class="done-h">신청이 됐어요.</p><p>접수번호 <b>' + esc(d.id) + '</b> · ' + esc(d.nick) + '</p>' +
      '<p>고른 책: ' + esc(d.book) + '</p><p>비북스가 책을 주문해 준비하고, 받는 날 안내를 연락처와 이메일로 보내드려요. 책을 바꾸고 싶으면 비북스에 연락해 주세요.</p>';
  }

  function initYouthForm() {
    var form = $('#youth-form'), Y = window.YBG, btn = $('button[type=submit]', form), msg = $('.form-msg', form);
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
        ['over14', Y.isChecked, '만 14세 미만은 보호자 동의가 필요해요. 비북스로 연락 주세요.'],
        ['consent', Y.isChecked, '개인정보 수집·이용에 동의해 주세요.']
      ]);
      if (err) { msg.textContent = err; return; }
      var f = form.elements, b1 = byId[picks[0]], b2 = picks[1] ? byId[picks[1]] : null;
      btn.disabled = true; btn.textContent = '보내는 중…';
      Y.post('youth', {
        nick: f.nick.value, age: f.age.value, school: f.school.value, bucheon: f.bucheon.checked, phone: f.phone.value, email: f.email.value,
        book1: bookText(b1), isbn1: b1.isbn || '', book2: b2 ? bookText(b2) : '', isbn2: b2 ? (b2.isbn || '') : '',
        custom1: !!b1.custom, custom2: !!(b2 && b2.custom),
        genrePublic: f.genrePublic.checked, consent: f.consent.checked
      }, f.website.value).then(function (res) {
        if (!res.ok) throw new Error(res.error || '접수하지 못했어요.');
        var rec = { id: res.id, nick: f.nick.value, book: b1.title };
        try { localStorage.setItem(DONE_KEY, JSON.stringify(rec)); } catch (x) { /* 저장 못 해도 접수는 됐다 */ }
        picks = []; savePicks(); form.reset(); renderGrid(); renderTray();
        $('#youth-done').focus();
      }).catch(function (err) {
        msg.textContent = err.message === 'Failed to fetch' ? '보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러주세요.' : err.message;
      }).then(function () { if (filled(C.api)) { btn.disabled = false; btn.textContent = '이 책으로 신청하기'; } });
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
      var b = e.target.closest('.pick-btn'); if (b && !b.disabled) { toggle(b.getAttribute('data-id')); renderDetail(); }
    });
    $('#list-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-list]'); if (b) selectList(b.getAttribute('data-list'));
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
      if (del) { picks.splice(picks.indexOf(del), 1); savePicks(); renderGrid(); renderTray(); }
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
        .map(function (l) { l.books = (l.books || []).filter(function (id) { return byId[id]; }); return l; });
      var first = lists.filter(function (l) { return l.books.length; })[0];
      state.list = first ? first.id : (P.custom !== false ? 'custom' : lists[0].id);
      loadCustom();
      var hasStock = books.some(function (b) { return b.stock !== null && b.stock !== undefined; });
      if (filled(data.updatedAt)) $('#updated').textContent = (hasStock ? '목록과 남은 권수는 ' : '목록은 ') + data.updatedAt + ' 기준이에요.';
      loadPicks(); renderTabs(); renderGenres(); renderGrid(); renderTray();
    }).catch(function (err) {
      console.warn('책 목록을 읽지 못했어요:', err);
      $('#book-grid').innerHTML = '<li class="empty-list">책 목록을 불러오지 못했어요. 잠시 뒤 다시 열어주세요.</li>';
    });
  }
  init();
})();
