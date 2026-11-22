#!/usr/bin/env python3
# ==============================================================================
# VIXAI SOVEREIGN CONGLOMERATE v3.8 — INTERACTIVE DIGITAL MENU & CUSTOMIZER
# Architecture: Hotel Menu Analogy • Real-time Customization • Dodo MoR
# ==============================================================================

import os, sys, json, time, datetime
from urllib.parse import urlparse
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading, urllib.request, pg8000.native

DATABASE_URL = os.getenv("DATABASE_URL", "")
TELEGRAM_BOT_TOKEN = "8681155953:AAEOB99m-nY4cI9Eh4PWGbwWFMal9t1-W_Q"
TELEGRAM_ADMIN_CHAT_ID = "5501290507"
ADMIN_PASSWORD = "P0802"

def notify_telegram(message):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = json.dumps({"chat_id": TELEGRAM_ADMIN_CHAT_ID, "text": message, "parse_mode": "Markdown"}).encode('utf-8')
        req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(req, timeout=5)
    except: pass

def get_db():
    if not DATABASE_URL: return None
    try:
        u = urlparse(DATABASE_URL)
        return pg8000.native.Connection(user=u.username, password=u.password, host=u.hostname, port=u.port or 5432, database=u.path.lstrip("/"), ssl_context=True)
    except: return None

def execute_vft_directive(d):
    conn = get_db()
    if conn:
        try:
            conn.run("INSERT INTO vixai_constitution_rules (rule_key, rule_value, updated_at) VALUES (%s, %s, CURRENT_TIMESTAMP) ON CONFLICT (rule_key) DO UPDATE SET rule_value = EXCLUDED.rule_value, updated_at = CURRENT_TIMESTAMP;", (f"DIRECTOR_DIRECTIVE_{int(time.time())}", d))
            conn.close()
            notify_telegram(f"⚡ *vFT DIRECTIVE EXECUTED*\n\n`{d}`\n\n_Hot-reloaded successfully._")
            return "✨ vFT Family Executed: Directive Hot-Reloaded live."
        except Exception as e: return f"⚠️ Error: {e}"
    return "vFT Swarm active."

