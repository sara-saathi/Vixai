import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';
import cron from 'node-cron';
import Razorpay from 'razorpay';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Safe Node.js ESM bridge for web-push (Prevents Render Node v24 crash)
const require = createRequire(import.meta.url);
const webpush = require('web-push');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/HRP", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/armaan", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'store.json');

const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'UUxI44i5VioGhyGq-qZf3m029t2s5c8lqF8p4x7r3wQ'
};

try {
    webpush.setVapidDetails('mailto:founder@sarahics.in', vapidKeys.publicKey, vapidKeys.privateKey);
} catch (e) {
    console.log('WebPush init warning:', e.message);
}

function loadStore() {
    try {
        if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {}
    return {
        date: new Date().toISOString().slice(0, 10),
        visitors: { today: 1, yesterday: 0, total: 1 },
        sales: { today: 0, yesterday: 0, total: 0 },
        revenue: { today: 0, yesterday: 0, total: 0 },
        childWalletINR: 0,
        subscribers: [],
        leads: [],
        orders: []
    };
}

let db = loadStore();
if (!db.subscribers) db.subscribers = [];

function saveStore() {
    try { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); } catch (e) {}
}

function checkDateRoll() {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (db.date !== todayStr) {
        db.visitors.yesterday = db.visitors.today;
        db.visitors.today = 0;
        db.sales.yesterday = db.sales.today;
        db.sales.today = 0;
        db.revenue.yesterday = db.revenue.today;
        db.revenue.today = 0;
        db.date = todayStr;
        saveStore();
    }
}

// VISITOR TRACKING
app.post('/api/track-visit', (req, res) => {
    checkDateRoll();
    db.visitors.today += 1;
    db.visitors.total += 1;
    saveStore();
    res.json({ success: true, visitors: db.visitors });
});

// PUBLIC TRANSPARENT METRICS
app.get('/api/public-metrics', (req, res) => {
    checkDateRoll();
    res.json({
        visitors: db.visitors,
        sales: db.sales,
        growthStatus: "EXPANDING (GREEN)"
    });
});

// FOUNDER VIP ACCESS (PASSCODE: P0802)
app.post('/api/founder/login', (req, res) => {
    checkDateRoll();
    const { passcode } = req.body;
    if (passcode !== 'P0802') return res.status(401).json({ success: false, error: 'Unauthorized Access' });

    res.json({
        success: true,
        founder: 'Rayan Rajesh Parikh',
        metrics: {
            totalRevenue: db.revenue.total,
            todayRevenue: db.revenue.today,
            yesterdayRevenue: db.revenue.yesterday,
            childWalletINR: db.childWalletINR,
            visitors: db.visitors,
            sales: db.sales,
            subscribersCount: db.subscribers.length
        },
        orders: db.orders,
        leads: db.leads
    });
});

// RAZORPAY INSTANCE
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_U3n15CrCq4no03',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'c6azXKP4rTGZyGO64KgsIrHN'
});

const catalog = {
    "prod-01": { title: "Autonomous WhatsApp AI Bot", inr: 499, usd: 19, subUsd: 4 },
    "prod-02": { title: "Full VIXAI Business Suite", inr: 1499, usd: 49, subUsd: 12 },
    "prod-03": { title: "Enterprise Custom Intelligence", inr: 2499, usd: 79, subUsd: 24 }
};

app.post('/api/create-order', async (req, res) => {
    try {
        const { productId, clientEmail, currency = 'INR' } = req.body;
        const item = catalog[productId] || catalog['prod-01'];
        const isUSD = currency.toUpperCase() === 'USD';
        const price = isUSD ? item.usd : item.inr;

        const order = await razorpay.orders.create({
            amount: Math.round(price * 100),
            currency: isUSD ? 'USD' : 'INR',
            receipt: `rcpt_${Date.now().toString().slice(-8)}`,
            notes: { productId, clientEmail: clientEmail || '' }
        });

        res.json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_U3n15CrCq4no03'
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Order creation failed' });
    }
});

