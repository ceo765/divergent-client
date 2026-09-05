import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";

import { CircleCheck, Crown, Swords, Zap } from "@/components/native/icons";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";
import type { PaymentMethodType } from "@/types";

const FONT = "Montserrat";

const BENEFITS = [
  { icon: Swords, text: "Участие во всех челленджах без призового фонда" },
  { icon: Zap, text: "Групповые чаты, чек-ины, прогресс и XP в челленджах" },
  { icon: CircleCheck, text: "Отмена в любой момент - доступ до конца оплаченного периода" },
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

export function SubscriptionScreen({
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
  const [busy, setBusy] = useState<PaymentMethodType | "cancel" | "resume" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void loadSubscriptionPlans();
    void refreshSubscription();
  }, [loadSubscriptionPlans, refreshSubscription]);

  // Возврат из оплаты: несколько раз опрашиваем статус платежа, затем обновляем юзера.
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
    <ScrollView
      style={{ flex: 1, backgroundColor: appPalette.surface.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: appPalette.semantic.textStrong, fontFamily: FONT }}>
          Divergent Premium
        </Text>
        <Text style={{ fontSize: 13, color: appPalette.semantic.textMuted, fontFamily: FONT }}>
          {intent === "paywall"
            ? "Челленджи доступны по подписке"
            : "Управление подпиской"}
        </Text>
      </View>

      {checking && (
        <SurfaceCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <ActivityIndicator color={appPalette.brand.primary} />
            <Text style={{ fontSize: 13, color: appPalette.semantic.text, fontFamily: FONT }}>
              Проверяем оплату…
            </Text>
          </View>
        </SurfaceCard>
      )}

      {/* Статус активной подписки */}
      {sub && sub.status !== "EXPIRED" && (
        <SurfaceCard>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: FONT }}>
              {sub.status === "PAST_DUE"
                ? "Оплата не прошла"
                : sub.cancelAtPeriodEnd
                  ? "Отменена"
                  : "Активна"}
            </Text>
            <Text style={{ fontSize: 13, color: appPalette.semantic.textMuted, fontFamily: FONT }}>
              {price} ₽/мес
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: appPalette.semantic.text, fontFamily: FONT }}>
            {sub.cancelAtPeriodEnd
              ? `Доступ до ${formatDate(sub.currentPeriodEnd)}`
              : sub.status === "PAST_DUE"
                ? "Повторим списание в ближайшие дни. Проверьте баланс карты."
                : `Следующее списание ${formatDate(sub.currentPeriodEnd)}`}
          </Text>
          {sub.paymentMethodTitle && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Crown size={16} color={appPalette.semantic.textMuted} />
              <Text style={{ fontSize: 12, color: appPalette.semantic.textMuted, fontFamily: FONT }}>
                {sub.paymentMethodTitle}
              </Text>
            </View>
          )}
          {sub.cancelAtPeriodEnd ? (
            <Pressable
              onPress={async () => {
                setBusy("resume");
                try {
                  await resumeSubscription();
                } finally {
                  setBusy(null);
                }
              }}
              disabled={busy === "resume" || loading}
              style={{
                backgroundColor: appPalette.brand.primary,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: appPalette.brand.primaryForeground, fontSize: 14, fontWeight: "700", fontFamily: FONT }}>
                {busy === "resume" ? "…" : "Возобновить подписку"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={async () => {
                setBusy("cancel");
                try {
                  await cancelSubscription();
                } finally {
                  setBusy(null);
                }
              }}
              disabled={busy === "cancel" || loading}
              style={{
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: appPalette.semantic.borderSubtle,
              }}
            >
              <Text style={{ color: appPalette.semantic.textMuted, fontSize: 14, fontWeight: "600", fontFamily: FONT }}>
                {busy === "cancel" ? "…" : "Отменить автопродление"}
              </Text>
            </Pressable>
          )}
        </SurfaceCard>
      )}

      {/* Пейволл / оформление */}
      {!hasAccess && (
        <SurfaceCard gap={16}>
          <View style={{ gap: 12 }}>
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                  <Icon size={18} color={appPalette.brand.primary} />
                  <Text style={{ flex: 1, fontSize: 13, color: appPalette.semantic.text, fontFamily: FONT, lineHeight: 19 }}>
                    {b.text}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={{ alignItems: "center", gap: 2 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: appPalette.semantic.textStrong, fontFamily: FONT }}>
              {price} ₽
            </Text>
            <Text style={{ fontSize: 12, color: appPalette.semantic.textMuted, fontFamily: FONT }}>в месяц</Text>
          </View>

          {error && (
            <Text style={{ fontSize: 12, color: appPalette.semantic.dangerText, fontFamily: FONT, textAlign: "center" }}>
              {error}
            </Text>
          )}

          <View style={{ gap: 10 }}>
            {methods.map((m) => (
              <Pressable
                key={m}
                onPress={() => pay(m)}
                disabled={busy !== null || loading}
                style={{
                  backgroundColor: m === "sberbank" ? "#21a038" : appPalette.brand.primary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  opacity: busy !== null && busy !== m ? 0.5 : 1,
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "700", fontFamily: FONT }}>
                  {busy === m ? "…" : `Оплатить через ${methodLabel(m)}`}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ fontSize: 11, color: appPalette.semantic.textSubtle, fontFamily: FONT, textAlign: "center", lineHeight: 16 }}>
            Автопродление раз в месяц, {price} ₽. Отменить можно в любой момент.
          </Text>
        </SurfaceCard>
      )}
    </ScrollView>
  );
}
