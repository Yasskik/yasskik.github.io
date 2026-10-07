#!/usr/bin/env python3
"""Render preview screenshots with headless Chrome (Playwright).

  python3 tools/screenshot.py [--out previews] [--chrome /usr/bin/google-chrome]
Serves the site on a local port, then captures hero + full-page shots for desktop and mobile, EN and AR.
"""
import argparse, functools, http.server, threading, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent

def serve(port):
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    h.log_message = lambda *a: None
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

def settle(page):
    page.evaluate("document.fonts.ready")
    # walk the page so every reveal animation fires, then return to top
    h = page.evaluate("document.body.scrollHeight")
    y = 0
    while y < h:
        page.mouse.wheel(0, 700); y += 700; time.sleep(0.12)
        h = page.evaluate("document.body.scrollHeight")
    page.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('is-in'))")
    page.evaluate("window.scrollTo(0,0)"); time.sleep(1.4)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="previews")
    ap.add_argument("--chrome", default="/usr/bin/google-chrome")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    out = ROOT / a.out; out.mkdir(exist_ok=True)
    srv = serve(a.port)
    base = f"http://127.0.0.1:{a.port}/"
    shots = {
        "desktop": dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1),
        "mobile": dict(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True),
    }
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=a.chrome, args=["--hide-scrollbars"])
        for lang, path in (("en", ""), ("ar", "ar/")):
            for kind, opts in shots.items():
                if a.only and a.only not in f"{lang}-{kind}": continue
                ctx = b.new_context(**opts)
                page = ctx.new_page()
                page.goto(base + path, wait_until="networkidle")
                time.sleep(2.2)  # entrance animation
                page.screenshot(path=str(out / f"{lang}-{kind}-hero.png"))
                if opts.get("device_scale_factor", 1) > 1:
                    # very tall pages exceed Chrome's capture texture at 2x; full page is taken at 1x
                    ctx.close()
                    opts = dict(opts, device_scale_factor=1)
                    ctx = b.new_context(**opts)
                    page = ctx.new_page()
                    page.goto(base + path, wait_until="networkidle"); time.sleep(1.5)
                settle(page)
                vh = opts["viewport"]["height"]
                # freeze viewport-relative hero height so the full-page capture matches the real fold
                css = ".ticker__track{animation:none!important}.progress{display:none}"
                if kind == "desktop":
                    css += f".hero__grid{{height:{vh - 68}px !important}}"
                page.add_style_tag(content=css)
                time.sleep(0.4)
                page.screenshot(path=str(out / f"{lang}-{kind}-full.png"), full_page=True)
                if lang == "en":
                    from PIL import Image
                    full = Image.open(out / f"{lang}-{kind}-full.png")
                    scale = opts.get("device_scale_factor", 1)
                    for sec in (["about", "experience", "work", "systems", "skills", "education", "contact"] if kind == "desktop" else ["about", "work", "systems"]):
                        box = page.evaluate(f"(()=>{{const r=document.getElementById('{sec}').getBoundingClientRect();return [r.top+scrollY,r.height]}})()")
                        top, hgt = int(box[0] * scale), int(box[1] * scale)
                        full.crop((0, top, full.width, top + hgt)).save(out / f"{lang}-{kind}-{sec}.png")
                ctx.close()
        b.close()
    srv.shutdown()
    print("saved to", out)

if __name__ == "__main__":
    main()
