import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

type StripeInstance = ReturnType<typeof Stripe>;

@Injectable()
export class StripeService {
  private readonly stripe: StripeInstance;
  private readonly logger = new Logger(StripeService.name);

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

  /** Map a Stripe price ID to our plan key. Falls back to metadata, then FREE. */
  private resolvePlanFromPriceId(priceId: string | undefined, metadataPlanKey?: string): string {
    const growthPrice = this.config.get<string>('STRIPE_GROWTH_PRICE_ID');
    const proPrice    = this.config.get<string>('STRIPE_PRO_PRICE_ID');
    if (priceId && priceId === growthPrice) return 'GROWTH';
    if (priceId && priceId === proPrice)    return 'PRO';
    if (metadataPlanKey === 'GROWTH' || metadataPlanKey === 'PRO') return metadataPlanKey;
    return 'FREE';
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

  /**
   * Sync subscription state from Stripe directly into the DB.
   * Called by the frontend immediately after returning from Stripe checkout
   * to resolve the race between the redirect and the webhook.
   */
  async syncSubscription(agencyId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { stripeCustomerId: true, stripeSubscriptionId: true, plan: true },
    });
    if (!agency) throw new NotFoundException('Agency not found');

    if (!agency.stripeCustomerId) {
      this.logger.log(`[sync] Agency ${agencyId} has no stripeCustomerId — nothing to sync`);
      return { synced: false, plan: agency.plan };
    }

    // Try existing subscription ID first, then fall back to listing by customer
    let sub: any = null;

    if (agency.stripeSubscriptionId) {
      try {
        sub = await this.stripe.subscriptions.retrieve(agency.stripeSubscriptionId);
      } catch {
        this.logger.warn(`[sync] Subscription ${agency.stripeSubscriptionId} not found in Stripe, searching by customer`);
      }
    }

    if (!sub || !['active', 'trialing'].includes(sub.status as string)) {
      // Search for any active/trialing subscription for this customer
      const list = await this.stripe.subscriptions.list({
        customer: agency.stripeCustomerId,
        status: 'active',
        limit: 1,
      });
      if (list.data.length === 0) {
        const trialList = await this.stripe.subscriptions.list({
          customer: agency.stripeCustomerId,
          status: 'trialing',
          limit: 1,
        });
        sub = trialList.data[0] ?? null;
      } else {
        sub = list.data[0];
      }
    }

    if (!sub) {
      this.logger.log(`[sync] No active subscription found for agency ${agencyId}`);
      return { synced: false, plan: agency.plan };
    }

    const priceId  = sub.items?.data?.[0]?.price?.id as string | undefined;
    const planKey  = this.resolvePlanFromPriceId(priceId, sub.metadata?.planKey);
    const isActive = ['active', 'trialing'].includes(sub.status as string);
    const plan     = isActive ? planKey : 'FREE';

    this.logger.log(`[sync] Agency ${agencyId}: plan=${plan}, sub=${sub.id}, status=${sub.status}, priceId=${priceId}`);

    await this.prisma.agency.update({
      where: { id: agencyId },
      data: { plan, stripeSubscriptionId: sub.id },
    });

    return { synced: true, plan };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');

    let event: ReturnType<StripeInstance['webhooks']['constructEvent']>;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error(`[webhook] Signature verification failed: ${err?.message}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    this.logger.log(`[webhook] Received event: ${event.type} (id=${event.id})`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const agencyId: string | undefined = session.metadata?.agencyId;
        const planKey: string | undefined  = session.metadata?.planKey;

        this.logger.log(`[webhook] checkout.session.completed — agencyId=${agencyId} planKey=${planKey} subscriptionId=${session.subscription}`);

        if (agencyId && planKey && session.subscription) {
          await this.prisma.agency.update({
            where: { id: agencyId },
            data: {
              plan: planKey,
              stripeSubscriptionId: session.subscription as string,
            },
          });
          this.logger.log(`[webhook] DB updated: agency=${agencyId} plan=${planKey}`);
        } else {
          this.logger.warn(`[webhook] checkout.session.completed missing fields — agencyId=${agencyId} planKey=${planKey} subscription=${session.subscription}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        const agencyId: string | undefined = sub.metadata?.agencyId;
        const priceId  = sub.items?.data?.[0]?.price?.id as string | undefined;
        const planKey  = this.resolvePlanFromPriceId(priceId, sub.metadata?.planKey);
        const plan     = sub.status === 'active' ? planKey : 'FREE';

        this.logger.log(`[webhook] customer.subscription.updated — agencyId=${agencyId} plan=${plan} status=${sub.status} priceId=${priceId}`);

        if (agencyId) {
          await this.prisma.agency.update({
            where: { id: agencyId },
            data: { plan, stripeSubscriptionId: sub.id },
          });
          this.logger.log(`[webhook] DB updated: agency=${agencyId} plan=${plan}`);
        } else {
          // Fall back to customer → agency lookup if metadata missing
          const agency = await this.prisma.agency.findFirst({
            where: { stripeCustomerId: sub.customer as string },
            select: { id: true },
          });
          if (agency) {
            await this.prisma.agency.update({
              where: { id: agency.id },
              data: { plan, stripeSubscriptionId: sub.id },
            });
            this.logger.log(`[webhook] DB updated via customer lookup: agency=${agency.id} plan=${plan}`);
          } else {
            this.logger.warn(`[webhook] customer.subscription.updated — no agency found for customer=${sub.customer}`);
          }
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string | undefined;

        this.logger.log(`[webhook] invoice.paid — customer=${customerId} subscription=${subscriptionId}`);

        if (!subscriptionId) break;

        const agency = await this.prisma.agency.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true, plan: true, stripeSubscriptionId: true },
        });

        if (!agency) {
          this.logger.warn(`[webhook] invoice.paid — no agency found for customer=${customerId}`);
          break;
        }

        // Only update if subscription ID changed or plan is still FREE (handles race condition)
        if (agency.plan === 'FREE' || agency.stripeSubscriptionId !== subscriptionId) {
          try {
            const sub = await this.stripe.subscriptions.retrieve(subscriptionId) as any;
            const priceId = sub.items?.data?.[0]?.price?.id as string | undefined;
            const planKey = this.resolvePlanFromPriceId(priceId, sub.metadata?.planKey);

            if (planKey !== 'FREE') {
              await this.prisma.agency.update({
                where: { id: agency.id },
                data: { plan: planKey, stripeSubscriptionId: subscriptionId },
              });
              this.logger.log(`[webhook] invoice.paid DB updated: agency=${agency.id} plan=${planKey}`);
            }
          } catch (err: any) {
            this.logger.error(`[webhook] invoice.paid — failed to retrieve subscription ${subscriptionId}: ${err?.message}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        const agencyId: string | undefined = sub.metadata?.agencyId;

        this.logger.log(`[webhook] customer.subscription.deleted — agencyId=${agencyId} customer=${sub.customer}`);

        if (agencyId) {
          await this.prisma.agency.update({
            where: { id: agencyId },
            data: { plan: 'FREE', stripeSubscriptionId: null },
          });
        } else {
          const agency = await this.prisma.agency.findFirst({
            where: { stripeCustomerId: sub.customer as string },
            select: { id: true },
          });
          if (agency) {
            await this.prisma.agency.update({
              where: { id: agency.id },
              data: { plan: 'FREE', stripeSubscriptionId: null },
            });
          }
        }
        break;
      }

      default:
        this.logger.log(`[webhook] Unhandled event type: ${event.type}`);
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
