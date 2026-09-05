import { useEffect, useState } from "react";
import { Modal, ScrollView, Share, Switch, Text, useWindowDimensions, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import Svg, { Defs, LinearGradient as SvgLinear, Rect, Stop } from "react-native-svg";

import { Award, CircleCheck, Crown, Flame, Gift, Share as ShareIcon, Star, Trophy, X, Zap } from "@/components/native/icons";
import { AvatarStage } from "@/components/native/AvatarStage";
import { avatarForLevel, nextStage } from "@/data/avatars";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";
import type { RewardIconType } from "@/shared/domain";
import type { Reward } from "@/types";

const rewardIconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  trophy: Trophy,
  star: Star,
  gift: Gift,
  crown: Crown,
  award: Award,
  zap: Zap,
};

// Позиции артефактов вокруг аватара (доли ширины/высоты), не перекрывают лицо.
const ARTIFACT_SLOTS = [
  { x: 0.05, y: 0.15 },
  { x: 0.82, y: 0.13 },
  { x: 0.03, y: 0.31 },
  { x: 0.84, y: 0.29 },
  { x: 0.06, y: 0.47 },
  { x: 0.81, y: 0.45 },
];

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
  const [story, setStory] = useState<Reward | null>(null);

  useEffect(() => {
    if (!open) return;
    void loadArchivedGoals();
    getProgressOverview()
      .then((o) => setLongestStreak(o.longestStreak))
      .catch(() => {});
  }, [open, loadArchivedGoals, getProgressOverview]);

  const unlocked = rewards.filter((r) => r.isUnlocked);
  const floating = unlocked.slice(0, ARTIFACT_SLOTS.length);

  if (!user) return null;

  const avatar = avatarForLevel(user.level);
  const upcoming = nextStage(user.level);
  const publicOn = user.showcasePublic !== false;
  const panelTop = Math.round(height * 0.55);

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

  const share = async () => {
    try {
      await Share.share({
        message: `${user.name} · Уровень ${user.level} · ${avatar.className}\nМоя витрина в Divergent: ${unlocked.length} артефактов, стрик ${longestStreak} дней.`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={() => onOpenChange(false)}>
      <View style={{ flex: 1, backgroundColor: "#05070c" }}>
        {/* Аватар во весь экран - фон страницы */}
        <AvatarStage avatar={avatar} />
        <Fade position="top" width={width} height={180} />
        <Fade position="bottom" width={width} height={Math.round(height * 0.5)} />

        {/* Артефакты парят вокруг аватара */}
        {floating.map((r, i) => {
          const slot = ARTIFACT_SLOTS[i];
          const Icon = rewardIconMap[(r.icon as RewardIconType) ?? "trophy"] ?? Trophy;
          return (
            <Pressable
              key={r.id}
              onPress={() => setStory(r)}
              style={{ position: "absolute", left: slot.x * width, top: slot.y * height, width: 54, height: 54, borderRadius: 16, backgroundColor: "rgba(12,16,26,0.78)", borderWidth: 1, borderColor: appPalette.brand.primary, alignItems: "center", justifyContent: "center", shadowColor: appPalette.brand.primary, shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }}
            >
              <Icon size={24} color={appPalette.semantic.warningText} />
            </Pressable>
          );
        })}

        {/* Закрыть + Поделиться */}
        <Pressable onPress={() => onOpenChange(false)} hitSlop={10} style={{ position: "absolute", top: 52, right: 18, zIndex: 10 }}>
          <X size={26} color="#eef2fb" />
        </Pressable>
        <Pressable onPress={share} hitSlop={10} style={{ position: "absolute", top: 52, right: 58, zIndex: 10 }}>
          <ShareIcon size={22} color="#eef2fb" />
        </Pressable>

        {/* Имя/уровень над панелью */}
        <View style={{ position: "absolute", left: 22, right: 22, top: panelTop - 78 }} pointerEvents="none">
          <Text style={{ fontSize: 26, fontWeight: "800", color: "#ffffff", fontFamily: "Montserrat", ...titleShadow }}>{user.name}</Text>
          <Text style={{ fontSize: 13, color: "#c8d4e8", fontFamily: "Montserrat", marginTop: 2, ...titleShadow }}>Уровень {user.level} · {avatar.className}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
            <Flame size={14} color={appPalette.semantic.warningStrong} />
            <Text style={{ fontSize: 12, color: "#f0c07a", fontFamily: "Montserrat", ...titleShadow }}>{longestStreak} дней - лучший стрик · {user.xp} XP</Text>
          </View>
          {upcoming && (
            <Text style={{ fontSize: 11, color: "#8fb0ff", fontFamily: "Montserrat", marginTop: 5, ...titleShadow }}>
              Следующая стадия: {upcoming.name} · с {upcoming.minLevel} ур.
            </Text>
          )}
        </View>

        {/* Нижняя стеклянная панель */}
        <View style={{ position: "absolute", left: 0, right: 0, top: panelTop, bottom: 0, backgroundColor: "rgba(8,11,18,0.94)", borderTopLeftRadius: 26, borderTopRightRadius: 26 }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }} showsVerticalScrollIndicator={false}>
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
                <Text style={{ fontSize: 13, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>Артефакты · {unlocked.length}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {unlocked.slice(0, 12).map((r) => {
                    const Icon = rewardIconMap[(r.icon as RewardIconType) ?? "trophy"] ?? Trophy;
                    return (
                      <Pressable key={r.id} onPress={() => setStory(r)} style={{ width: 68, alignItems: "center", gap: 4 }}>
                        <View style={{ width: 60, height: 60, borderRadius: 14, backgroundColor: appPalette.semantic.warningSurface, alignItems: "center", justifyContent: "center" }}>
                          <Icon size={26} color={appPalette.semantic.warningText} />
                        </View>
                        <Text numberOfLines={1} style={{ fontSize: 10, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat" }}>{r.title}</Text>
                      </Pressable>
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

        {/* История артефакта */}
        {story && (
          <Pressable onPress={() => setStory(null)} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(3,5,10,0.7)", alignItems: "center", justifyContent: "center", padding: 30 }}>
            <View style={{ width: "100%", maxWidth: 320, backgroundColor: appPalette.surface.background, borderRadius: 18, padding: 20, gap: 10, alignItems: "center" }}>
              <View style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: appPalette.semantic.warningSurface, alignItems: "center", justifyContent: "center" }}>
                {(() => {
                  const Icon = rewardIconMap[(story.icon as RewardIconType) ?? "trophy"] ?? Trophy;
                  return <Icon size={34} color={appPalette.semantic.warningText} />;
                })()}
              </View>
              <Text style={{ fontSize: 17, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", textAlign: "center" }}>{story.title}</Text>
              {!!story.description && (
                <Text style={{ fontSize: 13, color: appPalette.semantic.textMuted, fontFamily: "Montserrat", textAlign: "center", lineHeight: 19 }}>{story.description}</Text>
              )}
              <Text style={{ fontSize: 11, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat" }}>Артефакт · твоё достижение</Text>
              <Pressable onPress={() => setStory(null)} style={{ marginTop: 6, backgroundColor: appPalette.brand.primary, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 30 }}>
                <Text style={{ color: appPalette.brand.primaryForeground, fontSize: 13, fontWeight: "600", fontFamily: "Montserrat" }}>Закрыть</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}
