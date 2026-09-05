import * as api from "@/shared/api/client";
import { buildChallengesPath } from "@/app/routes";
import { buildPaymentReturnUrl } from "@/platform/appUrl";
import { redirectToUrl } from "@/platform/browser";
import type { AppStoreActions, StoreSlice } from "@/stores/types";
import type { PaymentMethodType, SubscriptionPlan } from "@/types";

type SubscriptionSlice = Pick<
  AppStoreActions,
  | "loadSubscriptionPlans"
  | "startSubscriptionCheckout"
  | "refreshSubscription"
  | "cancelSubscription"
  | "resumeSubscription"
>;

export const createSubscriptionSlice: StoreSlice<SubscriptionSlice> = (set, get) => ({
  loadSubscriptionPlans: async () => {
    try {
      set({ subscriptionPlans: await api.fetchSubscriptionPlans() });
    } catch (err) {
      console.error(err);
    }
  },

  // Возвращает confirmationUrl первого платежа (экран сам открывает редирект),
  // либо null. Активацию подписки проставит вебхук / poll при возврате.
  startSubscriptionCheckout: async (plan: SubscriptionPlan, methodType: PaymentMethodType) => {
    set({ loading: true });
    try {
      const res = await api.createSubscription({
        plan,
        methodType,
        returnUrl: buildPaymentReturnUrl(buildChallengesPath()),
      });
      if (res.confirmationUrl) {
        redirectToUrl(res.confirmationUrl);
      }
      return res.confirmationUrl ?? null;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  refreshSubscription: async () => {
    try {
      const { subscription } = await api.fetchSubscription();
      const user = get().user;
      if (user) set({ user: { ...user, subscription } });
    } catch (err) {
      console.error(err);
    }
  },

  cancelSubscription: async () => {
    set({ loading: true });
    try {
      const { subscription } = await api.cancelSubscription();
      const user = get().user;
      if (user) set({ user: { ...user, subscription } });
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  resumeSubscription: async () => {
    set({ loading: true });
    try {
      const { subscription } = await api.resumeSubscription();
      const user = get().user;
      if (user) set({ user: { ...user, subscription } });
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      set({ loading: false });
    }
  },
});
