import { useEffect, useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import Svg, { Defs, LinearGradient as SvgLinear, Rect, Stop } from "react-native-svg";

import { Award, CircleCheck, Crown, Flame, Gift, Star, Trophy, X, Zap } from "@/components/native/icons";
import { AvatarStage } from "@/components/native/AvatarStage";
import { AVATARS, DEFAULT_AVATAR } from "@/data/avatars";
import { avatarAssetUrl } from "@/shared/api/client";
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

// Затемняющая вуаль сверху/снизу поверх аватара - для читаемости UI и слияния краёв с фоном.
function Fade({ position, width, height }: { position: "top" | "bottom"; width: number; height: number }) {
  const id = `fade-${position}`;
  const top = position === "top";
  return (
    <View pointerEvents="none" style={[{ position: "absolute", left: 0, right: 0, height }, top ? { top: 0 } : { bottom: 0 }]}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinear id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#05070c" stopOpacity={top ? 0.9 : 0} />
            <Stop offset="1" stopColor="#05070c" stopOpacity={top ? 0 : 0.96} />
          </SvgLinear>
        </Defs>
        <Rect width={width} height={height} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

const titleShadow = { textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 14 } as const;

export function ShowcaseSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user, rewards, archivedGoals, loadArchivedGoals, getProgressOverview, updateUser } = useAppStore();
  const { width, height } = useWindowDimensions();
  const [longestStreak, setLongestStreak] = useState(0);
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState(DEFAULT_AVATAR.id);
  const active = AVATARS.find((a) => a.id === activeId) ?? DEFAULT_AVATAR;

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
    <Modal visible={open} animationType="slide" onRequestClose={() => onOpenChange(false)}>
      <View style={{ flex: 1, backgroundColor: "#05070c" }}>
        {/* Аватар во весь экран - фон страницы */}
        <AvatarStage key={active.id} avatar={active} />
        <Fade position="top" width={width} height={180} />
        <Fade position="bottom" width={width} height={Math.round(height * 0.5)} />

        {/* Закрыть */}
        <Pressable onPress={() => onOpenChange(false)} hitSlop={10} style={{ position: "absolute", top: 52, right: 18, zIndex: 10 }}>
          <X size={26} color="#eef2fb" />
        </Pressable>

        {/* Контент поверх аватара: имя вверху, детали в стеклянной панели снизу */}
        <ScrollView style={StyleSheet.absoluteFill} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {/* область, где виден аватар; имя/уровень внизу неё */}
          <View style={{ height: Math.round(height * 0.5), justifyContent: "flex-end", paddingHorizontal: 22, paddingBottom: 4 }}>
            <Text style={{ fontSize: 26, fontWeight: "800", color: "#ffffff", fontFamily: "Montserrat", ...titleShadow }}>{user.name}</Text>
            <Text style={{ fontSize: 13, color: "#c8d4e8", fontFamily: "Montserrat", marginTop: 2, ...titleShadow }}>
              Уровень {user.level} · {active.className}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
              <Flame size={14} color={appPalette.semantic.warningStrong} />
              <Text style={{ fontSize: 12, color: "#f0c07a", fontFamily: "Montserrat", ...titleShadow }}>{longestStreak} дней - лучший стрик · {user.xp} XP</Text>
            </View>
          </View>

          {/* стеклянная панель с деталями */}
          <View style={{ backgroundColor: "rgba(8,11,18,0.92)", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40, gap: 16, minHeight: Math.round(height * 0.5) }}>
            {/* выбор аватара (коллекция) */}
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>Аватар</Text>
                <Text style={{ fontSize: 11, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat" }}>Коллекция · {AVATARS.length} / 48</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
                {AVATARS.map((a) => {
                  const activeA = a.id === activeId;
                  return (
                    <Pressable key={a.id} onPress={() => setActiveId(a.id)} style={{ width: 76, alignItems: "center", gap: 4 }}>
                      <View style={{ width: 76, height: 100, borderRadius: 14, overflow: "hidden", borderWidth: 2, borderColor: activeA ? a.accent : "transparent", backgroundColor: "#05070c" }}>
                        <Image source={{ uri: avatarAssetUrl(a.poster) }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
                      </View>
                      <Text numberOfLines={1} style={{ fontSize: 10, color: activeA ? appPalette.semantic.textStrong : appPalette.semantic.textSubtle, fontFamily: "Montserrat" }}>{a.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* стата */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[{ v: longestStreak, l: "лучший стрик" }, { v: archivedGoals.length, l: "целей закрыто" }, { v: unlocked.length, l: "артефактов" }].map((s, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: appPalette.semantic.neutralSurfaceStrong, borderRadius: 12, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>{s.v}</Text>
                  <Text style={{ fontSize: 10, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat" }}>{s.l}</Text>
                </View>
              ))}
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
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