HTML_PAGE = """<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIXAI ◈ Sovereign Digital Menu & Storefront</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>.glass { background: rgba(10, 10, 10, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); }</style>
</head>
<body class="bg-[#030303] text-neutral-100 font-sans min-h-screen selection:bg-emerald-500 selection:text-black flex flex-col justify-between p-4 md:p-8">

  <header class="w-full max-w-5xl mx-auto glass rounded-2xl px-6 py-4 flex justify-between items-center border border-white/10 mb-8">
    <div class="flex items-center gap-3">
      <div class="text-emerald-400 font-black text-xl">VIXAI ◈</div>
      <span class="text-xs font-mono text-neutral-400 hidden sm:inline">Autonomous Digital Restaurant & Menu</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
      <span class="text-xs font-mono text-emerald-400">KITCHEN OPEN</span>
    </div>
  </header>

  <main class="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div class="lg:col-span-2 space-y-6">
      <div class="glass p-6 rounded-3xl border border-emerald-500/30">
        <h2 class="text-sm font-mono text-emerald-400 font-bold uppercase tracking-widest mb-1">◈ THE MASTER DIGITAL MENU</h2>
        <p class="text-xs text-neutral-400 mb-6">Select your base solution (dish), customize ingredients, and dispatch instantly.</p>

        <div class="space-y-4">
          <div onclick="selectDish('Small Business Automation Bot', 9, 'Bot')" class="cursor-pointer bg-black/40 hover:bg-emerald-500/10 p-4 rounded-2xl border border-white/10 transition-all flex justify-between items-center group">
            <div>
              <span class="text-[10px] font-mono text-emerald-400 uppercase">Starter Dish</span>
              <h3 class="text-base font-bold text-white group-hover:text-emerald-300">Autonomous Booking & Invoicing Bot</h3>
              <p class="text-xs text-neutral-400 mt-1">WhatsApp/Email sync for clinics & retail ops.</p>
            </div>
            <div class="text-right">
              <span class="text-lg font-black text-white">$9</span>
              <span class="text-[10px] block font-mono text-neutral-500">Select ➔</span>
            </div>
          </div>

          <div onclick="selectDish('AI Code Doctor & Refactoring Utility', 15, 'Utility')" class="cursor-pointer bg-black/40 hover:bg-emerald-500/10 p-4 rounded-2xl border border-white/10 transition-all flex justify-between items-center group">
            <div>
              <span class="text-[10px] font-mono text-cyan-400 uppercase">Main Course</span>
              <h3 class="text-base font-bold text-white group-hover:text-cyan-300">AI Code Doctor & Refactoring Utility</h3>
              <p class="text-xs text-neutral-400 mt-1">Self-healing bug patcher and log analyzer.</p>
            </div>
            <div class="text-right">
              <span class="text-lg font-black text-white">$15</span>
              <span class="text-[10px] block font-mono text-neutral-500">Select ➔</span>
            </div>
          </div>

          <div onclick="selectDish('Custom Swarm Workflow Pipeline', 29, 'Pipeline')" class="cursor-pointer bg-black/40 hover:bg-emerald-500/10 p-4 rounded-2xl border border-white/10 transition-all flex justify-between items-center group">
            <div>
              <span class="text-[10px] font-mono text-amber-400 uppercase">Chef Special</span>
              <h3 class="text-base font-bold text-white group-hover:text-amber-300">Custom Swarm Workflow Pipeline</h3>
              <p class="text-xs text-neutral-400 mt-1">Multi-agent loop framework for enterprise operations.</p>
            </div>
            <div class="text-right">
              <span class="text-lg font-black text-white">$29</span>
              <span class="text-[10px] block font-mono text-neutral-500">Select ➔</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="lg:col-span-1">
      <div class="glass p-6 rounded-3xl border border-white/10 sticky top-6">
        <h2 class="text-sm font-mono text-cyan-400 font-bold uppercase tracking-widest mb-4">🎛️ INGREDIENT CUSTOMIZER</h2>
        <div class="space-y-4 text-xs font-mono">
          <div>
            <label class="text-neutral-400 block mb-1">Selected Dish:</label>
            <input type="text" id="selected-dish" readonly value="Small Business Automation Bot" class="w-full bg-black border border-white/20 p-2.5 rounded-xl text-emerald-400 font-bold">
          </div>
          <div>
            <label class="text-neutral-400 block mb-1">Architecture Taste (Stack):</label>
            <select id="custom-stack" class="w-full bg-black border border-white/20 p-2.5 rounded-xl text-white">
              <option value="Python / FastAPI">Python / FastAPI (Standard)</option>
              <option value="Next.js / TypeScript">Next.js / TypeScript (+ $5)</option>
              <option value="Rust / Secure Core">Rust / Secure Core (+ $12)</option>
            </select>
          </div>
          <div>
            <label class="text-neutral-400 block mb-1">Delivery Speed (Crispiness):</label>
            <select id="custom-speed" class="w-full bg-black border border-white/20 p-2.5 rounded-xl text-white">
              <option value="Instant Standard">Instant Standard (60 Sec)</option>
              <option value="Hyper-Priority Swarm">Hyper-Priority Swarm (+ $3)</option>
            </select>
          </div>
          <div>
            <label class="text-neutral-400 block mb-1">Special Instruction:</label>
            <textarea id="custom-notes" placeholder="e.g. Include multi-language support..." class="w-full bg-black border border-white/20 p-2.5 rounded-xl text-white h-20 resize-none"></textarea>
          </div>
          <div class="pt-4 border-t border-white/10 flex justify-between items-center">
            <span class="text-neutral-400">Total Price:</span>
            <span id="display-price" class="text-2xl font-black text-emerald-400">$9.00</span>
          </div>
          <button onclick="dispatchOrder()" class="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold py-3.5 rounded-xl text-center uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
            DISPATCH CUSTOM ORDER ➔
          </button>
        </div>
      </div>
    </div>
  </main>

  <footer class="w-full text-center py-6 text-[10px] font-mono text-neutral-500 border-t border-white/5 mt-12">
    Vixai Sovereign Conglomerate • Interactive Menu Protocol • Zero Human Intervention
  </footer>

  <script>
    let basePrice = 9;
    function selectDish(name, price, type) {
      document.getElementById('selected-dish').value = name;
      basePrice = price;
      updateTotal();
    }
    function updateTotal() {
      let stack = document.getElementById('custom-stack').value;
      let speed = document.getElementById('custom-speed').value;
      let extra = 0;
      if(stack.includes('Next.js')) extra += 5;
      if(stack.includes('Rust')) extra += 12;
      if(speed.includes('Hyper')) extra += 3;
      let total = basePrice + extra;
      document.getElementById('display-price').innerText = '$' + total.toFixed(2);
    }
    document.getElementById('custom-stack').addEventListener('change', updateTotal);
    document.getElementById('custom-speed').addEventListener('change', updateTotal);
    function dispatchOrder() {
      let dish = document.getElementById('selected-dish').value;
      alert("Order Received by Jarvis Swarm! Customizing '" + dish + "'. Redirecting to secure Dodo Checkout...");
      window.open('https://app.dodopayments.com/buy/pdt_0NsWTXblvspRy2ukY0', '_blank');
    }
  </script>
</body>
</html>"""

