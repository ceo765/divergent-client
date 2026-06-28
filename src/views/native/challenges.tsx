import { useEffect, useState } from "react";
import { View } from "react-native";

import { ChallengesScreenDialogs } from "@/components/native/challenges-screen/Dialogs";
import {
  ChallengesScreenContent,
  ChallengesScreenHeader,
} from "@/components/native/challenges-screen/Sections";
import { useChallengesScreenController } from "@/components/native/challenges-screen/useChallengesScreenController";
import { appPalette } from "@/theme/palette";
import type { Challenge } from "@/types";

export default function NativeChallengesScreen(props: {
  focusId?: string | null;
  paymentId?: string | null;
  onConsumeLinkState?: () => void;
}) {
  const [focusedChallengeId, setFocusedChallengeId] = useState<string | null | undefined>(props.focusId);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [activeDialog, setActiveDialog] = useState<"details" | "participants" | null>(null);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  const {
    challenges,
    goals,
    reports,
    participants,
    challengeDialogOpen,
    editingChallenge,
    paymentDialogOpen,
    closeChallengeDialog,
    setPaymentDialogOpen,
    openCreateChallenge,
    openEditChallenge,
    closeAcceptDialog,
    shareChallenge,
    downloadChallengeReport,
    saveChallenge,
    selectPaymentMethod,
    openChallengeLink,
    handleAcceptChallenge,
    handleOpenParticipants,
    handleLeaveChallenge,
    handleKickParticipant,
    personalJoinChallenge,
    checkInChallenge,
    joinWithPersonalGoal,
    closePersonalJoinDialog,
    openCheckInDialog,
    closeCheckInDialog,
  } = useChallengesScreenController(props);

  useEffect(() => {
    if (!props.focusId) {
      return;
    }

    setFocusedChallengeId(props.focusId);
    const challenge = challenges.find((item) => item.id === props.focusId);
    if (challenge) {
      setActiveChallenge(challenge);
      setActiveDialog("details");
    }

    const timeout = setTimeout(() => setFocusedChallengeId(null), 2200);
    return () => clearTimeout(timeout);
  }, [props.focusId, challenges]);

  const openChallengeDetails = (challenge: Challenge) => {
    setParticipantsLoading(false);
    setActiveChallenge(challenge);
    setActiveDialog("details");
  };

  const closeChallengeDetails = () => {
    setActiveDialog(null);
    setActiveChallenge(null);
    setParticipantsLoading(false);
    closeAcceptDialog();
  };

  const openChallengeParticipants = async (id: string) => {
    const challenge = challenges.find((item) => item.id === id) ?? null;
    if (!challenge) {
      return;
    }

    setActiveChallenge(challenge);
    setActiveDialog("participants");
    setParticipantsLoading(true);
    try {
      await handleOpenParticipants(id);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const closeChallengeParticipants = () => {
    setActiveDialog(null);
    setActiveChallenge(null);
    setParticipantsLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: appPalette.surface.background }}>
      <ChallengesScreenHeader onCreate={openCreateChallenge} />

      <ChallengesScreenContent
        challenges={challenges}
        focusedChallengeId={focusedChallengeId}
        onCreate={openCreateChallenge}
        onEdit={openEditChallenge}
        onShare={shareChallenge}
        onSelect={openChallengeDetails}
        onAccept={handleAcceptChallenge}
        onLeave={handleLeaveChallenge}
        onOpenLink={openChallengeLink}
        onOpenParticipants={openChallengeParticipants}
        onReport={openCheckInDialog}
      />

      <ChallengesScreenDialogs
        acceptChallenge={activeDialog === "details" ? activeChallenge : null}
        reportsChallenge={activeDialog === "participants" ? activeChallenge : null}
        reportsDialogOpen={activeDialog === "participants"}
        acceptDialogOpen={activeDialog === "details"}
        reportsLoading={participantsLoading}
        participants={participants}
        reports={reports}
        paymentDialogOpen={paymentDialogOpen}
        challengeDialogOpen={challengeDialogOpen}
        editingChallenge={editingChallenge}
        goals={goals}
        onCloseReports={closeChallengeParticipants}
        onCloseAcceptDialog={closeChallengeDetails}
        onSetPaymentDialogOpen={setPaymentDialogOpen}
        onCloseChallengeDialog={closeChallengeDialog}
        onDownloadReport={downloadChallengeReport}
        onKickParticipant={handleKickParticipant}
        onSaveChallenge={saveChallenge}
        onAcceptChallenge={handleAcceptChallenge}
        onShareChallenge={shareChallenge}
        onSelectPaymentMethod={selectPaymentMethod}
        personalJoinChallenge={personalJoinChallenge}
        checkInChallenge={checkInChallenge}
        onClosePersonalJoin={closePersonalJoinDialog}
        onJoinWithPersonalGoal={joinWithPersonalGoal}
        onCloseCheckIn={closeCheckInDialog}
      />
    </View>
  );
}
