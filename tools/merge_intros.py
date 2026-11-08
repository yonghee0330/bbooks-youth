#!/usr/bin/env python3
"""tools/intro_batches/out_*.json 을 data/books.json intro에 합친다."""
import json
import importlib.util
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
BOOKS = ROOT / 'data' / 'books.json'
OUT_DIR = HERE / 'intro_batches'


def main():
    data = json.loads(BOOKS.read_text(encoding='utf-8'))
    by_id = {b['id']: b for b in data['books']}
    files = sorted(OUT_DIR.glob('out_*.json'))
    if not files:
        sys.exit('out_*.json 이 없어요.')
    n = 0
    missing = []
    for f in files:
        rows = json.loads(f.read_text(encoding='utf-8'))
        for row in rows:
            b = by_id.get(row['id'])
            if not b:
                missing.append(row['id'])
                continue
            intro = (row.get('intro') or '').strip()
            if not intro:
                missing.append(row['id'] + ':empty')
                continue
            b['intro'] = intro
            b['introSource'] = 'youth'
            n += 1
    spec = importlib.util.spec_from_file_location('kakao', HERE / 'kakao_books.py')
    k = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(k)
    k.write(data)
    print('merged', n, 'from', len(files), 'files')
    youth = sum(1 for b in data['books'] if b.get('introSource') == 'youth')
    print('introSource=youth', youth, '/', len(data['books']))
    if missing:
        print('missing/empty', missing[:20], ('…' if len(missing) > 20 else ''))


if __name__ == '__main__':
    main()
