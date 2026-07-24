import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import { useTranslation } from "react-i18next";

import { EmptyStateCard } from "@/components/native/EmptyStateCard";
import { Plus } from "@/components/native/icons";
import { NativeChallengeCardView } from "@/components/native/NativeChallengeCardView";
import { appPalette } from "@/theme/palette";
import type { Challenge } from "@/types";

export function ChallengesScreenHeader({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation();

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        backgroundColor: appPalette.surface.background,
      }}
    >
      <Text
        style={{
          fontSize: 19,
          fontWeight: "500",
          color: appPalette.semantic.textStrong,
          fontFamily: "Montserrat",
          lineHeight: 29,
        }}
      >
        {t("challenges.title")}
      </Text>

      <Pressable
        onPress={onCreate}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: appPalette.semantic.infoSurface,
          borderWidth: 1,
          borderColor: appPalette.semantic.infoBorder,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Plus size={16} color={appPalette.semantic.infoText} />
        <Text
          style={{
            color: appPalette.semantic.infoText,
            fontSize: 12,
            fontWeight: "500",
            lineHeight: 18,
            fontFamily: "Montserrat",
          }}
        >
          {t("challenges.create")}
        </Text>
      </Pressable>
    </View>
  );
}

export function ChallengesScreenContent({
  challenges,
  focusedChallengeId,
  onCreate,
  onEdit,
  onShare,
  onSelect,
  onAccept,
  onLeave,
  onOpenLink,
  onOpenParticipants,
  onReport,
  onChat,
}: {
  challenges: Challenge[];
  focusedChallengeId?: string | null;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onShare: (id: string) => void;
  onSelect: (challenge: Challenge) => void;
  onAccept: (id: string) => void;
  onLeave: (id: string) => void;
  onOpenLink: (id: string) => void;
  onOpenParticipants: (id: string) => void;
  onReport: (id: string) => void;
  onChat: (id: string) => void;
}) {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView | null>(null);
  const [itemOffsets, setItemOffsets] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!focusedChallengeId) {
      return;
    }

    const y = itemOffsets[focusedChallengeId];
    if (typeof y !== "number") {
      return;
    }

    scrollRef.current?.scrollTo({ y: Math.max(y - 12, 0), animated: true });
  }, [focusedChallengeId, itemOffsets]);

  return (
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingHorizontal: 8, gap: 8 }}>
      {challenges.length === 0 ? (
        <EmptyStateCard
          title={t("challenges.empty")}
          description={t("challenges.empty_native_description")}
          actionLabel={t("challenges.create_first")}
          onAction={onCreate}
        />
      ) : (
        challenges.map((challenge) => (
          <View
            key={challenge.id}
            onLayout={(event) => {
              const { y } = event.nativeEvent.layout;
              setItemOffsets((current) => (current[challenge.id] === y ? current : { ...current, [challenge.id]: y }));
            }}
          >
            <NativeChallengeCardView
              challenge={challenge}
              focused={challenge.id === focusedChallengeId}
              onEdit={onEdit}
              onShare={onShare}
              onSelect={onSelect}
              onAccept={onAccept}
              onLeave={onLeave}
              onOpenLink={onOpenLink}
              onOpenParticipants={onOpenParticipants}
              onReport={onReport}
              onChat={onChat}
            />
          </View>
        ))
      )}
    </ScrollView>
  );
}
