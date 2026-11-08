#!/usr/bin/env python3
"""카카오 책 검색으로 data/books.json에 표지·책 소개를 채운다.

키는 페이지에 넣지 않는다(정적 사이트라 누구나 볼 수 있음). 내 컴퓨터에서만 이 스크립트로 쓴다.

    export KAKAO_REST_API_KEY=발급받은_REST_API_키
    python3 tools/kakao_books.py            # 아직 안 채운 책만
    python3 tools/kakao_books.py --force    # 전부 다시
    python3 tools/kakao_books.py --dry-run  # 찾기만 하고 저장 안 함

키는 환경변수 대신 tools/.kakao-key 파일(한 줄)에 둬도 된다. 이 파일은 .gitignore에 있다.
"""
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
BOOKS = os.path.join(HERE, '..', 'data', 'books.json')
API = 'https://dapi.kakao.com/v3/search/book'


def load_key():
    key = os.environ.get('KAKAO_REST_API_KEY', '').strip()
    if not key:
        path = os.path.join(HERE, '.kakao-key')
        if os.path.exists(path):
            key = open(path, encoding='utf-8').read().strip()
    if not key:
        sys.exit('KAKAO_REST_API_KEY가 없어요. README의 「카카오 책 정보」를 보세요.')
    return key


def search(key, query):
    url = API + '?' + urllib.parse.urlencode({'query': query, 'target': 'title', 'size': 20})
    req = urllib.request.Request(url, headers={'Authorization': 'KakaoAK ' + key})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.load(r).get('documents', [])


def norm(s):
    return re.sub(r'[\s\W_]+', '', str(s or '')).lower()


def score(book, doc):
    """같은 책인지 점수를 매긴다. 출판사·지은이가 맞을수록, 판 이름이 제목에 있을수록 높다."""
    s = 0
    raw = doc.get('title') or ''
    base = re.sub(r'\(.*?\)|\[.*?\]', '', raw)  # 괄호 속 판 이름은 떼고 비교
    t, dt, bt = norm(book['title']), norm(raw), norm(base)
    if dt == t:
        s += 5
    elif bt == t:
        s += 4  # 「제목(○○ 에디션)」 같은 판
    elif t and t in dt:
        s += 1  # 「제목 2」, 「제목 필사집」 같은 다른 책일 수 있다
    else:
        return -1
    ed = book.get('edition') or ''
    for word in ('한정판', '큰글자', '필사', '팬 사인회', '전용 상품', '중문판', '대만판', '북투어'):
        if word in raw and word not in ed:
            s -= 2
    if '[' in raw:  # [어린이 책Dream] 같은 행사·묶음 상품
        s -= 2
    if norm(book.get('publisher')) and norm(book.get('publisher')) == norm(doc.get('publisher')):
        s += 3
    authors = [norm(a) for a in doc.get('authors') or []]
    for a in re.split(r'[·,/]', book.get('author') or ''):
        if norm(a) and norm(a) in authors:
            s += 3
            break
    for word in re.findall(r'[가-힣A-Za-z0-9]+', ed):
        if len(word) > 1 and word in (doc.get('title') or ''):
            s += 1
    if doc.get('status') == '정상판매':
        s += 1
    if doc.get('thumbnail'):
        s += 1
    return s


def best(book, docs):
    scored = sorted(((score(book, d), d) for d in docs), key=lambda x: -x[0])
    return scored[0] if scored and scored[0][0] >= 5 else (scored[0][0] if scored else -1, None)


def large_cover(thumb):
    """카카오 썸네일 주소의 fname= 원본 이미지 주소를 꺼낸다 (더 큼). 없으면 빈 문자열."""
    q = urllib.parse.urlparse(thumb or '').query
    fname = urllib.parse.parse_qs(q).get('fname', [''])[0]
    return fname.replace('http://', 'https://', 1) if fname else ''


def apply(book, doc):
    isbn = (doc.get('isbn') or '').split()
    book['isbn'] = next((i for i in isbn if len(i) == 13), isbn[0] if isbn else '')
    if not book.get('cover') or book.get('coverSource') == 'kakao':
        book['cover'] = doc.get('thumbnail') or ''
        book['coverLarge'] = large_cover(doc.get('thumbnail'))
        book['coverSource'] = 'kakao'
    # 청소년용 소개(introSource=youth)는 덮어쓰지 않는다. 카카오 원문은 introKakao에만 둔다.
    kakao_intro = (doc.get('contents') or '').strip()
    if kakao_intro:
        book['introKakao'] = kakao_intro
    if book.get('introSource') != 'youth':
        book['intro'] = kakao_intro
        book['introSource'] = 'kakao'
    book['link'] = doc.get('url') or ''
    book['published'] = (doc.get('datetime') or '')[:10]
    book['translators'] = '·'.join(doc.get('translators') or [])
    book['kakaoTitle'] = doc.get('title') or ''
    book['price'] = doc.get('price') or None  # 정가


def write(data):
    # 사람이 고치기 쉽게 책 한 권 = 한 줄로 저장
    lines = ['{', '  "round": %s,' % json.dumps(data.get('round')),
             '  "updatedAt": %s,' % json.dumps(data.get('updatedAt'), ensure_ascii=False), '  "books": [']
    books = data.get('books', [])
    lists = data.get('lists')
    for i, b in enumerate(books):
        lines.append('    ' + json.dumps(b, ensure_ascii=False) + (',' if i < len(books) - 1 else ''))
    if lists is not None:  # 큐레이션 목록(비북스 제안 등)도 한 줄씩 그대로 지킨다
        lines.insert(3, '  "lists": [')
        for i, l in enumerate(lists):
            lines.insert(4 + i, '    ' + json.dumps(l, ensure_ascii=False) + (',' if i < len(lists) - 1 else ''))
        lines.insert(4 + len(lists), '  ],')
    lines += ['  ]', '}', '']
    with open(BOOKS, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


def main():
    force, dry = '--force' in sys.argv, '--dry-run' in sys.argv
    key = load_key()
    data = json.load(open(BOOKS, encoding='utf-8'))
    missed = []
    for b in data.get('books', []):
        if b.get('isbn') and not force:
            print('  건너뜀  %s (이미 있음)' % b['title'])
            continue
        try:
            docs = search(key, b['title'])
        except Exception as e:  # 네트워크·키 오류는 한 권만 건너뛴다
            print('  오류    %s — %s' % (b['title'], e))
            missed.append(b['title'])
            continue
        sc, doc = best(b, docs)
        if not doc:
            print('  못 찾음 %s (후보 %d권, 최고 점수 %s)' % (b['title'], len(docs), sc))
            missed.append(b['title'])
        else:
            apply(b, doc)
            print('  찾음    %s → %s / %s / %s (점수 %d)' % (
                b['title'], doc.get('title'), doc.get('publisher'), b.get('published'), sc))
        time.sleep(0.2)
    if dry:
        print('\n--dry-run: 저장하지 않았어요.')
    else:
        write(data)
        print('\n저장했어요: data/books.json')
    if missed:
        print('직접 확인할 책: ' + ', '.join(missed))
        print('→ books.json에서 그 책의 "title"을 카카오에 나오는 제목에 맞추거나, cover·intro를 직접 적어주세요.')


if __name__ == '__main__':
    main()
