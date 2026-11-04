/* ─────────────────────────────────────────────
   청소년 책사줄게 · 설정
   바뀔 수 있는 값은 전부 여기 한 곳에 있어요.
   비어 있는 값('' / null / [])은 화면에서 숨기거나 "준비 중"으로 보여요.
   ───────────────────────────────────────────── */
window.CONFIG = {
  // 히어로 카피 A·B·C 중 하나 — A로 확정 (2026-11-03)
  heroVariant: 'A',

  // 행사 날짜 — 12/19(토)로 확정 (2026-11-04)
  eventDate: '12월 19일(토)',
  // 청소년 행사 시간 — 일단 10시–4시 (2026-11-04)
  eventTime: '10:00–16:00',
  // 온라인 신청 마감 = 행사 1주 전. 지나면 책 고르기 페이지는 둘러보기만 되고 "현장에서 골라요"로 바뀌어요
  // (apps-script/Code.gs의 APPLY_DEADLINE도 같이 바꾸기)
  applyDeadline: '2026-12-12',
  applyDeadlineLabel: '12월 12일(토)',
  // 행사 장소
  place: '비북스 · 부천 원미동',

  // 목표 권수 = 서가 칸 수 = 청소년 참여 인원 — 1회차 50권 (2026-11-04)
  targetBooks: 50,
  // 책 한 권 한도 = 책 한 칸 값(원). 정가 2만 원 이하 (2026-11-04)
  bookPrice: 20000,
  // [결정 필요] 후원 금액 단계(원). 기획서 제안 1·2·5·10만원 + 자유금액
  donationSteps: [10000, 20000, 50000, 100000],
  // [결정 필요] 후원 목표 금액(원). 비어 있으면 표시하지 않음
  goalAmount: null,

  // 후원 계좌 — 일단 비북스 입금 계좌 (2026-11-04)
  account: { bank: '카카오뱅크', number: '7942-33-45474', holder: '경규환' },

  // 접수 시트(Apps Script 웹앱) 주소. 비어 있으면 페이지의 신청·후원 버튼이 "접수 준비 중"으로 보여요
  // 시트 구조와 운영은 SHEET.md
  api: 'https://script.google.com/macros/s/AKfycbwyQeNiCIkx9v_wMskOJArsKQw2j2ugGkG9VT6nkrK8pRSLaw8KEJCGZk4fBIjegV6A/exec',

  // 대상 연령. 원조 기준 14~19세. 만 14세 미만은 신청 폼에서 막고 비북스로 연락하도록 안내
  ageRange: '14~19세',
  // 지역 제한 — 부천 한정 (2026-11-04). 신청 폼에서 학교 이름을 받고 '부천 거주·재학' 확인
  regionLimit: '부천에 살거나 부천에 있는 학교에 다니는',

  // [결정 필요] 비북스 차별점 2~3개
  // 고를 수 있는 값: 'event'(행사형) · 'archive'(내일의 서재 아카이브) · 'neighborhood'(원미동 동네 기반)
  //                  'curation'(0.1평 점주 큐레이션) · 'bmoim'(비모임 후속 경험)
  differentiators: ['event', 'archive', 'neighborhood'],

  // [결정 필요] 기관·기업 함께하기 패키지 구성. 문장 배열. 비어 있으면 "패키지 준비 중"
  orgPackage: [],

  // FAQ 답 (2026-11-04). 비어 있으면 "정해지는 대로 이 페이지에 알려드릴게요"
  faqAnswers: {
    leftover: '후원금은 따로 적립해 투명하게 관리해요. 모인 금액, 책값으로 쓴 금액, 남은 금액을 회차가 끝날 때마다 공개해요.',
    receipt: '기부금영수증은 아직 발행할 수 없어요. 현금영수증은 발급해 드려요. 후원 접수할 때 "현금영수증 신청"에 체크해 주세요.'
  },

  // 개인정보 보관 기간 (2026-11-04)
  retention: '3년',

  // 연락처 — 서든리 대표 전화·메일 + 비북스 인스타그램 (2026-11-04). 비어 있는 항목은 숨김
  contact: { phone: '010-6663-4850', email: 'joyfulldelivery@naver.com', instagram: 'b_books2026' },

  // 준비된 이미지. images/ 폴더에 파일을 넣은 뒤 true로 바꾸면 대체 그래픽 대신 보여요
  // hero.jpg · step-1.png ~ step-4.png (og.jpg는 index.html의 og:image에서 씀)
  images: { hero: false, steps: false },

  // 책 고르기·신청 페이지 pick.html — 목록에서 골라 바로 신청(접수 시트 '신청' 탭)
  // 재고 없이 운영: 신청이 들어오면 도매처에 주문해 준비 (2026-11-04)
  pick: {
    enabled: true,                 // false면 첫 화면에서 "책 고르기" 블록을 숨김
    booksSource: 'data/books.json', // 큐레이션 목록 (1회차 11권)
    maxPicks: 2,                   // 2 = 고른 책 + 대신 받을 책(구하기 어려울 때), 1 = 한 권만
    // 목록에 없는 책 직접 고르기 — 비북스가 검수 후 주문. 기준은 느슨하게
    custom: true,
    customRule: '읽고 싶은 책이면 무엇이든 괜찮아요. 정가 2만 원 이하이고, 청소년이 읽기에 알맞지 않은 책(성인용 등)만 아니면 돼요. 비북스가 한번 확인하고 주문해요. 구하기 어려우면 연락드릴게요.'
  },

  // 서가 데이터 위치. JSON 파일 / 공개 CSV URL / Apps Script URL(JSON) 중 하나
  // CSV는 주소가 .csv로 끝나거나 output=csv를 포함하면 자동으로 CSV로 읽어요
  // 'sheet' = 접수 시트 후원 탭에서 '입금확인'된 후원으로 자동 (5분마다 갱신). 시트를 못 읽으면 data/shelf.json
  shelfSource: 'sheet'
};
