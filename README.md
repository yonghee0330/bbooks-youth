# 청소년 책사줄게 · 랜딩 페이지

빌드 없는 정적 페이지예요. 파일을 그대로 GitHub Pages에 올리면 돼요.

```
index.html        입구 — 「책을 사주고 싶어요」/「책을 고르고 싶어요」
adult.html        어른 허브 — 후원현황 서가 + 스토리·후원·Q&A
teen/             청소년
  index.html      QR 짧은 주소(/teen) → 바로 책 고르기
  home.html       청소년 허브 — 서가 + 고르기·내신청·받는법·문의
  status.html     내 신청 (이 기기 접수번호)
  howto.html      책 받는 방법 (비북스 방문)
  ask.html        문의 + 청소년 Q&A
about.html        스토리 (어른)
shelf.html        후원현황·서가 (side=teen 이면 청소년 메뉴)
donate.html       후원 참여 (어른)
pick.html         책 고르기·신청
faq.html          Q&A (어른/청소년 탭, ?side=teen 이면 청소년 탭부터)
youth.html        (예전 주소) → /teen/ 으로 넘김
org.html          기관·기업 → 후원으로 넘김
main.js / style.css / config.js / pick.js
data/             books.json · shelf.json
SHEET.md          접수 시트(후원·신청 탭 분리·상태 필터) — 비공개
apps-script/      접수 시트 코드 — 비공개
```

공유 주소
- 어른(SNS·후원 요청): `https://youth.bbooks.co.kr/` → 「책을 사주고 싶어요」또는 `…/adult.html`
- 청소년 QR(학교·도서관·매장): `https://youth.bbooks.co.kr/teen` → 바로 책 고르기


## 1. 내 컴퓨터에서 열어보기

`index.html`을 더블클릭하면 서가 데이터를 못 읽어요(브라우저 보안). 폴더에서 작은 서버를 켜고 열어요.

```bash
cd ~/Desktop/INBOX-B/youth-book-gift && python3 -m http.server 8860
```

브라우저에서 http://localhost:8860

## 2. 배포 (GitHub Pages · youth.bbooks.co.kr)

주소는 **youth.bbooks.co.kr** (폴더에 `CNAME` 파일 있음). 도메인 관리 화면에서 `youth` → `yonghee0330.github.io` CNAME 레코드를 만들고, 저장소 Settings → Pages → Custom domain에 `youth.bbooks.co.kr` 입력 + Enforce HTTPS.
공유 미리보기 이미지는 `images/og.jpg`(1200×630)를 넣으면 바로 쓰여요 (HTML에 절대 주소로 들어가 있음).

> 파일을 고친 뒤 올릴 때는 HTML 안의 `?v=20261104`를 새 날짜로 바꿔주세요. 방문자 브라우저에 남은 옛 파일 대신 새 파일을 받아요.


1. GitHub에 새 저장소를 만들어요 (예: `youth-book-gift`).
2. 이 폴더의 파일을 올려요. `_v1/` 폴더는 올려도 Pages에 공개되지 않아요.
3. 저장소 Settings → Pages → Branch `main`, 폴더 `/ (root)` → Save.
4. 주소가 나오면 `index.html`의 `og:image`를 절대 주소로 바꿔요.
   예: `https://yonghee0330.github.io/youth-book-gift/images/og.jpg`

## 3. 값 바꾸기 (config.js)

`[결정 필요]`라고 적힌 줄이 정해지지 않은 값이에요. 비어 있으면 화면에서 숨기거나 "준비 중"으로 보여요.

이미지를 넣었다면 `images: { hero: true, steps: true }`로 바꿔요. (이미지가 없을 때 불필요한 요청을 막으려고 스위치를 뒀어요.)

## 4. 서가 업데이트

**지금은 자동이에요.** `config.shelfSource: 'sheet'` — 접수 시트 후원 탭에서 상태를 **입금확인**으로 바꾸면 5분 안에 서가에 책이 꽂혀요. 규칙은 SHEET.md 「내일의 서재 자동 반영 규칙」.
시트를 못 읽을 때만 `data/shelf.json`을 대신 보여줘요. 아래는 수동으로 운영할 때(또는 지난 회차를 고정할 때) 방법이에요.

## 4-1. (수동) 서가 업데이트

### 시트 열 구성 — 「서가」 탭

한 줄 = 책 한 칸. 한 후원이 여러 권이면(금액 ÷ 책 금액) 줄도 여러 개예요.

