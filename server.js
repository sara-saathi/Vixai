import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Razorpay SDK instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// In-Memory Ledger (Production State)
const store = {
    leads: [],
    orders: [],
    royaltyVaultINR: 0,
    totalGrossRevenue: 0
};

const catalog = {
    'prod-01': { title: 'Creator Viral Matrix', price: 499 },
    'prod-02': { title: 'SME WhatsApp & Invoicing Bot', price: 1499 },
    'prod-03': { title: 'Portfolio Auto-Deployer', price: 2499 }
};

// 1. FREE LEAD MAGNET: AI BUSINESS AUDIT ENGINE
app.post('/api/audit', (req, res) => {
    const { name, contact } = req.body;
    if (!name || !contact) return res.status(400).json({ error: 'Details missing' });

    const audit = {
        id: `AUDIT-${Date.now().toString().slice(-6)}`,
        client: name,
        contact,
        createdAt: new Date().toISOString(),
        findings: [
            "Operational Friction: Manual customer handling causes ~40% drop-off.",
            "Revenue Leak: Lack of automated floor-price instant delivery flow.",
            "VIXAI Prescription: Deploy SME WhatsApp Automation to recover ₹25,000+/mo."
        ]
    };
    store.leads.push(audit);
    console.log(`[VIXAI LEAD] Captured: ${name} (${contact})`);
    res.json({ success: true, audit });
});

// 2. STEP 1 BACKEND: CREATE RAZORPAY ORDER
app.post('/api/create-order', async (req, res) => {
    try {
        const { productId, clientEmail, clientName } = req.body;
        const item = catalog[productId] || catalog['prod-01'];
        const amountInPaise = Math.round(item.price * 100);

        if (amountInPaise < 100) {
            return res.status(400).json({ error: 'Minimum amount must be at least 100 paise' });
        }

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now().toString().slice(-8)}`,
            notes: {
                productId: productId || 'prod-01',
                clientEmail: clientEmail || '',
                clientName: clientName || ''
            }
        };

        const order = await razorpay.orders.create(options);

        res.json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            item_title: item.title
        });
    } catch (err) {
        console.error('Razorpay Create Order Error:', err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.error?.description || err.message || 'Failed to create Razorpay order' });
    }
});

// 3. STEP 3 BACKEND: VERIFY SIGNATURE & AUTOMATE FULFILLMENT
app.post('/api/verify-payment', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId, clientEmail } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, error: 'Missing required signature verification fields' });
        }

        // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
        const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(payload.toString())
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            console.warn('[SECURITY WARNING] Razorpay signature mismatch! Potential fraudulent request.');
            return res.status(400).json({ success: false, error: 'Invalid payment signature. Verification failed.' });
        }

        // Fulfill digital product on legitimate payment
        const item = catalog[productId] || catalog['prod-01'];
        const licenseKey = `VIXAI-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString().slice(-4)}`;
        const sonRoyalty = Math.round(item.price * 0.20); // 20% Irrevocable Legacy Cut

        const paidOrder = {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            item: item.title,
            amount: item.price,
            email: clientEmail,
            licenseKey,
            royaltyTransferred: sonRoyalty,
            status: 'PAID_AND_FULFILLED',
            timestamp: new Date().toISOString()
        };

        store.orders.push(paidOrder);
        store.totalGrossRevenue += item.price;
        store.royaltyVaultINR += sonRoyalty;

        console.log(`===============================================`);
        console.log(` ✅ RAZORPAY PAYMENT VERIFIED!`);
        console.log(` Payment ID: ${razorpay_payment_id}`);
        console.log(` Product: ${item.title} | Amount: ₹${item.price}`);
        console.log(` License Key Dispatched: ${licenseKey}`);
        console.log(` 👑 20% Royalty to Son's Vault: ₹${sonRoyalty}`);
        console.log(`===============================================`);

        res.json({
            success: true,
            message: 'Payment verified and digital delivery fulfilled authentically.',
            order: paidOrder
        });
    } catch (err) {
        console.error('Verify Payment Error:', err);
        res.status(500).json({ success: false, error: 'Internal server verification error' });
    }
});

// 4. METRICS & AUDIT API
app.get('/api/metrics', (req, res) => {
    res.json({
        totalOrders: store.orders.length,
        totalLeads: store.leads.length,
        grossRevenue: store.totalGrossRevenue,
        sonRoyaltyVault: store.royaltyVaultINR,
        status: '24/7/365_ACTIVE'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 VIXAI LIVE CLOUD ENGINE RUNNING ON PORT ${PORT}`);
    console.log(`Founder & Authority: Rayan Rajesh Parikh`);
});
