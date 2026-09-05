import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/stores/useAppStore";
import type { PaymentMethodType } from "@/types";

const BENEFITS = [
  "Участие во всех челленджах без призового фонда",
  "Групповые чаты, чек-ины, прогресс и XP в челленджах",
  "Отмена в любой момент - доступ до конца оплаченного периода",
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

function methodLabel(m: PaymentMethodType): string {
  if (m === "sberbank") return "SberPay";
  if (m === "tinkoff_bank") return "T-Bank";
  if (m === "sbp") return "СБП";
  return "Картой";
}

export default function WebSubscriptionScreen({
  intent,
  paymentId,
  onConsumePayment,
}: {
  intent: "paywall" | "manage";
  paymentId?: string | null;
  onConsumePayment?: () => void;
}) {
  const user = useAppStore((s) => s.user);
  const plans = useAppStore((s) => s.subscriptionPlans);
  const loading = useAppStore((s) => s.loading);
  const loadSubscriptionPlans = useAppStore((s) => s.loadSubscriptionPlans);
  const refreshSubscription = useAppStore((s) => s.refreshSubscription);
  const refreshUser = useAppStore((s) => s.refreshUser);
  const startSubscriptionCheckout = useAppStore((s) => s.startSubscriptionCheckout);
  const cancelSubscription = useAppStore((s) => s.cancelSubscription);
  const resumeSubscription = useAppStore((s) => s.resumeSubscription);
  const syncPaymentStatus = useAppStore((s) => s.syncPaymentStatus);

  const sub = user?.subscription ?? null;
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void loadSubscriptionPlans();
    void refreshSubscription();
  }, [loadSubscriptionPlans, refreshSubscription]);

  useEffect(() => {
    if (!paymentId) return;
    let attempts = 0;
    setChecking(true);
    const tick = async () => {
      attempts += 1;
      const status = await syncPaymentStatus(paymentId);
      if (status === "SUCCESS" || status === "FAILED" || status === "CANCELLED" || attempts >= 10) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        await refreshUser();
        setChecking(false);
        if (status === "FAILED" || status === "CANCELLED") setError("Оплата не прошла. Попробуйте ещё раз.");
        onConsumePayment?.();
      }
    };
    void tick();
    pollRef.current = setInterval(() => void tick(), 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [paymentId, syncPaymentStatus, refreshUser, onConsumePayment]);

  const pay = useCallback(
    async (method: PaymentMethodType) => {
      setError(null);
      setBusy(method);
      try {
        const url = await startSubscriptionCheckout("MONTHLY", method);
        if (!url) setError("Не удалось создать платёж. Попробуйте позже.");
      } catch {
        setError("Не удалось создать платёж. Попробуйте позже.");
      } finally {
        setBusy(null);
      }
    },
    [startSubscriptionCheckout],
  );

  const price = plans?.monthly ?? sub?.priceRub ?? 499;
  const methods: PaymentMethodType[] = plans?.methods?.length
    ? plans.methods.filter((m) => m === "sberbank" || m === "tinkoff_bank")
    : ["sberbank", "tinkoff_bank"];
  const hasAccess = sub?.hasChallengesAccess ?? false;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-6">
      <div>
        <h1 className="text-2xl font-extrabold">Divergent Premium</h1>
        <p className="text-sm text-muted-foreground">
          {intent === "paywall" ? "Челленджи доступны по подписке" : "Управление подпиской"}
        </p>
      </div>

      {checking && (
        <Card className="p-4 text-sm text-muted-foreground">Проверяем оплату…</Card>
      )}

      {sub && sub.status !== "EXPIRED" && (
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              {sub.status === "PAST_DUE" ? "Оплата не прошла" : sub.cancelAtPeriodEnd ? "Отменена" : "Активна"}
            </span>
            <span className="text-sm text-muted-foreground">{price} ₽/мес</span>
          </div>
          <p className="text-sm">
            {sub.cancelAtPeriodEnd
              ? `Доступ до ${formatDate(sub.currentPeriodEnd)}`
              : sub.status === "PAST_DUE"
                ? "Повторим списание в ближайшие дни. Проверьте баланс карты."
                : `Следующее списание ${formatDate(sub.currentPeriodEnd)}`}
          </p>
          {sub.paymentMethodTitle && (
            <p className="text-xs text-muted-foreground">{sub.paymentMethodTitle}</p>
          )}
          {sub.cancelAtPeriodEnd ? (
            <Button
              disabled={busy === "resume" || loading}
              onClick={async () => {
                setBusy("resume");
                try {
                  await resumeSubscription();
                } finally {
                  setBusy(null);
                }
              }}
            >
              Возобновить подписку
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={busy === "cancel" || loading}
              onClick={async () => {
                setBusy("cancel");
                try {
                  await cancelSubscription();
                } finally {
                  setBusy(null);
                }
              }}
            >
              Отменить автопродление
            </Button>
          )}
        </Card>
      )}

      {!hasAccess && (
        <Card className="flex flex-col gap-4 p-4">
          <ul className="flex flex-col gap-2">
            {BENEFITS.map((b, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="text-center">
            <div className="text-3xl font-extrabold">{price} ₽</div>
            <div className="text-xs text-muted-foreground">в месяц</div>
          </div>

          {error && <p className="text-center text-xs text-destructive">{error}</p>}

          <div className="flex flex-col gap-2">
            {methods.map((m) => (
              <Button key={m} disabled={busy !== null || loading} onClick={() => pay(m)}>
                {busy === m ? "…" : `Оплатить через ${methodLabel(m)}`}
              </Button>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Автопродление раз в месяц, {price} ₽. Отменить можно в любой момент.
          </p>
        </Card>
      )}
    </div>
  );
}
