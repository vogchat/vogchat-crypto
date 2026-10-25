"""Generates docs/assets/e2e-flow-{light,dark}.svg, the animated diagram at the top of the README.
Pure SVG + CSS animation (no scripts), so it plays inside GitHub's README renderer.
    python scripts/make-animation.py
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'docs' / 'assets'
THEMES = {
    'light': dict(bg='#ffffff', panel='#f6f8fa', line='#d0d7de', text='#1f2328', muted='#59636e',
                  bubble='#d9fdd3', bubble_text='#111b21', in_bubble='#ffffff', cipher='#eef1f4', cipher_text='#3b4754',
                  server='#fff8e6', server_line='#e8c66b', green='#00a884', lock='#00a884'),
    'dark': dict(bg='#0d1117', panel='#161b22', line='#30363d', text='#e6edf3', muted='#9198a1',
                 bubble='#005c4b', bubble_text='#e9edef', in_bubble='#202c33', cipher='#21262d', cipher_text='#c9d1d9',
                 server='#2a2414', server_line='#8a6d1f', green='#25d366', lock='#25d366'),
}
CIPHER = 'Tjibu6kfZnNiF71nKyrv…'

SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="880" height="300" viewBox="0 0 880 300" role="img" aria-label="A message is encrypted on your phone, crosses the VogChat server as unreadable ciphertext, and is decrypted on your friend's phone.">
<style>
  text {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }}
  .mono {{ font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }}
  .t {{ fill: {text}; }} .m {{ fill: {muted}; }}
  /* 8 s loop */
  .plain-out  {{ animation: plainOut 8s infinite; }}
  .packet     {{ animation: packet 8s infinite cubic-bezier(.45,0,.25,1); }}
  .lock-close {{ animation: lockClose 8s infinite; transform-origin: 0 0; }}
  .server-glow{{ animation: serverGlow 8s infinite; }}
  .server-ct  {{ animation: serverCt 8s infinite; }}
  .plain-in   {{ animation: plainIn 8s infinite; }}
  .tick       {{ animation: tick 8s infinite; }}
  @keyframes plainOut {{ 0%,3% {{opacity:0; transform:translateY(8px)}} 9%,92% {{opacity:1; transform:none}} 100% {{opacity:0}} }}
  @keyframes packet {{
    0%,16%  {{ opacity:0; transform:translate(0,0) }}
    20%     {{ opacity:1; transform:translate(0,0) }}
    38%     {{ opacity:1; transform:translate(292px,0) }}
    52%     {{ opacity:1; transform:translate(292px,0) }}
    70%     {{ opacity:1; transform:translate(584px,0) }}
    74%,100%{{ opacity:0; transform:translate(584px,0) }} }}
  @keyframes lockClose {{ 0%,17% {{transform:translateY(-5px)}} 21%,100% {{transform:none}} }}
  @keyframes serverGlow {{ 0%,36% {{opacity:0}} 40%,52% {{opacity:1}} 58%,100% {{opacity:0}} }}
  @keyframes serverCt {{ 0%,37% {{opacity:0}} 41%,92% {{opacity:1}} 100% {{opacity:0}} }}
  @keyframes plainIn {{ 0%,70% {{opacity:0; transform:translateY(8px)}} 76%,92% {{opacity:1; transform:none}} 100% {{opacity:0}} }}
  @keyframes tick {{ 0%,76% {{opacity:0}} 80%,92% {{opacity:1}} 100% {{opacity:0}} }}
  @media (prefers-reduced-motion: reduce) {{
    .plain-out, .server-ct, .plain-in, .tick {{ animation: none; opacity: 1; }}
    .packet, .server-glow {{ animation: none; opacity: 0; }}
  }}
</style>
<rect width="880" height="300" rx="16" fill="{bg}"/>

<!-- connectors -->
<path d="M250 200 H330" stroke="{line}" stroke-width="2" stroke-dasharray="4 6"/>
<path d="M550 200 H630" stroke="{line}" stroke-width="2" stroke-dasharray="4 6"/>

<!-- your phone -->
<g transform="translate(40,34)">
  <rect width="210" height="232" rx="26" fill="{panel}" stroke="{line}"/>
  <text x="105" y="34" text-anchor="middle" class="t" font-size="15" font-weight="700">Your phone</text>
  <text x="105" y="54" text-anchor="middle" class="m" font-size="12">encKey never leaves it</text>
  <g class="plain-out">
    <rect x="34" y="84" width="160" height="40" rx="12" fill="{bubble}"/>
    <text x="114" y="109" text-anchor="middle" font-size="14" fill="{bubble_text}">Hi! Coffee at 5?</text>
  </g>
  <text x="105" y="210" text-anchor="middle" class="m" font-size="12">AES-256-GCM</text>
</g>

<!-- server -->
<g transform="translate(330,34)">
  <rect width="220" height="232" rx="18" fill="{server}" stroke="{server_line}"/>
  <rect class="server-glow" width="220" height="232" rx="18" fill="none" stroke="{green}" stroke-width="3"/>
  <text x="110" y="34" text-anchor="middle" class="t" font-size="15" font-weight="700">VogChat server</text>
  <text x="110" y="54" text-anchor="middle" class="m" font-size="12">relays, cannot read</text>
  <g class="server-ct">
    <rect x="18" y="74" width="184" height="36" rx="10" fill="{cipher}"/>
    <text x="110" y="97" text-anchor="middle" class="mono" font-size="12" fill="{cipher_text}">{ctext}</text>
    <text x="110" y="132" text-anchor="middle" class="m" font-size="12">not stored · not readable</text>
  </g>
  <text x="110" y="210" text-anchor="middle" class="m" font-size="12">TLS + end-to-end</text>
</g>

<!-- friend's phone -->
<g transform="translate(630,34)">
  <rect width="210" height="232" rx="26" fill="{panel}" stroke="{line}"/>
  <text x="105" y="34" text-anchor="middle" class="t" font-size="15" font-weight="700">Friend's phone</text>
  <text x="105" y="54" text-anchor="middle" class="m" font-size="12">same password, same key</text>
  <g class="plain-in">
    <rect x="16" y="84" width="160" height="40" rx="12" fill="{in_bubble}" stroke="{line}"/>
    <text x="96" y="109" text-anchor="middle" font-size="14" class="t">Hi! Coffee at 5?</text>
  </g>
  <g class="tick"><text x="105" y="150" text-anchor="middle" font-size="12" fill="{green}" font-weight="600">decrypted on the device</text></g>
  <text x="105" y="210" text-anchor="middle" class="m" font-size="12">AES-256-GCM</text>
</g>

<!-- travelling ciphertext packet -->
<g class="packet" transform="translate(0,0)">
  <g transform="translate(148,200)">
    <rect x="-58" y="-16" width="116" height="32" rx="16" fill="{green}"/>
    <g transform="translate(-44,-9)">
      <g class="lock-close"><path d="M3 8 V5 a4 4 0 0 1 8 0 V8" fill="none" stroke="#ffffff" stroke-width="2"/></g>
      <rect x="1" y="7" width="12" height="10" rx="2" fill="#ffffff"/>
    </g>
    <text x="10" y="4.5" text-anchor="middle" class="mono" font-size="12" fill="#ffffff">Tjibu6kf…</text>
  </g>
</g>
</svg>
"""

OUT.mkdir(parents=True, exist_ok=True)
for name, colors in THEMES.items():
    (OUT / f'e2e-flow-{name}.svg').write_text(SVG.format(ctext=CIPHER, **colors), encoding='utf-8')
    print('wrote', OUT / f'e2e-flow-{name}.svg')
