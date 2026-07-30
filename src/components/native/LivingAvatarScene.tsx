import { useEffect, type ReactNode } from "react";
import { Image, Text, useWindowDimensions, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

import { appPalette } from "@/theme/palette";

export type SceneArtifact = {
  key: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  value?: string | number;
  // Позиция относительно центра сцены, в долях ширины/высоты (0..1).
  x: number;
  y: number;
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

// Плавающий артефакт: вечный вверх-вниз со своей фазой.
function Floating({ children, delay, distance = 8, duration = 2600 }: { children: ReactNode; delay: number; distance?: number; duration?: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withTiming(-distance, { duration, easing: Easing.inOut(Easing.quad) }), -1, true));
    return () => cancelAnimation(y);
  }, [y, delay, distance, duration]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export function LivingAvatarScene({
  name,
  level,
  photoUrl,
  artifacts,
}: {
  name: string;
  level: number;
  photoUrl?: string | null;
  artifacts: SceneArtifact[];
}) {
  const { width } = useWindowDimensions();
  const W = Math.min(width - 40, 360);
  const H = 260;

  const breathe = useSharedValue(0);
  const spin = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
    spin.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1, false);
    return () => {
      cancelAnimation(breathe);
      cancelAnimation(spin);
    };
  }, [breathe, spin]);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -6 * breathe.value },
      { scale: 1 + 0.02 * breathe.value + 0.12 * pop.value },
      { rotateZ: `${(breathe.value - 0.5) * 3}deg` },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
    opacity: 0.5 + 0.3 * breathe.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({ opacity: pop.value, transform: [{ scale: 1 + 0.6 * pop.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.6 + 0.4 * breathe.value }));

  const onTap = () => {
    pop.value = withSequence(withTiming(1, { duration: 130 }), withTiming(0, { duration: 320, easing: Easing.out(Easing.quad) }));
  };

  const cx = W / 2;
  const avatarSize = 120;

  return (
    <View style={{ width: W, height: H, alignSelf: "center", justifyContent: "flex-end", alignItems: "center" }}>
      {/* Свечение подиума */}
      <Animated.View style={[{ position: "absolute", bottom: 24, width: W, height: 130 }, glowStyle]}>
        <Svg width={W} height={130}>
          <Defs>
            <RadialGradient id="podium" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={appPalette.brand.primary} stopOpacity="0.55" />
              <Stop offset="0.6" stopColor={appPalette.brand.primary} stopOpacity="0.14" />
              <Stop offset="1" stopColor={appPalette.brand.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={W / 2} cy={78} rx={W * 0.36} ry={50} fill="url(#podium)" />
          <Ellipse cx={W / 2} cy={82} rx={W * 0.30} ry={38} fill="none" stroke={appPalette.brand.primary} strokeOpacity={0.5} strokeWidth={1.5} />
          <Ellipse cx={W / 2} cy={82} rx={W * 0.20} ry={24} fill="none" stroke={appPalette.brand.primary} strokeOpacity={0.3} strokeWidth={1} />
        </Svg>
      </Animated.View>

      {/* Артефакты вокруг (из реальных данных) */}
      {artifacts.map((a, i) => {
        const Icon = a.icon;
        const left = cx + a.x * (W / 2) - 26;
        const top = H * a.y - 26;
        return (
          <View key={a.key} style={{ position: "absolute", left, top }}>
            <Floating delay={i * 260} distance={7 + (i % 3) * 2} duration={2400 + (i % 4) * 400}>
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: appPalette.semantic.neutralSurfaceStrong, borderWidth: 1, borderColor: a.color, alignItems: "center", justifyContent: "center", gap: 1 }}>
                <Icon size={20} color={a.color} />
                {a.value !== undefined && (
                  <Text style={{ fontSize: 9, fontWeight: "700", color: appPalette.semantic.textMuted, fontFamily: "Montserrat" }}>{a.value}</Text>
                )}
              </View>
            </Floating>
          </View>
        );
      })}

      {/* Аватар с вращающимся ореолом и дыханием */}
      <Animated.View style={[{ position: "absolute", bottom: 44 }, avatarStyle]}>
        <Pressable onPress={onTap} hitSlop={8}>
          <View style={{ width: avatarSize, height: avatarSize, alignItems: "center", justifyContent: "center" }}>
            {/* вращающийся ореол */}
            <Animated.View style={[{ position: "absolute", width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, borderWidth: 2, borderColor: appPalette.brand.primary, borderStyle: "dashed" }, haloStyle]} />
            {/* вспышка по тапу */}
            <Animated.View style={[{ position: "absolute", width: avatarSize + 10, height: avatarSize + 10, borderRadius: (avatarSize + 10) / 2, borderWidth: 3, borderColor: appPalette.brand.primary }, flashStyle]} />
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={{ width: avatarSize - 20, height: avatarSize - 20, borderRadius: (avatarSize - 20) / 2, backgroundColor: appPalette.semantic.borderSubtle }} />
            ) : (
              <View style={{ width: avatarSize - 20, height: avatarSize - 20, borderRadius: (avatarSize - 20) / 2, backgroundColor: appPalette.semantic.infoSurface, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: appPalette.semantic.infoText, fontSize: 34, fontWeight: "500", fontFamily: "Montserrat" }}>{initials(name || "U")}</Text>
              </View>
            )}
            {/* бейдж уровня */}
            <View style={{ position: "absolute", bottom: 6, right: 12, minWidth: 28, height: 28, paddingHorizontal: 6, borderRadius: 14, backgroundColor: appPalette.brand.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: appPalette.surface.background }}>
              <Text style={{ color: appPalette.brand.primaryForeground, fontSize: 12, fontWeight: "700", fontFamily: "Montserrat" }}>{level}</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
