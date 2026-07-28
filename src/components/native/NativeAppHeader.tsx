import { Image, Text, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import { useTranslation } from "react-i18next";

import { GraduationCap, ScrollText, Settings } from "@/components/native/icons";
import { appPalette } from "@/theme/palette";
import type { User } from "@/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function NativeAppHeader({
  user,
  missionBadgeCount,
  onOpenMissions,
  onOpenSettings,
  onOpenShowcase,
  onOpenCollections,
}: {
  user: User;
  missionBadgeCount: number;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
  onOpenShowcase?: () => void;
  onOpenCollections?: () => void;
}) {
  const { t } = useTranslation();
  const progress = user.requiredXp > 0 ? Math.min((user.xp / user.requiredXp) * 100, 100) : 0;
  const initials = getInitials(user.name || user.email || "U");

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 0,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          borderWidth: 1,
          borderColor: appPalette.semantic.borderSubtle,
          borderRadius: 12,
          padding: 8,
          backgroundColor: appPalette.surface.card,
        }}
      >
        <Pressable style={{ position: "relative" }} onPress={onOpenShowcase} hitSlop={6}>
          {user.photoUrl ? (
            <Image
              source={{ uri: user.photoUrl }}
              style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: appPalette.semantic.borderSubtle }}
            />
          ) : (
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: appPalette.semantic.infoSurface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: appPalette.semantic.infoText, fontSize: 21, fontWeight: "500", fontFamily: "Montserrat", lineHeight: 29 }}>{initials}</Text>
            </View>
          )}

          <View
            style={{
              position: "absolute",
              right: -4,
              bottom: -4,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: appPalette.brand.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: appPalette.brand.primaryForeground, fontSize: 12, fontWeight: "500", fontFamily: "Montserrat", lineHeight: 18 }}>{user.level}</Text>
          </View>
        </Pressable>

        <View style={{ flex: 1, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Text
              numberOfLines={1}
              style={{ flex: 1, color: appPalette.semantic.textStrong, fontSize: 15, fontWeight: "500", fontFamily: "Montserrat", lineHeight: 23 }}
            >
              {user.name || user.email || "User"}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Pressable onPress={onOpenCollections} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" }}>
                <GraduationCap size={20} color={appPalette.semantic.textMuted} />
              </Pressable>
              <Pressable onPress={onOpenMissions} hitSlop={8} style={{ position: "relative", width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" }}>
                {!!missionBadgeCount && <View style={{ position: "absolute", right: -1, top: -3, zIndex: 2, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: appPalette.semantic.dangerStrong }}><Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>{missionBadgeCount}</Text></View>}
                <ScrollText size={20} color={appPalette.semantic.textMuted} />
              </Pressable>
              <Pressable onPress={onOpenSettings} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" }}>
                <Settings size={20} color={appPalette.semantic.textMuted} />
              </Pressable>
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", fontFamily: "Montserrat", lineHeight: 18 }}>{t("profile.level")} {user.level}</Text>
              <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontWeight: "400", fontFamily: "Montserrat", lineHeight: 18 }}>
                {user.xp} / {user.requiredXp} XP
              </Text>
            </View>

            <View style={{ height: 8, borderRadius: 999, backgroundColor: appPalette.semantic.borderSubtle, overflow: "hidden" }}>
              <View
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: appPalette.brand.primary,
                  borderRadius: 999,
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
