import { Image, StyleSheet, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

import { avatarAssetUrl } from "@/shared/api/client";
import type { AvatarDef } from "@/data/avatars";

// Полноэкранный фон витрины: аватар вписан в страницу край-в-край.
// Постер под видео - чтобы не было пустого кадра пока грузится луп.
// Компонент монтируется с key=avatar.id, поэтому смена аватара пересоздаёт плеер.
export function AvatarStage({ avatar }: { avatar: AvatarDef }) {
  const player = useVideoPlayer(avatarAssetUrl(avatar.video), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={{ uri: avatarAssetUrl(avatar.poster) }}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <VideoView
        player={player}
        contentFit="cover"
        nativeControls={false}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
