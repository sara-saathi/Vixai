#!/bin/bash
pkill -f node
pkill -f cloudflared

node server.js > /dev/null 2>&1 &
sleep 2

echo "=========================================================="
echo "🚀 VIXAI ENGINE STARTING... (Founder: Rayan Rajesh Parikh)"
echo "=========================================================="
echo "⏳ Cloudflare se secure worldwide link generate ho raha hai..."
echo ""

cloudflared tunnel --url http://localhost:3000 2>&1 | while read -r line; do
    if echo "$line" | grep -q "trycloudflare.com"; then
        LINK=$(echo "$line" | grep -o 'https://[^ ]*trycloudflare.com')
        echo ""
        echo "=========================================================="
        echo "✅ AAPKI WORLDWIDE LIVE WEBSITE TAIYAR HAI:"
        echo "👉 $LINK"
        echo "=========================================================="
        echo ""
    fi
done
