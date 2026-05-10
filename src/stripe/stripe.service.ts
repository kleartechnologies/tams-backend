import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

type StripeInstance = ReturnType<typeof Stripe>;

@Injectable()
export class StripeService {
  private readonly stripe: StripeInstance;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.getOrThrow<string>('STRIPE_SECRET_KEY'));
  }

  private getPriceId(planKey: 'GROWTH' | 'PRO'): string {
    const key =
      planKey === 'GROWTH' ? 'STRIPE_GROWTH_PRICE_ID' : 'STRIPE_PRO_PRICE_ID';
    return this.config.getOrThrow<string>(key);
  }

  private async getOrCreateCustomer(agencyId: string): Promise<string> {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      include: { settings: true },
    });
    if (!agency) throw new NotFoundException('Agency not found');

    if (agency.stripeCustomerId) return agency.stripeCustomerId;

    const customer = await this.stripe.customers.create({
      name: agency.settings?.agencyName ?? agency.name,
      metadata: { agencyId },
    });

    await this.prisma.agency.update({
      where: { id: agencyId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  async createCheckoutSession(agencyId: string, planKey: 'GROWTH' | 'PRO') {
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const customerId = await this.getOrCreateCustomer(agencyId);

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: this.getPriceId(planKey), quantity: 1 }],
      success_url: `${frontendUrl}/billing?success=true&plan=${planKey}`,
      cancel_url: `${frontendUrl}/billing`,
      metadata: { agencyId, planKey },
      subscription_data: { metadata: { agencyId, planKey } },
    });

    return { url: session.url };
  }

  async createPortalSession(agencyId: string) {
    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { stripeCustomerId: true },
    });

    if (!agency?.stripeCustomerId) {
      throw new BadRequestException('No billing account found. Start a subscription first.');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: agency.stripeCustomerId,
      return_url: `${frontendUrl}/billing`,
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');

    let event: ReturnType<StripeInstance['webhooks']['constructEvent']>;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Webhook signature verification failed');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const agencyId: string | undefined = session.metadata?.agencyId;
        const planKey: string | undefined = session.metadata?.planKey;
        if (agencyId && planKey && session.subscription) {
          await this.prisma.agency.update({
            where: { id: agencyId },
            data: {
              plan: planKey,
              stripeSubscriptionId: session.subscription as string,
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        const agencyId: string | undefined = sub.metadata?.agencyId;
        const planKey: string | undefined = sub.metadata?.planKey;
        if (agencyId && planKey) {
          const plan = sub.status === 'active' ? planKey : 'FREE';
          await this.prisma.agency.update({
            where: { id: agencyId },
            data: { plan, stripeSubscriptionId: sub.id },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        const agencyId: string | undefined = sub.metadata?.agencyId;
        if (agencyId) {
          await this.prisma.agency.update({
            where: { id: agencyId },
            data: { plan: 'FREE', stripeSubscriptionId: null },
          });
        }
        break;
      }
    }

    return { received: true };
  }

  async getSubscription(agencyId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { plan: true, stripeCustomerId: true, stripeSubscriptionId: true },
    });
    if (!agency) throw new NotFoundException('Agency not found');

    let subscription: {
      status: string;
      currentPeriodEnd: Date;
      cancelAtPeriodEnd: boolean;
    } | null = null;

    if (agency.stripeSubscriptionId) {
      try {
        const sub = await this.stripe.subscriptions.retrieve(
          agency.stripeSubscriptionId,
        ) as any;
        subscription = {
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        };
      } catch {
        // Subscription no longer exists in Stripe
      }
    }

    return {
      plan: agency.plan,
      stripeCustomerId: agency.stripeCustomerId,
      stripeSubscriptionId: agency.stripeSubscriptionId,
      subscription,
    };
  }
}
