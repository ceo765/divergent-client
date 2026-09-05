import { useSearchParams } from "react-router-dom";

import WebSubscriptionScreen from "@/components/web/SubscriptionScreen";
import { useAppStore } from "@/stores/useAppStore";

export default function SubscriptionView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const hasAccess = useAppStore((s) => s.user?.subscription?.hasChallengesAccess ?? false);

  return (
    <div id="subscription-view" className="flex flex-1 flex-col overflow-y-auto px-2">
      <WebSubscriptionScreen
        intent={hasAccess ? "manage" : "paywall"}
        paymentId={paymentId}
        onConsumePayment={() => {
          const next = new URLSearchParams(searchParams);
          next.delete("paymentId");
          setSearchParams(next, { replace: true });
        }}
      />
    </div>
  );
}
