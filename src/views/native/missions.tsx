import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useNativeNavigation } from "@/app/native/NativeNavigation";
import { ActionChip } from "@/components/native/ActionChip";
import { CircleCheck, Sparkles } from "@/components/native/icons";
import { ScreenHeader } from "@/components/native/ScreenHeader";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { MISSION_DEFINITIONS } from "@/shared/missions/catalog";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";

export default function NativeMissionsScreen() {
  const { t } = useTranslation();
  const { navigateToPath } = useNativeNavigation();
  const missionState = useAppStore((state) => state.missionState);
  const loadMissions = useAppStore((state) => state.loadMissions);
  useEffect(() => { void loadMissions(); }, [loadMissions]);

  const completed = missionState?.missions.filter((mission) => mission.completedAt).length ?? 0;
  const activeOrder = missionState?.missions.find((mission) => mission.key === missionState.activeKey)?.order ?? MISSION_DEFINITIONS.length + 1;

  return <View style={{ flex: 1, backgroundColor: appPalette.surface.background }}>
    <ScreenHeader title={t("missions.title")} paddingHorizontal={8} paddingVertical={8} />
    <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 16, gap: 8 }}>
      <SurfaceCard>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Sparkles size={22} color={appPalette.brand.primary} /><Text style={{ flex: 1, color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontSize: 13 }}>{t("missions.subtitle")}</Text></View>
        <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12 }}>{t("missions.progress", { completed, total: MISSION_DEFINITIONS.length })}</Text>
        <View style={{ height: 7, borderRadius: 4, overflow: "hidden", backgroundColor: appPalette.semantic.borderSubtle }}><View style={{ width: `${completed / MISSION_DEFINITIONS.length * 100}%`, height: "100%", backgroundColor: appPalette.brand.primary }} /></View>
      </SurfaceCard>
      {MISSION_DEFINITIONS.map((definition, index) => {
        const progress = missionState?.missions.find((mission) => mission.key === definition.key);
        const isCompleted = Boolean(progress?.completedAt);
        const isActive = missionState?.activeKey === definition.key;
        const isLocked = !isCompleted && !isActive && index + 1 > activeOrder;
        return <View key={definition.key} style={{ opacity: isLocked ? 0.55 : 1 }}><SurfaceCard gap={8}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: isCompleted ? appPalette.semantic.successSurface : isActive ? appPalette.semantic.infoSurface : appPalette.semantic.neutralSurface }}>
              {isCompleted ? <CircleCheck size={20} color={appPalette.semantic.successText} /> : <Text style={{ color: isActive ? appPalette.semantic.infoText : appPalette.semantic.textMuted, fontFamily: "Montserrat", fontWeight: "700" }}>{index + 1}</Text>}
            </View>
            <Text style={{ flex: 1, color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontWeight: "600", fontSize: 14 }}>{t(definition.titleKey)}</Text>
            <Text style={{ color: appPalette.semantic.warningText, fontFamily: "Montserrat", fontWeight: "600", fontSize: 11 }}>+{progress?.xpReward ?? 100} XP</Text>
          </View>
          <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{t(definition.descriptionKey)}</Text>
          {!isLocked && <View style={{ gap: 3, padding: 10, borderRadius: 10, backgroundColor: appPalette.semantic.neutralSurface }}><Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontWeight: "600", fontSize: 10 }}>{t("missions.what_to_do").toUpperCase()}</Text><Text style={{ color: appPalette.semantic.text, fontFamily: "Montserrat", fontSize: 12 }}>{t(definition.actionKey)}</Text><Text style={{ marginTop: 4, color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 11 }}>{t("missions.example")}: {t(definition.exampleKey)}</Text></View>}
          {isActive && <View style={{ alignItems: "flex-start" }}><ActionChip tone="primary" onPress={() => navigateToPath(definition.path)}>{t("missions.go_to_action")}</ActionChip></View>}
          {isLocked && <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 11 }}>{t("missions.locked")}</Text>}
        </SurfaceCard></View>;
      })}
    </ScrollView>
  </View>;
}