| 회차-순번 | 닉네임 | 공개 여부 | 믿음/미안함 | 한 줄 | 청소년 코드 | 분야 | 날짜 | 입금확인 |
|---|---|---|---|---|---|---|---|---|
| 1-01 | 원미동 이웃 | TRUE | 믿음 | 네가 고른 책이 네 편이길 | | | 2026-11-05 | TRUE |

- **회차-순번**: `회차-두자리순번` (1-01, 1-02 …). 앞 숫자가 회차예요.
- **공개 여부**: 폼에서 공개 동의했으면 TRUE. FALSE면 "원미동 이웃"으로 보이고 한 줄은 숨겨요.
- **청소년 코드 · 분야**: 고르는 날 이후에 채워요. 분야는 청소년이 공개에 동의한 경우만.
- **날짜**: `YYYY-MM-DD`. 최근 24시간 안에 들어온 책은 위에서 떨어지며 꽂혀요.
- 이 탭에는 **연락처·입금자명 같은 개인정보를 넣지 않아요.**

### 시트 → JSON

1. 「서가」 탭에서 입금확인 TRUE인 줄만 봐요.
2. `data/shelf.json`의 해당 회차 `books`에 아래 모양으로 한 줄씩 넣어요.

```json
{ "id": "1-04", "nickname": "닉네임", "public": true, "mind": "믿음",
  "line": "한 줄", "youthCode": null, "genre": null, "addedAt": "2026-11-05" }
```

3. **예시 3권(`"example": true`)은 첫 실제 후원을 넣을 때 지워요.**
4. GitHub에 올리면 1~2분 뒤 반영돼요.

### 회차 끝내기 / 새 회차

- 끝난 회차: `"closed": true` → 아카이브 탭으로 고정돼요.
- 새 회차: `rounds`에 `{ "round": 2, "title": "2회차", "targetBooks": null, "closed": false, "books": [] }` 추가.
- 진행 중인 회차의 `targetBooks`가 비어 있으면 `config.targetBooks`를 써요. 둘 다 비면 30칸 + "목표 권수 준비 중".

## 5. 책 고르기 · 신청 — pick.html

청소년이 목록에서 책을 고르고, 그 자리에서 닉네임·학년·연락처·이메일을 적어 신청해요. 접수 시트 '신청' 탭으로 바로 들어가요 (SHEET.md).

- **신청 도서 1권 + 예비 도서 1권(선택)**. 신청 도서를 구하기 어려우면 예비 도서로 구해줘요. `config.pick.maxPicks`를 1로 바꾸면 한 권만.
- 재고 없이 운영: 신청이 들어오면 '주문 집계' 탭을 보고 도매처에 주문해요.
- 같은 연락처로는 한 번만 신청돼요.
- 페이지를 잠시 닫으려면 `pick.enabled: false` → 첫 화면의 "책 고르기" 블록이 숨어요.

후원도 마찬가지로 donate.html에서 바로 '후원' 탭으로 들어가요.

### 고르는 방법 — 큐레이션 목록 + 직접 고르기

책 고르기 페이지 위쪽 탭: **비북스 제안 · 후원자 제안 · 언론사 선정 청소년 베스트 · 직접 고르기**.
목록은 `data/books.json`의 `lists`에 있어요. 책이 없는 목록은 "준비 중"으로 보여요.

```json
"lists": [
  {"id": "bbooks", "title": "비북스 제안", "by": "비북스", "desc": "비북스가 청소년에게 권하는 책이에요.", "books": ["b01", "b02"]},
  {"id": "donor-kim", "title": "후원자 김○○님 제안", "by": "김○○", "desc": "…", "books": ["b12"]}
]
```
- 책 정보는 `books`에 한 번만 적고, 목록에는 id만 넣어요. 한 책이 여러 목록에 있어도 돼요.
- 목록 순서 = 탭 순서, `books` 순서 = "추천 순" 정렬 순서.
- 목록을 지우면 탭도 사라져요.

**직접 고르기**: 목록에 없는 책을 제목(+지은이·출판사)으로 적어 골라요. 기준 문구는 `config.pick.customRule`.
시트에는 `[직접]`으로 들어가고 검수 칸이 `필요`가 돼요 (SHEET.md).

### 목록 바꾸기 — data/books.json

```json
{ "id": "b12", "featured": false, "title": "제목", "edition": "", "author": "지은이", "publisher": "출판사", "genre": "소설",
  "note": "점주 띠지 한 줄", "curator": "점주 이름", "cover": "images/covers/b09.jpg", "stock": 3 }
```

