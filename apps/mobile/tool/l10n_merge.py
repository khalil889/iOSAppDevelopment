#!/usr/bin/env python3
"""Temporary helper while screens are being translated in parallel.

Merges lib/l10n/parts/<area>_{en,ar}.arb into lib/l10n/app_{en,ar}.arb and
runs `flutter gen-l10n`. Fails on duplicate keys across parts and on keys
missing from the Arabic file.
"""
import collections, glob, json, os, subprocess, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)
merged = {}
for loc in ('en', 'ar'):
    out = collections.OrderedDict([('@@locale', loc)])
    owner = {}
    for path in sorted(glob.glob(f'lib/l10n/parts/*_{loc}.arb')):
        part = json.load(open(path, encoding='utf-8'), object_pairs_hook=collections.OrderedDict)
        for k, v in part.items():
            if k in out:
                sys.exit(f'duplicate key {k} in {path} (already in {owner[k]})')
            out[k] = v
            owner[k] = path
    merged[loc] = out
missing = [k for k in merged['en'] if not k.startswith('@') and k not in merged['ar']]
extra = [k for k in merged['ar'] if not k.startswith('@') and k not in merged['en']]
if missing or extra:
    sys.exit(f'arabic missing: {missing}\narabic extra: {extra}')
for loc, out in merged.items():
    with open(f'lib/l10n/app_{loc}.arb', 'w', encoding='utf-8') as f:
        f.write(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
env = dict(os.environ, PATH='/opt/sdk/flutter/bin:' + os.environ.get('PATH', ''))
subprocess.run(['flutter', 'gen-l10n'], check=True, env=env, stdout=subprocess.DEVNULL)
print(f"merged {len(merged['en'])} en entries")