ADMIN_HTML = """<!DOCTYPE html>
<html lang="en" class="dark">
<head><meta charset="UTF-8"><title>vFT Sovereign Nexus</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-black text-emerald-400 p-6 font-mono min-h-screen flex items-center justify-center">
  <div id="auth-box" class="max-w-md w-full bg-neutral-900 border border-emerald-500/40 p-6 rounded-2xl">
    <h2 class="text-sm font-bold mb-4 uppercase text-white">◈ Enter Admin Password (P0802)</h2>
    <input type="password" id="pwd" placeholder="Password..." class="bg-black border border-white/25 p-3 w-full mb-4 text-white rounded-xl text-xs">
    <button onclick="checkAuth()" class="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl text-xs uppercase">UNLOCK</button>
    <p id="err" class="text-rose-400 text-xs mt-3 text-center"></p>
  </div>
  <div id="panel-box" class="max-w-xl w-full bg-neutral-900 border border-emerald-500/40 p-6 rounded-2xl hidden">
    <h2 class="text-sm font-bold mb-4 uppercase text-white">◈ vFT COMMAND NEXUS</h2>
    <input type="text" id="cmd" placeholder="Directive..." class="bg-black border border-white/25 p-3 w-full mb-3 text-white rounded-xl text-xs">
    <button onclick="execCmd()" class="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl text-xs uppercase mb-4">EXECUTE</button>
    <pre id="out" class="bg-black p-4 rounded-xl text-xs text-neutral-300 border h-40 overflow-y-auto"></pre>
  </div>
  <script>
    function checkAuth() {
      if(document.getElementById('pwd').value === "P0802") {
        document.getElementById('auth-box').classList.add('hidden');
        document.getElementById('panel-box').classList.remove('hidden');
      } else { document.getElementById('err').innerText = "Incorrect Password."; }
    }
    async function execCmd() {
      const d = document.getElementById('cmd').value;
      const res = await fetch('/vft-command', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({directive: d}) });
      const j = await res.json();
      document.getElementById('out').innerText += "\\n> " + d + "\\n" + j.reply + "\\n";
      document.getElementById('cmd').value = "";
    }
  </script>
</body>
</html>"""

class VixaiServer(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/admin-sovereign-portal-xyz":
            self.send_response(200)
            self.send_header("Content-type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(ADMIN_HTML.encode("text/html; charset=utf-8"))
            return
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(HTML_PAGE.encode("text/html; charset=utf-8"))

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        payload = self.rfile.read(content_length)
        if self.path == "/vft-command":
            try:
                data = json.loads(payload.decode("utf-8"))
                reply = execute_vft_directive(data.get("directive", ""))
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"reply": reply}).encode("utf-8"))
            except:
                self.send_response(500)
                self.end_headers()

def main():
    port = int(os.getenv("PORT", 8080))
    HTTPServer(("0.0.0.0", port), VixaiServer).serve_forever()

if __name__ == "__main__":
    main()
