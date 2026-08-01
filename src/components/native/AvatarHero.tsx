import { Image, Text, useWindowDimensions, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useVideoPlayer, VideoView } from "expo-video";

import { avatarAssetUrl } from "@/shared/api/client";
import { appPalette } from "@/theme/palette";

// Кинематографичный аватар витрины: зацикленный idle-луп (видео) поверх
// статичного постера. По тапу - лёгкая вспышка-реакция у подиума.
export function AvatarHero({
  level,
  video = "techwear.mp4",
  poster = "techwear.jpg",
}: {
  level: number;
  video?: string;
  poster?: string;
}) {
  const { width } = useWindowDimensions();
  const W = Math.min(width - 40, 360);
  const H = Math.round(W * 1.18);

  const player = useVideoPlayer(avatarAssetUrl(video), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  const pop = useSharedValue(0);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * pop.value,
    transform: [{ scale: 1 + 0.25 * pop.value }],
  }));

  const onTap = () => {
    pop.value = withSequence(
      withTiming(1, { duration: 130 }),
      withTiming(0, { duration: 340, easing: Easing.out(Easing.quad) })
    );
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
        {/* постер-подложка (мгновенно, пока грузится видео) */}
        <Image
          source={{ uri: avatarAssetUrl(poster) }}
          resizeMode="contain"
          style={{ position: "absolute", width: "100%", height: "100%" }}
        />

        {/* idle-луп */}
        <VideoView
          player={player}
          contentFit="contain"
          nativeControls={false}
          style={{ width: "100%", height: "100%" }}
        />

        {/* вспышка-свечение по тапу (у подиума) */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              bottom: H * 0.12,
              width: W * 0.6,
              height: 60,
              borderRadius: 60,
              backgroundColor: appPalette.brand.primary,
            },
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
          <Text style={{ color: appPalette.brand.primaryForeground, fontSize: 12, fontWeight: "800", fontFamily: "Montserrat" }}>
            LVL {level}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
