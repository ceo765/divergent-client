import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Modal, ScrollView, Text, View } from "react-native";

import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import { ActionChip } from "@/components/native/ActionChip";
import { SheetDragHandle, useSheetDragToClose } from "@/components/native/form-sheet/SheetChrome";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { appPalette } from "@/theme/palette";
import type { Challenge, ChallengeParticipant, Report } from "@/types";

function formatReportDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function ChallengeDetailsSheet({
  open,
  challenge,
  loading = false,
  participants,
  reports,
  onOpenChange,
  onDownload,
  onKick,
}: {
  open: boolean;
  challenge: Challenge;
  loading?: boolean;
  participants: ChallengeParticipant[];
  reports: Report[];
  onOpenChange: (open: boolean) => void;
  onDownload: (reportId: string) => Promise<boolean>;
  onKick: (challengeId: string, userId: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const reportsByUser = useMemo(
    () =>
      reports.reduce<Record<string, Report[]>>((acc, report) => {
        if (!acc[report.userId]) acc[report.userId] = [];
        acc[report.userId].push(report);
        return acc;
      }, {}),
    [reports],
  );
  const { headerPanHandlers, sheetStyle } = useSheetDragToClose(open, () => onOpenChange(false));
  const toggleParticipant = (userId: string) => setExpandedUsers((current) => ({ ...current, [userId]: !current[userId] }));

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={() => onOpenChange(false)}>
      <View style={{ flex: 1, backgroundColor: appPalette.surface.overlay, justifyContent: "flex-end" }}>
        <Animated.View
          style={{
            maxHeight: "88%",
            backgroundColor: appPalette.surface.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            gap: 14,
            ...sheetStyle,
          }}
        >
          <View {...headerPanHandlers} style={{ gap: 6 }}>
            <SheetDragHandle />
            <Text style={{ fontSize: 20, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>{challenge.title}</Text>
            <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>
              {t("challenges.participants_count")} {participants.length} • {t("challenges.reports_count", { count: reports.length })}
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ gap: 12 }}>
            {loading ? (
              <SurfaceCard>
                <Text style={{ fontSize: 16, fontWeight: "600", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>{t("common.loading")}</Text>
                <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>
                  {t("challenges.loading_participants_description")}
                </Text>
              </SurfaceCard>
            ) : participants.length === 0 ? (
              <SurfaceCard>
                <Text style={{ fontSize: 16, fontWeight: "600", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>{t("challenges.noParticipants")}</Text>
                <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{t("challenges.noParticipantsDescription")}</Text>
              </SurfaceCard>
            ) : (
              participants.map((participant) => {
                const userReports = reportsByUser[participant.userId] ?? [];
                const isExpanded = Boolean(expandedUsers[participant.userId]);
                const canKick = participant.userId !== challenge.creatorId;

                return (
                  <SurfaceCard key={participant.id}>
                    <View style={{ gap: 6 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: "600", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>{participant.user.name}</Text>
                          <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>
                            {participant.user.email || t("common.not_specified")}
                          </Text>
                        </View>
                        <Text style={{ color: appPalette.brand.primary, fontWeight: "600", fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>
                          {isExpanded ? t("common.hide") : t("common.open")}
                        </Text>
                      </View>

                      <Pressable onPress={() => toggleParticipant(participant.userId)} style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        <View style={{ backgroundColor: appPalette.ui.inputBackground, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                          <Text style={{ color: appPalette.semantic.text, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>
                            {t("challenges.reports_count", { count: userReports.length })}
                          </Text>
                        </View>
                        <View style={{ backgroundColor: appPalette.semantic.warningSurface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                          <Text style={{ color: appPalette.semantic.warningText, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>
                            Пропуски: {participant.missCount}
                          </Text>
                        </View>
                        {participant.status === "REMOVED" && (
                          <View style={{ backgroundColor: appPalette.semantic.dangerSurface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                            <Text style={{ color: appPalette.semantic.dangerText, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>Исключён</Text>
                          </View>
                        )}
                        {participant.userId === challenge.creatorId && (
                          <View style={{ backgroundColor: appPalette.semantic.violetSurface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                            <Text style={{ color: appPalette.semantic.violetText, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{t("common.created_by")}</Text>
                          </View>
                        )}
                      </Pressable>

                      {isExpanded && (
                        <View style={{ gap: 10 }}>
                          {userReports.length === 0 ? (
                            <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{t("challenges.participant_no_reports")}</Text>
                          ) : (
                            userReports.map((report) => (
                              <View key={report.id} style={{ borderWidth: 1, borderColor: appPalette.semantic.borderSubtle, borderRadius: 14, padding: 12, gap: 8, backgroundColor: appPalette.ui.inputBackground }}>
                                <View style={{ gap: 4 }}>
                                  <Text style={{ fontWeight: "600", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>
                                    {report.taskCompletion.task.title}
                                  </Text>
                                  <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>
                                    {report.fileType} • {formatReportDate(report.createdAt)}
                                  </Text>
                                  {!!report.comment && <Text style={{ color: appPalette.semantic.text, fontFamily: "Montserrat", fontSize: 12, lineHeight: 18 }}>{report.comment}</Text>}
                                </View>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                  <ActionChip onPress={() => void onDownload(report.id)} tone="primary">
                                    {t("common.download_report")}
                                  </ActionChip>
                                </View>
                              </View>
                            ))
                          )}
                          {canKick && (
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                              <ActionChip onPress={() => void onKick(challenge.id, participant.userId)} tone="danger">
                                {t("challenges.kick_participant")}
                              </ActionChip>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </SurfaceCard>
                );
              })
            )}
          </ScrollView>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <ActionChip onPress={() => onOpenChange(false)}>{t("common.close")}</ActionChip>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
