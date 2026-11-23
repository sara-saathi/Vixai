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

// PRODUCTION LIVE RAZORPAY INSTANCE
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_U3n15CrCq4no03',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'c6azXKP4rTGZyGO64KgsIrHN'
});

const store = { leads: [], orders: [], royaltyVaultINR: 0, totalGrossRevenue: 0 };
const catalog = {
    'prod-01': { title: 'Creator Viral Matrix', price: 499 },
    'prod-02': { title: 'SME WhatsApp & Invoicing Bot', price: 1499 },
    'prod-03': { title: 'Portfolio Auto-Deployer', price: 2499 }
};

app.post('/api/audit', (req, res) => {
    const { name, contact } = req.body;
    if (!name || !contact) return res.status(400).json({ error: 'Details missing' });
    const audit = {
        id: `AUDIT-${Date.now().toString().slice(-6)}`,
        client: name,
        findings: ["Manual customer delay: ~40% loss", "VIXAI Solution: Floor-Price WhatsApp Automation"]
    };
    store.leads.push(audit);
    res.json({ success: true, audit });
});

// CREATE LIVE ORDER
app.post('/api/create-order', async (req, res) => {
    try {
        const { productId, clientEmail, clientName } = req.body;
        const item = catalog[productId] || catalog['prod-01'];
        const amountInPaise = Math.round(item.price * 100);

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now().toString().slice(-8)}`,
            notes: { productId, clientEmail: clientEmail || '', clientName: clientName || '' }
        });

        res.json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_U3n15CrCq4no03',
            item_title: item.title
        });
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ error: err.message || 'Razorpay order creation failed' });
    }
});

// VERIFY LIVE PAYMENT & DISPATCH LICENSE
app.post('/api/verify-payment', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId, clientEmail } = req.body;
        const secret = process.env.RAZORPAY_KEY_SECRET || 'c6azXKP4rTGZyGO64KgsIrHN';

        const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generatedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, error: 'Signature mismatch' });
        }

        const item = catalog[productId] || catalog['prod-01'];
        const licenseKey = `VIXAI-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const sonRoyalty = Math.round(item.price * 0.20); // 20% Irrevocable Legacy Cut

        const paidOrder = {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            item: item.title,
            amount: item.price,
            email: clientEmail,
            licenseKey,
            royaltyTransferred: sonRoyalty,
            status: 'PAID_VERIFIED'
        };

        store.orders.push(paidOrder);
        store.totalGrossRevenue += item.price;
        store.royaltyVaultINR += sonRoyalty;

        res.json({ success: true, order: paidOrder });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 VIXAI LIVE CLOUD PRODUCTION ENGINE ONLINE ON PORT ${PORT}`);
});
