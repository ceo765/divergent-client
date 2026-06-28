import { useSearchParams } from "react-router-dom";
import { buildChallengeShareUrl } from "@/platform/appUrl";
import { openExternalLink, shareLink } from "@/platform/browser";
import { ChallengesScreenDialogs } from "@/components/web/challenges-screen/Dialogs";
import {
  ChallengesScreenContent,
  ChallengesScreenHeader,
} from "@/components/web/challenges-screen/Sections";
import { useChallengesScreen } from "@/shared/screens/challenges/useChallengesScreen";

export default function ChallengesScreen() {
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("id");
  const paymentId = searchParams.get("paymentId");

  const {
    challenges,
    goals,
    reports,
    participants,
    challengeDialogOpen,
    editingChallenge,
    paymentDialogOpen,
    leaveDialogOpen,
    reportsDialogOpen,
    acceptDialogOpen,
    selectedChallenge,
    personalJoinChallenge,
    checkInChallenge,
    setPaymentDialogOpen,
    setLeaveDialogOpen,
    openCreateChallenge,
    openEditChallenge,
    saveChallenge,
    closeChallengeDialog,
    shareChallenge,
    prepareLeaveChallenge,
    confirmLeaveChallenge,
    closeAcceptDialog,
    selectChallenge,
    openParticipants,
    downloadChallengeReport,
    closeReportsDialog,
    acceptSelectedChallenge,
    joinWithPersonalGoal,
    closePersonalJoinDialog,
    openCheckInDialog,
    closeCheckInDialog,
    selectPaymentMethod,
    kickChallengeParticipant,
    openChallengeLink,
  } = useChallengesScreen({
    focusId,
    paymentId,
    onShareChallenge: (id) => {
      const url = buildChallengeShareUrl(id);
      void shareLink(url);
    },
    onOpenLink: openExternalLink,
  });

  const handleSaveChallenge = async (...args: Parameters<typeof saveChallenge>): Promise<void> => {
    await saveChallenge(...args);
  };

  const handleConfirmLeave = async (): Promise<void> => {
    await confirmLeaveChallenge();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col px-2">
      <ChallengesScreenHeader onCreate={openCreateChallenge} />

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <ChallengesScreenContent
          challenges={challenges}
          focusId={focusId}
          onCreate={openCreateChallenge}
          onEdit={openEditChallenge}
          onShare={shareChallenge}
          onSelect={selectChallenge}
          onLeave={prepareLeaveChallenge}
          onOpenLink={openChallengeLink}
          onOpenParticipants={openParticipants}
          onAccept={acceptSelectedChallenge}
          onReport={openCheckInDialog}
        />
      </div>

      <ChallengesScreenDialogs
        goals={goals}
        challengeDialogOpen={challengeDialogOpen}
        editingChallenge={editingChallenge}
        paymentDialogOpen={paymentDialogOpen}
        leaveDialogOpen={leaveDialogOpen}
        reportsDialogOpen={reportsDialogOpen}
        acceptDialogOpen={acceptDialogOpen}
        selectedChallenge={selectedChallenge}
        personalJoinChallenge={personalJoinChallenge}
        checkInChallenge={checkInChallenge}
        reports={reports}
        participants={participants}
        onCloseChallengeDialog={closeChallengeDialog}
        onSaveChallenge={handleSaveChallenge}
        onSetPaymentDialogOpen={setPaymentDialogOpen}
        onSelectPaymentMethod={selectPaymentMethod}
        onCloseAcceptDialog={closeAcceptDialog}
        onAcceptChallenge={acceptSelectedChallenge}
        onJoinWithPersonalGoal={joinWithPersonalGoal}
        onClosePersonalJoinDialog={closePersonalJoinDialog}
        onCloseCheckInDialog={closeCheckInDialog}
        onShareChallenge={shareChallenge}
        onCloseReportsDialog={closeReportsDialog}
        onDownloadReport={downloadChallengeReport}
        onKickParticipant={kickChallengeParticipant}
        onSetLeaveDialogOpen={setLeaveDialogOpen}
        onConfirmLeave={handleConfirmLeave}
      />
    </div>
  );
}
