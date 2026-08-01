import { useEffect, useState } from "react";
import { Modal, ScrollView, Switch, Text, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";

import { Award, CircleCheck, Crown, Flame, Gift, Star, Trophy, X, Zap } from "@/components/native/icons";
import { AvatarHero } from "@/components/native/AvatarHero";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";
import type { RewardIconType } from "@/shared/domain";

const rewardIconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  trophy: Trophy,
  star: Star,
  gift: Gift,
  crown: Crown,
  award: Award,
  zap: Zap,
};

export function ShowcaseSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user, rewards, archivedGoals, loadArchivedGoals, getProgressOverview, updateUser } = useAppStore();
  const [longestStreak, setLongestStreak] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    void loadArchivedGoals();
    getProgressOverview()
      .then((o) => setLongestStreak(o.longestStreak))
      .catch(() => {});
  }, [open, loadArchivedGoals, getProgressOverview]);

  const unlocked = rewards.filter((r) => r.isUnlocked);

  if (!user) return null;

  const publicOn = user.showcasePublic !== false;

  const togglePrivacy = async (value: boolean) => {
    setBusy(true);
    try {
      await updateUser({ showcasePublic: value });
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => onOpenChange(false)}>
      <View style={{ flex: 1, backgroundColor: appPalette.surface.overlay, justifyContent: "flex-end" }}>
        <View style={{ maxHeight: "90%", backgroundColor: appPalette.surface.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", lineHeight: 24 }}>Витрина</Text>
            <Pressable onPress={() => onOpenChange(false)} hitSlop={8}><X size={22} color={appPalette.semantic.textMuted} /></Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
            <View style={{ alignItems: "center", gap: 6 }}>
              <AvatarHero level={user.level} />
              <Text style={{ fontSize: 18, fontWeight: "500", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>{user.name}</Text>
              <Text style={{ fontSize: 12, color: appPalette.semantic.textMuted, fontFamily: "Montserrat" }}>Уровень {user.level} · {user.xp} XP</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Flame size={14} color={appPalette.semantic.warningStrong} />
                <Text style={{ fontSize: 12, color: appPalette.semantic.warningText, fontFamily: "Montserrat" }}>{longestStreak} дней - лучший стрик</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1, backgroundColor: appPalette.semantic.neutralSurfaceStrong, borderRadius: 12, padding: 10, alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>{longestStreak}</Text>
                <Text style={{ fontSize: 10, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat" }}>лучший стрик</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: appPalette.semantic.neutralSurfaceStrong, borderRadius: 12, padding: 10, alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>{archivedGoals.length}</Text>
                <Text style={{ fontSize: 10, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat" }}>целей закрыто</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: appPalette.semantic.neutralSurfaceStrong, borderRadius: 12, padding: 10, alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>{unlocked.length}</Text>
                <Text style={{ fontSize: 10, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat" }}>артефактов</Text>
              </View>
            </View>

            {unlocked.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>Артефакты</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {unlocked.slice(0, 12).map((r) => {
                    const Icon = rewardIconMap[(r.icon as RewardIconType) ?? "trophy"] ?? Trophy;
                    return (
                      <View key={r.id} style={{ width: 68, alignItems: "center", gap: 4 }}>
                        <View style={{ width: 60, height: 60, borderRadius: 14, backgroundColor: appPalette.semantic.warningSurface, alignItems: "center", justifyContent: "center" }}>
                          <Icon size={26} color={appPalette.semantic.warningText} />
                        </View>
                        <Text numberOfLines={1} style={{ fontSize: 10, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat" }}>{r.title}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {archivedGoals.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>Завершённые цели</Text>
                {archivedGoals.slice(0, 8).map((g) => (
                  <View key={g.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: appPalette.semantic.neutralSurfaceStrong, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9 }}>
                    <CircleCheck size={16} color={appPalette.semantic.successStrong} />
                    <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>{g.title}</Text>
                  </View>
                ))}
              </View>
            )}

            <SurfaceCard gap={0} padding={13} radius={12}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 13, color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>Показывать друзьям</Text>
                  <Text style={{ fontSize: 11, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat", lineHeight: 15 }}>Друзья увидят твою витрину</Text>
                </View>
                <Switch value={publicOn} onValueChange={togglePrivacy} disabled={busy} />
              </View>
            </SurfaceCard>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
