import { Modal, Text, View } from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ActionChip } from "@/components/native/ActionChip";
import { Sparkles, Trophy } from "@/components/native/icons";
import { getMissionDefinition } from "@/shared/missions/catalog";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";

export function MissionRewardModal() {
  const { t } = useTranslation();
  const missionState = useAppStore((state) => state.missionState);
  const claimMissionReward = useAppStore((state) => state.claimMissionReward);
  const [claiming, setClaiming] = useState(false);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const pending = missionState?.missions.find((mission) => mission.key === missionState.pendingRewardKey);
  const definition = pending ? getMissionDefinition(pending.key) : null;

  if (!pending || !definition) return null;

  return <Modal visible={dismissedKey !== pending.key} transparent animationType="fade" onRequestClose={() => setDismissedKey(pending.key)}>
    <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: appPalette.surface.overlay }}>
      <View style={{ alignItems: "center", gap: 14, padding: 24, borderRadius: 20, backgroundColor: appPalette.surface.card }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", backgroundColor: appPalette.semantic.warningSurface }}><Trophy size={42} color={appPalette.semantic.warningText} /><Sparkles size={22} color={appPalette.brand.primary} style={{ position: "absolute", right: -2, top: -2 }} /></View>
        <Text style={{ color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontWeight: "700", fontSize: 22, textAlign: "center" }}>{t("missions.reward_title")}</Text>
        <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 14, textAlign: "center" }}>{t(definition.titleKey)}</Text>
        <Text style={{ color: appPalette.semantic.warningText, fontFamily: "Montserrat", fontWeight: "700", fontSize: 26 }}>+{pending.xpReward} XP</Text>
        <ActionChip tone="primary" disabled={claiming} onPress={() => void (async () => {
          try { setClaiming(true); await claimMissionReward(pending.key); }
          finally { setClaiming(false); }
        })()}>{claiming ? t("missions.claiming") : t("missions.claim", { xp: pending.xpReward })}</ActionChip>
        <ActionChip onPress={() => setDismissedKey(pending.key)}>{t("missions.later")}</ActionChip>
      </View>
    </View>
  </Modal>;
}
