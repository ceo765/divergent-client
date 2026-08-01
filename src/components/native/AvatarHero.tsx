import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, useWindowDimensions, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { avatarAssetUrl } from "@/shared/api/client";
import { appPalette } from "@/theme/palette";

// Кинематографичный аватар витрины: статичный кино-рендер, оживлённый лёгким
// «дыханием» кадра и реакцией по тапу. Позже картинку заменит idle-луп (видео).
export function AvatarHero({ level, source = "techwear.jpg" }: { level: number; source?: string }) {
  const { width } = useWindowDimensions();
  const W = Math.min(width - 40, 360);
  const H = Math.round(W * 1.18);

  const [loaded, setLoaded] = useState(false);

  const breathe = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(breathe);
  }, [breathe]);

  const imgStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -4 * breathe.value },
      { scale: 1 + 0.012 * breathe.value + 0.03 * pop.value },
    ],
  }));

  const flashStyle = useAnimatedStyle(() => ({ opacity: 0.5 * pop.value, transform: [{ scale: 1 + 0.25 * pop.value }] }));

  const onTap = () => {
    pop.value = withSequence(withTiming(1, { duration: 130 }), withTiming(0, { duration: 340, easing: Easing.out(Easing.quad) }));
  };

  return (
    <Pressable onPress={onTap}>
      <View
        style={{
          width: W,
          height: H,
          alignSelf: "center",
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: "#05070c",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!loaded && <ActivityIndicator color={appPalette.brand.primary} />}
        <Animated.View style={[{ width: "100%", height: "100%", position: "absolute" }, imgStyle]}>
          <Image
            source={{ uri: avatarAssetUrl(source) }}
            resizeMode="contain"
            onLoadEnd={() => setLoaded(true)}
            style={{ width: "100%", height: "100%" }}
          />
        </Animated.View>

        {/* вспышка-свечение по тапу (у подиума) */}
        <Animated.View
          pointerEvents="none"
          style={[
            { position: "absolute", bottom: H * 0.12, width: W * 0.6, height: 60, borderRadius: 60, backgroundColor: appPalette.brand.primary },
            flashStyle,
          ]}
        />

        {/* бейдж уровня */}
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            backgroundColor: appPalette.brand.primary,
            paddingHorizontal: 9,
            paddingVertical: 3,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: appPalette.brand.primaryForeground, fontSize: 12, fontWeight: "800", fontFamily: "Montserrat" }}>LVL {level}</Text>
        </View>
      </View>
    </Pressable>
  );
}
