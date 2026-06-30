import { Modal, Text, View } from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ActionChip } from "@/components/native/ActionChip";
import { ScrollText, Sparkles } from "@/components/native/icons";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";

export function MissionIntroModal({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();
  const missionState = useAppStore((state) => state.missionState);
  const markMissionIntroSeen = useAppStore((state) => state.markMissionIntroSeen);
  const [saving, setSaving] = useState(false);

  if (!missionState || missionState.introSeen) return null;

  return <Modal visible transparent animationType="fade">
    <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: appPalette.surface.overlay }}>
      <View style={{ alignItems: "center", gap: 14, padding: 24, borderRadius: 20, backgroundColor: appPalette.surface.card }}>
        <View style={{ position: "relative", width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", backgroundColor: appPalette.semantic.infoSurface }}>
          <ScrollText size={42} color={appPalette.brand.primary} />
          <Sparkles size={22} color={appPalette.brand.primary} style={{ position: "absolute", right: -2, top: -2 }} />
        </View>
        <Text style={{ color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontWeight: "700", fontSize: 22, textAlign: "center" }}>{t("missions.intro_title")}</Text>
        <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 14, lineHeight: 21, textAlign: "center" }}>{t("missions.intro_description")}</Text>
        <ActionChip tone="primary" disabled={saving} onPress={() => void (async () => {
          try { setSaving(true); await markMissionIntroSeen(); onStart(); }
          finally { setSaving(false); }
        })()}>{saving ? t("common.saving") : t("missions.intro_start")}</ActionChip>
      </View>
    </View>
  </Modal>;
}
