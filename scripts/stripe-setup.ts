/**
 * One-time script: creates TAMS products and monthly prices in Stripe.
 * Run once per environment (test + prod separately):
 *
 *   STRIPE_SECRET_KEY=sk_test_xxx npx ts-node -e "require('./scripts/stripe-setup.ts')"
 *
 * Copy the printed price IDs into your .env as:
 *   STRIPE_GROWTH_PRICE_ID=price_xxx
 *   STRIPE_PRO_PRICE_ID=price_xxx
 */

import 'dotenv/config';
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('STRIPE_SECRET_KEY is not set');
  process.exit(1);
}

const stripe = new Stripe(key);

async function setup() {
  console.log('Creating TAMS Stripe products and prices...\n');

  // ── Growth plan ──────────────────────────────────────────────────────────
  const growth = await stripe.products.create({
    name: 'TAMS Growth',
    description: '300 bookings/month, 5 team members, payment tracking & SST, reports',
    metadata: { planKey: 'GROWTH' },
  });

  const growthPrice = await stripe.prices.create({
    product: growth.id,
    currency: 'myr',
    unit_amount: 9900, // RM 99.00 in sen
    recurring: { interval: 'month' },
    nickname: 'Growth Monthly',
    metadata: { planKey: 'GROWTH' },
  });

  // ── Pro plan ─────────────────────────────────────────────────────────────
  const pro = await stripe.products.create({
    name: 'TAMS Pro',
    description: 'Unlimited bookings, 10 team members, advanced reports, dedicated onboarding',
    metadata: { planKey: 'PRO' },
  });

  const proPrice = await stripe.prices.create({
    product: pro.id,
    currency: 'myr',
    unit_amount: 19900, // RM 199.00 in sen
    recurring: { interval: 'month' },
    nickname: 'Pro Monthly',
    metadata: { planKey: 'PRO' },
  });

  console.log('Done! Add these to your .env:\n');
  console.log(`STRIPE_GROWTH_PRICE_ID=${growthPrice.id}`);
  console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`);
  console.log('\nProduct IDs (for reference):');
  console.log(`  Growth: ${growth.id}`);
  console.log(`  Pro:    ${pro.id}`);
}

setup().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
