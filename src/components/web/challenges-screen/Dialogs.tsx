import { Suspense, lazy } from "react";

import type {
  Challenge,
  ChallengeInput,
  ChallengeParticipant,
  Goal,
  PaymentMethod,
  Report,
  PersonalChallengeGoalInput,
} from "@/types";

const AcceptChallengeDialog = lazy(() =>
  import("@/components/web/challenges/AcceptChallengeDialog").then((m) => ({ default: m.AcceptChallengeDialog })),
);
const ChallengeParticipantDialog = lazy(() =>
  import("@/components/web/challenges/ChallengeParticipantDialog").then((m) => ({ default: m.ChallengeParticipantDialog })),
);
const CreateChallengeDialog = lazy(() =>
  import("@/components/web/challenges/CreateChallengeDialog").then((m) => ({ default: m.CreateChallengeDialog })),
);
const LeaveChallengeDialog = lazy(() =>
  import("@/components/web/challenges/LeaveChallengeDialog").then((m) => ({ default: m.LeaveChallengeDialog })),
);
const SelectPaymentMethodDialog = lazy(() =>
  import("@/components/web/challenges/SelectPaymentMethodDialog").then((m) => ({ default: m.SelectPaymentMethodDialog })),
);
const PersonalChallengeJoinDialog = lazy(() =>
  import("@/components/web/challenges/PersonalChallengeJoinDialog").then((m) => ({ default: m.PersonalChallengeJoinDialog })),
);
const ChallengeCheckInDialog = lazy(() =>
  import("@/components/web/challenges/ChallengeCheckInDialog").then((m) => ({ default: m.ChallengeCheckInDialog })),
);

function DialogFallback() {
  return null;
}

export function ChallengesScreenDialogs({
  goals,
  challengeDialogOpen,
  editingChallenge,
  paymentDialogOpen,
  leaveDialogOpen,
  reportsDialogOpen,
  acceptDialogOpen,
  selectedChallenge,
  personalJoinChallenge,
  checkInChallenge,
  reports,
  participants,
  onCloseChallengeDialog,
  onSaveChallenge,
  onSetPaymentDialogOpen,
  onSelectPaymentMethod,
  onCloseAcceptDialog,
  onAcceptChallenge,
  onShareChallenge,
  onCloseReportsDialog,
  onDownloadReport,
  onKickParticipant,
  onSetLeaveDialogOpen,
  onConfirmLeave,
  onClosePersonalJoinDialog,
  onJoinWithPersonalGoal,
  onCloseCheckInDialog,
}: {
  goals: Goal[];
  challengeDialogOpen: boolean;
  editingChallenge?: Challenge | null;
  paymentDialogOpen: boolean;
  leaveDialogOpen: boolean;
  reportsDialogOpen: boolean;
  acceptDialogOpen: boolean;
  selectedChallenge?: Challenge | null;
  personalJoinChallenge?: Challenge | null;
  checkInChallenge?: Challenge | null;
  reports: Report[];
  participants: ChallengeParticipant[];
  onCloseChallengeDialog: (open: boolean) => void;
  onSaveChallenge: (data: ChallengeInput) => Promise<void>;
  onSetPaymentDialogOpen: (open: boolean) => void;
  onSelectPaymentMethod: (method: PaymentMethod) => Promise<boolean>;
  onCloseAcceptDialog: (open: boolean) => void;
  onAcceptChallenge: (id: string) => Promise<{ status: "accepted" | "payment_required" | "ignored" }>;
  onShareChallenge: (id: string) => void;
  onCloseReportsDialog: (open: boolean) => void;
  onDownloadReport: (reportId: string) => Promise<boolean>;
  onKickParticipant: (challengeId: string, userId: string) => Promise<void>;
  onSetLeaveDialogOpen: (open: boolean) => void;
  onConfirmLeave: () => Promise<void>;
  onClosePersonalJoinDialog: () => void;
  onJoinWithPersonalGoal: (challenge: Challenge, goal: PersonalChallengeGoalInput) => Promise<void>;
  onCloseCheckInDialog: () => void;
}) {
  return (
    <Suspense fallback={<DialogFallback />}>
      {challengeDialogOpen && (
        <CreateChallengeDialog
          goals={goals}
          open={challengeDialogOpen}
          onOpenChange={onCloseChallengeDialog}
          challenge={editingChallenge ?? undefined}
          onSave={onSaveChallenge}
        />
      )}

      {paymentDialogOpen && (
        <SelectPaymentMethodDialog
          open={paymentDialogOpen}
          onOpenChange={onSetPaymentDialogOpen}
          onSelect={onSelectPaymentMethod}
        />
      )}

      {selectedChallenge && acceptDialogOpen && (
        <AcceptChallengeDialog
          challenge={selectedChallenge}
          isOpen={acceptDialogOpen}
          onOpenChange={onCloseAcceptDialog}
          onAccept={onAcceptChallenge}
          onShare={onShareChallenge}
        />
      )}

      {personalJoinChallenge && (
        <PersonalChallengeJoinDialog
          challenge={personalJoinChallenge}
          open
          onOpenChange={(nextOpen) => { if (!nextOpen) onClosePersonalJoinDialog(); }}
          onJoin={onJoinWithPersonalGoal}
        />
      )}

      {checkInChallenge && (
        <ChallengeCheckInDialog challenge={checkInChallenge} open onOpenChange={(nextOpen) => { if (!nextOpen) onCloseCheckInDialog(); }} />
      )}

      {selectedChallenge && reportsDialogOpen && (
        <ChallengeParticipantDialog
          challenge={selectedChallenge}
          reports={reports}
          isOpen={reportsDialogOpen}
          onOpenChange={onCloseReportsDialog}
          onDownload={onDownloadReport}
          onKick={onKickParticipant}
          participants={participants}
        />
      )}

      {leaveDialogOpen && (
        <LeaveChallengeDialog
          open={leaveDialogOpen}
          onOpenChange={onSetLeaveDialogOpen}
          onConfirm={onConfirmLeave}
        />
      )}
    </Suspense>
  );
}
