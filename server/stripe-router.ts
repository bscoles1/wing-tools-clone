import { router, protectedProcedure } from "./_core/trpc";
import { upsertSubscription, getUserSubscription } from "./snapshots";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const stripeRouter = router({
  createCheckoutSession: protectedProcedure
    .input(z.object({ tier: z.enum(["Basic", "Premium"]) }))
    .mutation(async ({ ctx, input }) => {
      // In a production environment with Stripe credentials, this would create a Stripe Checkout Session.
      // Since Stripe test/live keys are provisioned on demand, we simulate a successful Stripe upgrade
      // or integrate when stripe credentials are provided.
      const tier = input.tier;
      const userId = ctx.user.id;

      const subscription = await getUserSubscription(userId);
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await upsertSubscription({
        userId,
        tier,
        status: "active",
        stripeCustomerId: subscription?.stripeCustomerId || `cus_simulated_${userId}`,
        stripeSubscriptionId: `sub_simulated_${Date.now()}`,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });

      return {
        success: true,
        url: `/pricing?success=true&tier=${tier}`,
      };
    }),
});
