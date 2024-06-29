// stripeMiddleware.js
import Stripe from 'stripe';
import express from 'express';

const stripe = new Stripe(process.env.SECRET_STRIPE_KEY);

const stripeMiddleware = (req, res, next) => {
  const sigHeader = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sigHeader, endpointSecret);
  } catch (err) {
    console.error("Error al verificar la firma de la solicitud del webhook:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Asignar el evento de Stripe a la solicitud para que esté disponible en las rutas
  req.stripeEvent = event;

  next();
};

export default stripeMiddleware;