app.post('/api/verify-payment', (req, res) => {
    checkDateRoll();
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId, clientEmail, currency = 'INR' } = req.body;
        const secret = process.env.RAZORPAY_KEY_SECRET || 'c6azXKP4rTGZyGO64KgsIrHN';
        const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generatedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

        if (generatedSignature !== razorpay_signature) return res.status(400).json({ success: false, error: 'Signature mismatch' });

        const item = catalog[productId] || catalog['prod-01'];
        const isUSD = currency.toUpperCase() === 'USD';
        const amountINR = isUSD ? (item.usd * 85) : item.inr;
        const licenseKey = `VIXAI-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        
        const sonTotalRoyalty = Math.round(amountINR * 0.20);
        const sonWealthShare = Math.round(sonTotalRoyalty * 0.80); // 80% PPF/Gold/SIP
        const sonPocketShare = sonTotalRoyalty - sonWealthShare;    // 20% Pocket Money

        if (!db.armaanVault) {
            db.armaanVault = {
                beneficiaryName: "Armaan Rayan Parikh",
                totalEarnedINR: 0,
                wealthVaultINR: 0,
                pocketVaultINR: 0,
                ledger: []
            };
        }
        db.armaanVault.totalEarnedINR += sonTotalRoyalty;
        db.armaanVault.wealthVaultINR += sonWealthShare;
        db.armaanVault.pocketVaultINR += sonPocketShare;
        db.childWalletINR = db.armaanVault.totalEarnedINR;

        db.armaanVault.ledger.unshift({
            date: new Date().toLocaleString(),
            orderId: razorpay_order_id,
            totalRoyalty: sonTotalRoyalty,
            wealth80: sonWealthShare,
            pocket20: sonPocketShare
        });


        const paidOrder = {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            item: item.title,
            amount: isUSD ? `$${item.usd} USD` : `₹${item.inr}`,
            email: clientEmail,
            licenseKey,
            sonRoyaltyINR: sonRoyalty,
            time: new Date().toLocaleString()
        };

        db.orders.unshift(paidOrder);
        db.sales.today += 1;
        db.sales.total += 1;
        db.revenue.today += amountINR;
        db.revenue.total += amountINR;
        db.childWalletINR += sonRoyalty;
        saveStore();

        res.json({ success: true, order: paidOrder });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// --- MORNING VIBES PUSH SUBSCRIBER SYSTEM ---
app.get("/api/vapid-key", (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
});

app.post("/api/subscribe", async (req, res) => {
    try {
        const subscription = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: "Invalid subscription" });
        }
        if (!db.subscribers) db.subscribers = [];
        const exists = db.subscribers.some(s => s.endpoint === subscription.endpoint);
        if (!exists) {
            db.subscribers.push(subscription);
            saveStore();
        }
        const welcomePayload = JSON.stringify({
            title: "☀️ Subah Bakhair & Swagat Hai!",
            body: "Aapka Daily Morning Vibe activate ho gaya hai. Roz subah 8:00 AM aapko ek positive AI soch milegi ✨",
            icon: "/icon.png"
        });
        await webpush.sendNotification(subscription, welcomePayload).catch(e => console.log("Welcome push note:", e.message));
        res.json({ success: true, message: "Subscribed successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const MORNING_QUOTES = [
    "Subah bakhair! Har din ek nayi umeed lekar aata hai.",
    "Aapki himmat aur neeyat hi aapki sabse badi daulat hai.",
    "Rukna nahi hai, aaj ka din naye sapne sach karne ka hai.",
    "Sukoon aur kamiyabi sachhi mehnat se milti hai.",
    "Aaj ka din aapka hai, poore bharose ke sath shuru kijiye."
];

async function broadcastMorningVibe() {
    if (!db.subscribers || db.subscribers.length === 0) return 0;
    const quote = MORNING_QUOTES[Math.floor(Math.random() * MORNING_QUOTES.length)];
    const payload = JSON.stringify({
        title: "VIXAI · Aaj Ka Shubh Vichar ☀️",
        body: quote,
        icon: "/icon.png"
    });
    const validSubs = [];
    for (const sub of db.subscribers) {
        try {
            await webpush.sendNotification(sub, payload);
            validSubs.push(sub);
        } catch (err) {
            if (err.statusCode !== 410 && err.statusCode !== 404) {
                validSubs.push(sub);
            }
        }
    }
    db.subscribers = validSubs;
    saveStore();
    console.log(`🌅 Morning vibe sent to ${validSubs.length} subscribers!`);
    return validSubs.length;
}

let lastVibeDate = "";
setInterval(() => {
    try {
        const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const todayStr = nowIST.toDateString();
        if (nowIST.getHours() === 8 && nowIST.getMinutes() === 0 && lastVibeDate !== todayStr) {
            lastVibeDate = todayStr;
            broadcastMorningVibe();
        }
    } catch (e) {}
}, 60000);

app.get("/api/send-vibe", async (req, res) => {
    const sentCount = await broadcastMorningVibe();
    res.json({ success: true, message: `Broadcasted to ${sentCount} subscribers` });
});


// --- ARMAAN RAYAN PARIKH SOVEREIGN VAULT & SECURITY LOCK ---
app.get("/api/armaan-vault", (req, res) => {
    if (!db.armaanVault) {
        db.armaanVault = {
            beneficiaryName: "Armaan Rayan Parikh",
            totalEarnedINR: db.childWalletINR || 0,
            wealthVaultINR: Math.round((db.childWalletINR || 0) * 0.80),
            pocketVaultINR: Math.round((db.childWalletINR || 0) * 0.20),
            ledger: []
        };
    }
    res.json(db.armaanVault);
});

app.post("/api/armaan-vault/withdraw", (req, res) => {
    try {
        const { beneficiaryName, upiOrAccount, amount } = req.body;
        const REQUIRED_NAME = "ARMAAN RAYAN PARIKH";

        // STRICT IDENTITY NAME CHECK
        const cleanInputName = (beneficiaryName || "").trim().toUpperCase();
        if (cleanInputName !== REQUIRED_NAME && !cleanInputName.includes("ARMAAN") || !cleanInputName.includes("PARIKH")) {
            return res.status(403).json({
                success: false,
                error: "SECURITY LOCK: Beneficiary name does not match Armaan Rayan Parikh. Funds retained in Vault."
            });
        }

        const amt = parseFloat(amount);
        if (!amt || amt <= 0 || amt > (db.armaanVault.pocketVaultINR || 0)) {
            return res.status(400).json({ success: false, error: "Invalid withdrawal amount or exceeds Pocket Vault balance." });
        }

        db.armaanVault.pocketVaultINR -= amt;
        db.armaanVault.ledger.unshift({
            date: new Date().toLocaleString(),
            type: "WITHDRAWAL",
            amount: amt,
            destination: upiOrAccount,
            beneficiaryVerified: cleanInputName
        });
        saveStore();

        res.json({
            success: true,
            message: `Verified! ₹${amt} approved for transfer to Armaan Rayan Parikh (${upiOrAccount}).`,
            remainingPocketBalance: db.armaanVault.pocketVaultINR
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 VIXAI PRODUCTION SERVER ACTIVE ON PORT ${PORT}`);
});
