import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';
import cron from 'node-cron';
import webpush from 'web-push';
import Razorpay from 'razorpay';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'store.json');

// VAPID KEYS FOR ANONYMOUS PUSH
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'UUxI44i5VioGhyGq-qZf3m029t2s5c8lqF8p4x7r3wQ'
};

webpush.setVapidDetails('mailto:founder@sarahics.in', vapidKeys.publicKey, vapidKeys.privateKey);

// 100% UNIVERSAL HUMANITY & PEACE REPOSITORY (NO RELIGIOUS BIAS, ZERO OFFENSE)
const universalThoughts = [
    "Insaaniyat se bada koi dharam nahi, aur sachhai se badi koi taqat nahi. Aaj kisi ke chehre par muskaan laayein.",
    "Apne maa-baap ka samman aur apne baccho se sachha pyaar—yeh wo daulat hai jo hamesha zinda rehti hai.",
    "Nafrat ko sirf mohabbat se jeeta ja sakta hai. Apne dil ko saaf rakhein aur sabke liye shanti ki dua karein.",
    "Jo shakhs doosron ke raste se kaante hatata hai, uske apne raste hamesha aasan ho jaate hain. Neki karte raho.",
    "Aaj ka suraj aapke liye ek nayi umeed laya hai. Mehnat me koi kami mat chhodna, fal zaroor milega.",
    "Kamyabi aukaat se nahi, insaan ki neeyat aur lagan se milti hai. Khud par vishwas rakho aur aage badho.",
    "Ek dusre ki madad karna hi insaan hone ka sabse bada saboot hai. Aaj ka din shubh aur pur-sukoon ho!"
];

function getUniversalMessage() {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const thought = universalThoughts[dayOfYear % universalThoughts.length];
    return {
        title: "VIXAI · Subah Ki Neki & Umeed ☀️",
        body: thought
    };
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

// PUSH ENDPOINTS
app.get('/api/push/public-key', (req, res) => res.json({ publicKey: vapidKeys.publicKey }));

app.post('/api/push/subscribe', (req, res) => {
    const sub = req.body;
    if (!sub || !sub.endpoint) return res.status(400).json({ error: 'Invalid token' });

    const exists = db.subscribers.some(s => s.endpoint === sub.endpoint);
    if (!exists) {
        db.subscribers.push(sub);
        saveStore();
        const welcome = {
            title: "VIXAI Insaniyat Parivaar Me Swagat Hai ❤️",
            body: "Aapko har subah ek pavitra aur nek vichar milega. Shanti aur Khushhali aapke sath rahe!"
        };
        webpush.sendNotification(sub, JSON.stringify(welcome)).catch(() => {});
    }
    res.json({ success: true, count: db.subscribers.length });
});

// DAILY MORNING 8:00 AM PUSH CRON
cron.schedule('0 8 * * *', () => {
    console.log('[CRON] Dispatching Universal Morning Peace & Kindness thoughts...');
    const message = getUniversalMessage();
    const payload = JSON.stringify(message);

    db.subscribers.forEach((sub, idx) => {
        webpush.sendNotification(sub, payload).catch(err => {
            if (err.statusCode === 410 || err.statusCode === 404) {
                db.subscribers.splice(idx, 1);
                saveStore();
            }
        });
    });
});

// VISITOR TRACKING
app.post('/api/track-visit', (req, res) => {
    checkDateRoll();
    db.visitors.today += 1;
    db.visitors.total += 1;
    saveStore();
    res.json({ success: true, visitors: db.visitors });
});

// PUBLIC METRICS
app.get('/api/public-metrics', (req, res) => {
    checkDateRoll();
    res.json({ visitors: db.visitors, sales: db.sales });
});

// FOUNDER AUTH (PASSCODE: P0802)
app.post('/api/founder/login', (req, res) => {
    checkDateRoll();
    const { passcode } = req.body;
    if (passcode !== 'P0802') return res.status(401).json({ success: false, error: 'Unauthorized Access' });

    const growth = db.revenue.yesterday > 0 
        ? Math.round(((db.revenue.today - db.revenue.yesterday) / db.revenue.yesterday) * 100) 
        : 100;

    res.json({
        success: true,
        founder: 'Rayan Rajesh Parikh',
        metrics: {
            totalRevenue: db.revenue.total,
            todayRevenue: db.revenue.today,
            yesterdayRevenue: db.revenue.yesterday,
            childWalletINR: db.childWalletINR,
            growthPercent: growth,
            visitors: db.visitors,
            sales: db.sales,
            subscribersCount: db.subscribers.length
        },
        orders: db.orders,
        leads: db.leads
    });
});

// RAZORPAY CONFIG
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_U3n15CrCq4no03',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'c6azXKP4rTGZyGO64KgsIrHN'
});

const catalog = {
    'prod-01': { title: 'Creator Viral Matrix', price: 499 },
    'prod-02': { title: 'SME WhatsApp & Invoicing Bot', price: 1499 },
    'prod-03': { title: 'Portfolio Auto-Deployer', price: 2499 }
};

app.post('/api/audit', (req, res) => {
    checkDateRoll();
    const { name, contact } = req.body;
    if (!name || !contact) return res.status(400).json({ error: 'Details missing' });
    const audit = { id: `AUDIT-${Date.now().toString().slice(-6)}`, name, contact, time: new Date().toLocaleString() };
    db.leads.unshift(audit);
    saveStore();
    res.json({ success: true, audit });
});

app.post('/api/create-order', async (req, res) => {
    try {
        const { productId, clientEmail, clientName } = req.body;
        const item = catalog[productId] || catalog['prod-01'];
        const order = await razorpay.orders.create({
            amount: Math.round(item.price * 100),
            currency: 'INR',
            receipt: `rcpt_${Date.now().toString().slice(-8)}`,
            notes: { productId, clientEmail: clientEmail || '', clientName: clientName || '' }
        });
        res.json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_U3n15CrCq4no03', item_title: item.title });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Order creation failed' });
    }
});

app.post('/api/verify-payment', (req, res) => {
    checkDateRoll();
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId, clientEmail } = req.body;
        const secret = process.env.RAZORPAY_KEY_SECRET || 'c6azXKP4rTGZyGO64KgsIrHN';
        const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generatedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

        if (generatedSignature !== razorpay_signature) return res.status(400).json({ success: false, error: 'Signature mismatch' });

        const item = catalog[productId] || catalog['prod-01'];
        const licenseKey = `VIXAI-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const sonRoyalty = Math.round(item.price * 0.20);

        const paidOrder = { orderId: razorpay_order_id, paymentId: razorpay_payment_id, item: item.title, amount: item.price, email: clientEmail, licenseKey, sonRoyalty, time: new Date().toLocaleString() };
        db.orders.unshift(paidOrder);
        db.sales.today += 1;
        db.sales.total += 1;
        db.revenue.today += item.price;
        db.revenue.total += item.price;
        db.childWalletINR += sonRoyalty;
        saveStore();
        res.json({ success: true, order: paidOrder });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 VIXAI UNIVERSAL HUMANITY ENGINE ONLINE ON PORT ${PORT}`);
});
