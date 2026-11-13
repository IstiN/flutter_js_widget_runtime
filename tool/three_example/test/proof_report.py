#!/usr/bin/env python3
"""Merge the native R1 sweep, the headless-Chrome upstream reference sweep and
the screenshot pairs into one self-contained HTML proof report.

Usage: python3 proof_report.py <native_results.json> <refs_dir> <native_caps_dir> <out_html>
- native_results.json: [{id, fps_median, presented, first_frame_ms, errors}, ...]
- refs_dir: refs.json + <id>.png from reference_chrome.mjs
- native_caps_dir: <id>.png native captures
"""
import json, sys, os, base64, io

def main():
    native_path, refs_dir, caps_dir, out_html = sys.argv[1:5]
    native = {r['id']: r for r in json.load(open(native_path))}
    refs = {}
    if os.path.exists(os.path.join(refs_dir, 'refs.json')):
        refs = {r['id']: r for r in json.load(open(os.path.join(refs_dir, 'refs.json')))}
    rows = []
    for ex_id in sorted(set(native) | set(refs)):
        n = native.get(ex_id, {})
        r = refs.get(ex_id, {})
        rows.append({
            'id': ex_id,
            'native_fps': n.get('fps_median'),
            'chrome_fps': r.get('fps'),
            'presented': n.get('presented'),
            'errors': (n.get('errors') or [])[:1] + (r.get('errors') or [])[:1],
            'native_png': os.path.join(caps_dir, ex_id + '.png'),
            'ref_png': os.path.join(refs_dir, ex_id + '.png'),
        })

    def img64(path):
        if not os.path.exists(path):
            return ''
        try:
            from PIL import Image
            im = Image.open(path).convert('RGB')
            im.thumbnail((420, 300))
            buf = io.BytesIO()
            im.save(buf, format='JPEG', quality=80)
            return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
        except Exception:
            return ''

    def diff_metric(a, b):
        if not (os.path.exists(a) and os.path.exists(b)):
            return None
        try:
            import numpy as np
            from PIL import Image
            ia = Image.open(a).convert('RGB').resize((320, 220))
            ib = Image.open(b).convert('RGB').resize((320, 220))
            da = np.asarray(ia, dtype=np.float32)
            db = np.asarray(ib, dtype=np.float32)
            return float(np.sqrt(((da - db) ** 2).mean()))
        except Exception:
            return None

    parts = ['<html><head><meta charset="utf-8"><title>R1 vs upstream r186 proof</title>',
             '<style>body{font:12px monospace;background:#111;color:#ddd}',
             'td,th{padding:4px 6px;border-bottom:1px solid #333;vertical-align:top}',
             '.bad{color:#f66}.good{color:#6f6}.mid{color:#fc6}img{display:block;margin:2px}</style></head><body>',
             '<h2>Native R1 vs official three.js r186 (headless Chrome)</h2>',
             '<table><tr><th>example</th><th>R1 fps</th><th>Chrome fps</th><th>RMSE</th><th>native</th><th>reference</th><th>errors</th></tr>']
    for row in rows:
        nf, cf = row['native_fps'], row['chrome_fps']
        cls = 'good' if (nf or 0) >= 55 else ('mid' if (nf or 0) >= 30 else 'bad')
        rmse = diff_metric(row['native_png'], row['ref_png'])
        parts.append('<tr>'
                     f'<td>{row["id"]}</td>'
                     f'<td class="{cls}">{nf}</td>'
                     f'<td>{cf}</td>'
                     f'<td>{"" if rmse is None else round(rmse, 1)}</td>'
                     f'<td><img src="{img64(row["native_png"])}"></td>'
                     f'<td><img src="{img64(row["ref_png"])}"></td>'
                     f'<td>{" ".join(str(e)[:90] for e in row["errors"])}</td></tr>')
    parts.append('</table></body></html>')
    with open(out_html, 'w') as f:
        f.write('\n'.join(parts))
    print('wrote', out_html)

if __name__ == '__main__':
    main()
