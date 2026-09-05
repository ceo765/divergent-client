import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchPaymentMethods } from "@/shared/api/client";
import { useAppStore } from "@/stores/useAppStore";
import type { SavedPaymentMethodView } from "@/types";

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
  const detachPaymentMethod = useAppStore((s) => s.detachPaymentMethod);
  const syncPaymentStatus = useAppStore((s) => s.syncPaymentStatus);

  const sub = user?.subscription ?? null;
  const autoRenewSupported = plans?.autoRenew ?? false;

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [cards, setCards] = useState<SavedPaymentMethodView[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadCards = useCallback(async () => {
    try {
      const { methods } = await fetchPaymentMethods();
      setCards(methods);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadSubscriptionPlans();
    void refreshSubscription();
    void loadCards();
  }, [loadSubscriptionPlans, refreshSubscription, loadCards]);

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
        await loadCards();
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
  }, [paymentId, syncPaymentStatus, refreshUser, loadCards, onConsumePayment]);

  const pay = useCallback(async () => {
    setError(null);
    setBusy("pay");
    try {
      const url = await startSubscriptionCheckout("MONTHLY");
      if (!url) setError("Не удалось создать платёж. Попробуйте позже.");
    } catch {
      setError("Не удалось создать платёж. Попробуйте позже.");
    } finally {
      setBusy(null);
    }
  }, [startSubscriptionCheckout]);

  const detach = useCallback(
    async (id: string) => {
      setBusy(id);
      try {
        await detachPaymentMethod(id);
        await loadCards();
      } catch {
        setError("Не удалось отвязать карту.");
      } finally {
        setBusy(null);
      }
    },
    [detachPaymentMethod, loadCards],
  );

  const price = plans?.monthly ?? sub?.priceRub ?? 499;
  const hasAccess = sub?.hasChallengesAccess ?? false;
  const active = sub && sub.status !== "EXPIRED";
  const renewalNote = autoRenewSupported
    ? `Автопродление раз в месяц, ${price} ₽. Отменить можно в любой момент.`
    : "Оплата на 1 месяц. Автосписания нет - продлить нужно вручную в приложении.";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-6">
      <div>
        <h1 className="text-2xl font-extrabold">Divergent Premium</h1>
        <p className="text-sm text-muted-foreground">
          {intent === "paywall" ? "Челленджи доступны по подписке" : "Управление подпиской"}
        </p>
      </div>

      {checking && <Card className="p-4 text-sm text-muted-foreground">Проверяем оплату…</Card>}

      {active && (
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">
              {sub!.status === "PAST_DUE" ? "Оплата не прошла" : sub!.cancelAtPeriodEnd ? "Отменена" : "Активна"}
            </span>
            <span className="text-sm text-muted-foreground">{price} ₽/мес</span>
          </div>
          <p className="text-sm">
            {sub!.status === "PAST_DUE"
              ? "Повторим списание в ближайшие дни. Проверьте баланс карты."
              : sub!.autoRenew && !sub!.cancelAtPeriodEnd
                ? `Следующее списание ${formatDate(sub!.currentPeriodEnd)}`
                : `Доступ до ${formatDate(sub!.currentPeriodEnd)}${sub!.autoRenew ? "" : " · продление вручную"}`}
          </p>
          {sub!.paymentMethodTitle && <p className="text-xs text-muted-foreground">{sub!.paymentMethodTitle}</p>}

          {sub!.cancelAtPeriodEnd && sub!.hasChallengesAccess && sub!.autoRenew && (
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
          )}

          {sub!.autoRenew && !sub!.cancelAtPeriodEnd && (
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

          {!sub!.autoRenew && (
            <Button disabled={busy !== null || loading} onClick={pay}>
              {busy === "pay" ? "…" : `Продлить на месяц · ${price} ₽`}
            </Button>
          )}
        </Card>
      )}

      {cards.length > 0 && (
        <Card className="flex flex-col gap-2 p-4">
          <span className="font-semibold text-sm">Способы оплаты</span>
          {cards.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <span>{c.cardLast4 ? `Карта •• ${c.cardLast4}` : c.title}</span>
              <button
                className="text-destructive font-semibold disabled:opacity-50"
                disabled={busy !== null || loading}
                onClick={() => detach(c.id)}
              >
                {busy === c.id ? "…" : "Отвязать"}
              </button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Отвязка карты останавливает автопродление. Доступ сохраняется до конца оплаченного периода.
          </p>
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

          <Button disabled={busy !== null || loading} onClick={pay}>
            {busy === "pay" ? "…" : "Оплатить картой"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">{renewalNote}</p>
        </Card>
      )}
    </div>
  );
}
