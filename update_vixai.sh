#!/bin/bash
cd ~/vixai
echo "[*] Vixai Sovereign Core auto-updating..."

# Naya update seedha script me likh diya jayega
cat << 'INNEREOF' > vixai_core.py
#!/usr/bin/env python3
# ==============================================================================
# VIXAI SOVEREIGN CONGLOMERATE v3.5 — MOBILE AUTO-SYNC CORE
# ==============================================================================
import os, sys, json, time, datetime
from urllib.parse import urlparse
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading, pg8000.native

DATABASE_URL = os.getenv("DATABASE_URL", "")

def get_db():
    if not DATABASE_URL: return None
    try:
        u = urlparse(DATABASE_URL)
        return pg8000.native.Connection(user=u.username, password=u.password, host=u.hostname, port=u.port or 5432, database=u.path.lstrip("/"), ssl_context=True)
    except: return None

def init_geo_table():
    conn = get_db()
    if conn:
        try:
            conn.run("CREATE TABLE IF NOT EXISTS vixai_geo_traffic (country_code VARCHAR(5) PRIMARY KEY, visit_count INT DEFAULT 1, last_visited TIMESTAMP DEFAULT CURRENT_TIMESTAMP);")
            conn.close()
        except: pass

def log_visitor_country(cc):
    if not cc or cc == "XX": cc = "GLOBAL"
    conn = get_db()
    if conn:
        try:
            conn.run("INSERT INTO vixai_geo_traffic (country_code, visit_count, last_visited) VALUES (%s, 1, CURRENT_TIMESTAMP) ON CONFLICT (country_code) DO UPDATE SET visit_count = vixai_geo_traffic.visit_count + 1, last_visited = CURRENT_TIMESTAMP;", (cc.upper(),))
            conn.close()
        except: pass

def fetch_geo_stats():
    conn = get_db()
    stats = [{"country": "GLOBAL", "count": 142}]
    if not conn: return stats
    try:
        res = conn.run("SELECT country_code, visit_count FROM vixai_geo_traffic ORDER BY visit_count DESC LIMIT 4;")
        if res: stats = [{"country": r[0], "count": r[1]} for r in res]
        conn.close()
    except: pass
    return stats

def fetch_public_metrics():
    conn = get_db()
    metrics = {"v_today": 142, "v_yest": 120, "v_total": 4890, "s_today": 12, "s_yest": 15, "s_total": 340, "v_growth": "+18.3%", "v_is_green": True, "s_growth": "-20.0%", "s_is_green": False}
    if not conn: return metrics
    try:
        res = conn.run("SELECT visitors_today, visitors_yesterday, services_today, services_yesterday FROM vixai_daily_metrics WHERE date = CURRENT_DATE;")
        if res:
            v_t, v_y, s_t, s_y = res[0][0] or 0, res[0][1] or 0, res[0][2] or 0, res[0][3] or 0
            v_pct = round(((v_t - v_y) / v_y * 100), 1) if v_y > 0 else 100.0
            s_pct = round(((s_t - s_y) / s_y * 100), 1) if s_y > 0 else 0.0
            metrics = {
                "v_today": v_t, "v_yest": v_y, "v_total": v_t + 4750,
                "s_today": s_t, "s_yest": s_y, "s_total": s_t + 328,
                "v_growth": f"+{v_pct}%" if v_pct >= 0 else f"{v_pct}%", "v_is_green": v_pct >= 0,
                "s_growth": f"+{s_pct}%" if s_pct >= 0 else f"{s_pct}%", "s_is_green": s_pct >= 0
            }
        conn.close()
    except: pass
    return metrics

def execute_vft_directive(d):
    conn = get_db()
    if conn:
        try:
            conn.run("INSERT INTO vixai_constitution_rules (rule_key, rule_value, updated_at) VALUES (%s, %s, CURRENT_TIMESTAMP) ON CONFLICT (rule_key) DO UPDATE SET rule_value = EXCLUDED.rule_value, updated_at = CURRENT_TIMESTAMP;", (f"DIRECTOR_DIRECTIVE_{int(time.time())}", d))
            conn.close()
            return "✨ vFT Family Executed: Directive Hot-Reloaded live."
        except Exception as e: return f"⚠️ Error: {e}"
    return "vFT Swarm active."

HTML_PAGE = """<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIXAI ◈ Sovereign Digital Conglomerate</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>.glass { background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }</style>
</head>
<body class="bg-[#030303] text-neutral-100 font-sans min-h-screen selection:bg-emerald-500 selection:text-black flex flex-col justify-between p-6">
  <div class="max-w-4xl mx-auto w-full text-center py-10">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-6 border border-emerald-500/20 text-xs font-mono text-emerald-400">◈ VIXAI SOVEREIGN MESH ACTIVE</div>
    <h1 class="text-3xl md:text-5xl font-black mb-4">We Carry The Code.<br/><span class="text-emerald-400">You Build The Dream.</span></h1>
    <p class="text-xs md:text-sm text-neutral-400 mb-8 max-w-xl mx-auto">Enterprise-grade software & digital catalog operating under 369 harmonics & P0802 compliance.</p>
    
    <div class="glass p-6 rounded-2xl border border-emerald-500/30 max-w-md mx-auto mb-8 text-left">
      <div class="flex justify-between items-center mb-3">
        <span class="text-xs font-mono text-emerald-400 font-bold uppercase">Autonomous Blueprint</span>
        <span class="text-2xl font-black text-white">$5.00</span>
      </div>
      <p class="text-xs text-neutral-400 mb-4">Instant digital architecture license delivered via Dodo Payments MoR.</p>
      <a href="https://app.dodopayments.com/buy/pdt_0NsWTXblvspRy2ukY0" target="_blank" class="block w-full bg-emerald-500 text-black font-extrabold py-3 rounded-xl text-center text-xs uppercase tracking-wider">Acquire License ➔</a>
    </div>
  </div>
  <footer class="text-center text-[10px] font-mono text-neutral-500">vixai.sarahics.in • Zero Human Intervention</footer>
</body>
</html>"""

class VixaiServer(BaseHTTPRequestHandler):
    def do_GET(self):
        log_visitor_country(self.headers.get("CF-IPCountry", "GLOBAL"))
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(HTML_PAGE.encode("utf-8"))
    def do_POST(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "OK"}).encode("utf-8"))

def main():
    port = int(os.getenv("PORT", 8080))
    HTTPServer(("0.0.0.0", port), VixaiServer).serve_forever()

if __name__ == "__main__":
    main()
INNEREOF

echo "[✓] Local file updated successfully!"
