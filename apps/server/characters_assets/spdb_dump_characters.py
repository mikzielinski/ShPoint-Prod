#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ShatterpointDB → per-character dump + index.json
- Czyta listę postaci z /characters/
- Dla każdej strony wyciąga: name, portrait, statystyki, frakcje/tagi, abilities
- Zapisuje do: ./<slug>/data.json + portrait.png
- Buduje:      ./index.json (szybki spis do galerii)
"""

import json
import os
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple
from urllib.parse import urljoin, urlparse, urlsplit, parse_qs

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ====================== KONFIG ======================
BASE = "https://shatterpointdb.com"
LIST_URL = f"{BASE}/characters/"
# UWAGA: serwer odpala skrypt z CWD = apps/client/public/characters
OUT_ROOT = Path(".")            # nie zmieniaj jeśli uruchamiasz z serwera
REQUEST_DELAY = 0.25            # sekundy między żądaniami
TIMEOUT = 15                    # HTTP timeout
MAX_PAGES = 2000                # limit bezpieczeństwa
FORCE_REDOWNLOAD = False        # True = nadpisuj zawsze
# ====================================================

LABEL_MAP = {
    "squad points": "squad_points",
    "force": "force",
    "unit type": "unit_type",
    "stamina": "stamina",
    "durability": "durability",
}

# ---------- LOGGING ----------
def _ts() -> str:
    # tylko lokalny timestamp, BEZ nawiasów
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def log(msg: str):
    # pojedyncza linia do SSE
    print(f"{_ts()} {msg}", flush=True)

def log_step(i: int, total: int, who: str, status: str):
    # 2025-08-22 23:03:47 (34/138) Count Dooku — ✅ Zapisano: portrait.png
    print(f"{_ts()} ({i}/{total}) {who} — {status}", flush=True)

# ---------- HTTP helpers ----------
def mk_session() -> requests.Session:
    s = requests.Session()
    s.trust_env = False  # ignoruj proxy z ENV
    s.headers.update({
        "User-Agent": "Mozilla/5.0 (compatible; ShPointFetcher/1.0)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    s.mount("https://", HTTPAdapter(max_retries=Retry(
        total=3, connect=3, read=3, backoff_factor=0.3,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "HEAD", "OPTIONS"]
    )))
    return s

# ---------- URL / text utils ----------
def abs_url(u: str, base: str) -> str:
    return urljoin(base, u)

def is_same_host(u: str, base: str) -> bool:
    return urlparse(u).netloc == urlparse(base).netloc

def slug_from_url(u: str) -> str:
    segs = [s for s in urlparse(u).path.split("/") if s]
    slug = segs[-1] if segs else "item"
    slug = re.sub(r"[^a-zA-Z0-9\-_.]", "-", slug)
    return slug[:64] or "item"

def text(el) -> str:
    if not el:
        return ""
    return el.get_text(" ", strip=True)

# ---------- discovery ----------
def discover_character_links(session: requests.Session) -> list[str]:
    log(f"Start — pobieram listę postaci: {LIST_URL}")
    r = session.get(LIST_URL, timeout=TIMEOUT)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")

    hrefs = set()
    for a in soup.select('a[href*="/characters/"]'):
        href = a.get("href") or ""
        u = abs_url(href, LIST_URL)
        if is_same_host(u, BASE) and re.search(r"/characters/[^/]+/?$", u):
            hrefs.add(u)

    links = sorted(hrefs)
    log(f"Znaleziono {len(links)} stron postaci")
    return links

# ---------- parsing ----------
def extract_name_and_portrait(soup: BeautifulSoup, page_url: str) -> Tuple[str, Optional[str]]:
    # name
    name_el = soup.select_one("h1")
    name = text(name_el) if name_el else (soup.title.string.strip() if soup.title and soup.title.string else "")

    # slug dla scoringu
    def _slug(u: str) -> str:
        segs = [s for s in urlparse(u).path.split("/") if s]
        return segs[-1] if segs else ""
    page_slug = _slug(page_url).lower()

    # kandydaci
    candidates: list[tuple[str, str]] = []

    # og/twitter – niski priorytet (często logo)
    for sel in ['meta[property="og:image"]', 'meta[name="twitter:image"]']:
        m = soup.select_one(sel)
        if m and m.get("content"):
            candidates.append(("meta", m["content"].strip()))

    # IMG w głównej treści
    main = soup.select_one("main") or soup.select_one("article") or soup
    for img in main.select('img[src*="/media/"]'):
        src = img.get("src") or ""
        if src:
            candidates.append(("img", src))

    if not candidates:
        return name, None

    # scoring
    def score(url: str, origin: str) -> int:
        u = url.lower()
        s = 0
        if any(k in u for k in ["logo", "favicon", "icon", "placeholder"]):
            s -= 100
        if page_slug and page_slug in u:
            s += 60
        if "star-wars-shatterpoint" in u:
            s += 40
        try:
            qs = parse_qs(urlparse(url).query)
            if "height" in qs:
                h = int(qs["height"][0])
                s += min(h // 50, 20)
        except Exception:
            pass
        if origin == "img":
            s += 10
        return s

    best_url, best_score = None, -10**9
    for origin, u in candidates:
        absu = urljoin(BASE, u) if u.startswith("/") else u
        sc = score(absu, origin)
        if sc > best_score:
            best_score, best_url = sc, absu

    return name, best_url

def extract_badges(soup: BeautifulSoup):
    badges: list[str] = []
    for el in soup.select(".badge, .tag, .chip, .pill"):
        t = text(el)
        if t and t not in badges:
            badges.append(t)
    if not badges:
        for el in soup.select("span, a"):
            t = text(el)
            if not t:
                continue
            if len(t) <= 28 and t.count(" ") <= 3 and not t.endswith("."):
                cls = " ".join(el.get("class", []))
                if any(k in cls.lower() for k in ["tag", "badge", "chip", "pill"]):
                    if t not in badges:
                        badges.append(t)
    return badges or None

def extract_stats_block(soup: BeautifulSoup):
    stats: dict = {}
    for strong in soup.find_all(["strong", "b"]):
        label = text(strong).lower().rstrip(": ")
        if label in LABEL_MAP:
            val_text = ""
            sib = strong.next_sibling
            if sib and hasattr(sib, "strip"):
                val_text = sib.strip()
            if not val_text:
                parent = strong.parent
                if parent:
                    val_text = text(parent).replace(text(strong), "").strip(": ").strip()
            key = LABEL_MAP[label]
            stats[key] = val_text

    def to_int(s):
        m = re.search(r"\d+", s or "")
        return int(m.group(0)) if m else 0

    if "squad_points" in stats: stats["squad_points"] = to_int(stats["squad_points"])
    if "force" in stats:        stats["force"]        = to_int(stats["force"])
    if "stamina" in stats:      stats["stamina"]      = to_int(stats["stamina"])
    if "durability" in stats:   stats["durability"]   = to_int(stats["durability"])
    return stats

def extract_abilities(soup: BeautifulSoup):
    abilities = []
    for p in soup.select("p"):
        bold = p.find(["strong", "b"])
        if not bold:
            continue
        title = text(bold)
        if not title or len(title) > 60:
            continue
        full = text(p)
        desc = full.replace(title, "", 1).strip(" :—-")
        if re.match(r"^(squad points|force|unit type|stamina|durability)\b", title.lower()):
            continue
        if len(desc) < 5:
            continue
        abilities.append({"title": title, "text": desc})

    uniq, seen = [], set()
    for a in abilities:
        if a["title"] not in seen:
            uniq.append(a); seen.add(a["title"])
    return uniq

def parse_character_page(html: str, url: str):
    soup = BeautifulSoup(html, "html.parser")
    name, portrait = extract_name_and_portrait(soup, url)
    stats = extract_stats_block(soup)
    factions = extract_badges(soup)
    abilities = extract_abilities(soup)

    return {
        "id": slug_from_url(url),
        "url": url,
        "name": name,
        "portrait": portrait,
        **stats,
        "factions": factions,
        "abilities": abilities,
        "source": {"scraped_at": int(time.time())},
    }

# ---------- IO helpers ----------
def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)

def save_portrait(session: requests.Session, url: str, dest_dir: Path) -> Optional[str]:
    if not url:
        return None
    out = dest_dir / "portrait.png"
    if out.exists() and not FORCE_REDOWNLOAD:
        return str(out)
    try:
        r = session.get(url, timeout=TIMEOUT, stream=True)
        r.raise_for_status()
        with open(out, "wb") as f:
            for chunk in r.iter_content(8192):
                if chunk:
                    f.write(chunk)
        return str(out)
    except Exception:
        return None

# ---------- main ----------
def main():
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    sess = mk_session()

    links = discover_character_links(sess)
    if not links:
        log("Brak linków do postaci — przerywam.")
        return

    total = len(links)
    for i, url in enumerate(links[:MAX_PAGES], start=1):
        slug = slug_from_url(url)
        try:
            log_step(i, total, slug, "⬇️ Pobieranie strony…")
            r = sess.get(url, timeout=TIMEOUT)
            if r.status_code != 200:
                log_step(i, total, slug, f"⏭️ Pomiń (HTTP {r.status_code})")
                continue

            data = parse_character_page(r.text, url)
            name = data.get("name") or slug
            char_dir = OUT_ROOT / slug
            ensure_dir(char_dir)

            # zapis JSON
            json_path = char_dir / "data.json"
            if not json_path.exists() or FORCE_REDOWNLOAD:
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                log_step(i, total, name, "📝 Zapisano: data.json")
            else:
                log_step(i, total, name, "📝 data.json już istnieje")

            # portret
            if data.get("portrait"):
                if save_portrait(sess, data["portrait"], char_dir):
                    log_step(i, total, name, "✅ Zapisano: portrait.png")
                else:
                    log_step(i, total, name, "⚠️ Portret: błąd zapisu")
            else:
                log_step(i, total, name, "⚠️ Brak URL portretu")

        except Exception as e:
            log_step(i, total, slug, f"❌ Błąd: {e}")
        finally:
            time.sleep(REQUEST_DELAY)

    # 3) zbuduj zbiorczy index.json
    index_items = []
    for d in sorted(OUT_ROOT.iterdir()):
        if not d.is_dir():
            continue
        data_path = d / "data.json"
        if not data_path.exists():
            continue
        try:
            with open(data_path, "r", encoding="utf-8") as f:
                obj = json.load(f)
        except Exception:
            continue

        index_items.append({
            "id": d.name,
            "name": obj.get("name") or d.name,
            "unit_type": obj.get("unit_type"),
            "squad_points": obj.get("squad_points"),
            "factions": obj.get("factions") or [],
            "portrait": f"/characters/{d.name}/portrait.png",
        })

    with open(OUT_ROOT / "index.json", "w", encoding="utf-8") as f:
        json.dump(index_items, f, indent=2, ensure_ascii=False)
    log(f"index.json zapisany — {len(index_items)} pozycji")
    log("Zakończono.")

if __name__ == "__main__":
    main()