- `id`는 한 번 정하면 바꾸지 않아요 (폼 응답과 맞춰 세는 기준).
- `genre`가 분야 버튼이 돼요. 같은 글자로 맞춰 쓰기.
- `note`가 있으면 표지 아래 띠지로 보여요 (점주 추천은 참고용 띠지로만).
- `cover`가 비면 표지를 그려서 보여줘요. 표지 이미지는 `images/covers/`에 넣기.
- `stock`: 기본은 `null`(재고 없이 주문). 어떤 책을 그만 받고 싶으면 0으로 → "다 나갔어요"로 못 고르게 돼요.
- `price`: 정가 (카카오 스크립트가 채움). 한도는 2만 원 — 넘는 책은 목록에 넣기 전에 확인하세요.
- `featured: true`면 표지에 "추천" 표시가 붙어요. `edition`은 판 정보(청소년판, 특별판 등)로 제목 아래에 보여요.

### 카카오 책 정보 (표지 · 책 소개)

카카오 책 검색 API는 **REST API 키**가 필요해요. 키를 페이지 코드에 넣으면 누구나 볼 수 있어서,
**내 컴퓨터에서 스크립트로 한 번 받아 `books.json`에 저장**하는 방식으로 했어요. 페이지는 저장된 표지·소개를 보여줘요.

1. https://developers.kakao.com → 내 애플리케이션 → 앱 만들기 → **REST API 키** 복사
   (앱 설정 → 제품 설정에서 '카카오 검색'이 막혀 있으면 켜기)
2. 터미널에서:
   ```bash
   cd ~/Desktop/INBOX-B/youth-book-gift
   export KAKAO_REST_API_KEY=복사한_키
   python3 tools/kakao_books.py --dry-run   # 먼저 어떤 책으로 찾았는지 확인
   python3 tools/kakao_books.py             # 저장
   ```
   키를 매번 넣기 싫으면 `tools/.kakao-key` 파일에 한 줄로 저장해도 돼요 (`.gitignore`에 있어서 GitHub에 안 올라가요).
3. 결과에서 **찾음 → 제목 / 출판사**가 맞는지 봐요. 출판사·지은이·판 이름(청소년판, 특별판)이 맞는 쪽을 골라요.
   "못 찾음"이 나오면 그 책의 `title`을 카카오에 나오는 제목에 맞추고 다시 실행하거나, `cover`·`intro`를 직접 적어요.
4. 책을 새로 넣으면 다시 실행해요. 이미 `isbn`이 있는 책은 건너뛰고, `--force`면 전부 다시 찾아요.
   표지를 직접 넣은 책(`coverSource`가 kakao가 아님)은 덮어쓰지 않아요.

채워지는 칸: `isbn`, `price`(정가), `cover`(썸네일), `coverLarge`(큰 표지), `intro`(소개), `link`(다음 책 상세), `published`, `translators`.
카카오가 주는 소개는 앞부분만 잘린 글이라 끝에 "…"가 붙고, "책 소개 더 보기"로 다음 책 상세에 연결돼요.

## 6. 2단계: 시트에서 바로 읽기 (자동화)

JSON을 손으로 고치지 않고 시트를 바로 읽게 하려면 `config.shelfSource` 한 줄만 바꿔요.

**방법 A — 공개 CSV**
1. 「서가」 탭만 따로 둔 시트에서 파일 → 공유 → 웹에 게시 → 「서가」 탭 · CSV → 게시.
2. 나온 주소(`...output=csv`)를 `shelfSource`에 붙여넣어요.
3. 페이지가 자동으로 CSV를 읽고, **입금확인이 TRUE인 줄만** 보여줘요.
4. CSV에는 회차 정보가 없어서 **가장 큰 회차만 진행 중**, 나머지는 아카이브로 보여요.

> 웹에 게시한 탭은 누구나 볼 수 있어요. 비공개 후원자의 닉네임이 새지 않도록, 서가 탭의 닉네임 열을
> `=IF(공개여부, 닉네임, "원미동 이웃")` 같은 수식으로 채우고(한 줄 열도 비공개면 빈칸으로), 원본 응답 탭은 게시하지 마세요.

**방법 B — Apps Script**
`data/shelf.json`과 같은 모양의 JSON을 돌려주는 웹앱 주소를 `shelfSource`에 넣으면 그대로 읽어요.

## 7. 하지 않는 것

결제 연동, 로그인, 트래킹·분석 스크립트는 넣지 않았어요. 외부 요청은 Google Fonts 하나와, 2단계에서 설정한 시트 주소뿐이에요.
