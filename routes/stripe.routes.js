import { Router } from 'express';
import stripeWebhook from '../controllers/stripe.controller.js';
import express from 'express';

const router = Router();

// Configura tu ruta de webhook para Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;
