import { fetchWithRetry } from "./client";
import { SubscriptionDetails } from "./types";

export const subscriptionService = {
  async getSubscriptionDetails(): Promise<SubscriptionDetails> {
    const res = await fetchWithRetry("/billing/subscriptions/my");
    const data = await res.json();
    return {
      id: data.id,
      planName: data.planName,
      status: data.status,
      price: data.price,
      period: data.period,
      nextBillingDate: data.nextBillingDate,
      features: data.features
    };
  },

  async updateSubscriptionPlan(planName: string): Promise<SubscriptionDetails> {
    // 1. Fetch current subscription to retrieve ID
    const subRes = await fetchWithRetry("/billing/subscriptions/my");
    const subData = await subRes.json();
    const subscriptionId = subData.id;

    // 2. Fetch active plans to match IDs
    const plansRes = await fetchWithRetry("/billing/plans");
    const plans = await plansRes.json();
    const matchedPlan = plans.find((p: any) => p.name === planName);
    if (!matchedPlan) {
      throw new Error(`Plan ${planName} not found on backend.`);
    }

    if (subscriptionId && subscriptionId !== "None") {
      await fetchWithRetry(`/billing/subscriptions/${subscriptionId}/upgrade`, {
        method: "POST",
        body: JSON.stringify({ new_plan_id: matchedPlan.id })
      });
    } else {
      await fetchWithRetry("/billing/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan_id: matchedPlan.id })
      });
    }

    return this.getSubscriptionDetails();
  }
};
