import { Suspense, lazy } from "react";

import { AcceptChallengeSheet } from "@/components/native/AcceptChallengeSheet";

import type {
  Challenge,
  ChallengeInput,
  ChallengeParticipant,
  Goal,
  PaymentMethod,
  Report,
  PersonalChallengeGoalInput,
} from "@/types";

const ChallengeDetailsSheet = lazy(() =>
  import("@/components/native/ChallengeDetailsSheet").then((m) => ({ default: m.ChallengeDetailsSheet })),
);
const ChallengeFormSheet = lazy(() =>
  import("@/components/native/ChallengeFormSheet").then((m) => ({ default: m.ChallengeFormSheet })),
);
const SelectPaymentMethodSheet = lazy(() =>
  import("@/components/native/SelectPaymentMethodSheet").then((m) => ({ default: m.SelectPaymentMethodSheet })),
);
const PersonalChallengeJoinSheet = lazy(() =>
  import("@/components/native/PersonalChallengeJoinSheet").then((m) => ({ default: m.PersonalChallengeJoinSheet })),
);
const ChallengeCheckInSheet = lazy(() =>
  import("@/components/native/ChallengeCheckInSheet").then((m) => ({ default: m.ChallengeCheckInSheet })),
);
const ChallengeChatSheet = lazy(() =>
  import("@/components/native/ChallengeChatSheet").then((m) => ({ default: m.ChallengeChatSheet })),
);

function SheetFallback() {
  return null;
}

export function ChallengesScreenDialogs({
  acceptChallenge,
  reportsChallenge,
  reportsDialogOpen,
  acceptDialogOpen,
  reportsLoading,
  participants,
  reports,
  paymentDialogOpen,
  challengeDialogOpen,
  editingChallenge,
  goals,
  onCloseReports,
  onCloseAcceptDialog,
  onSetPaymentDialogOpen,
  onCloseChallengeDialog,
  onDownloadReport,
  onKickParticipant,
  onSaveChallenge,
  onAcceptChallenge,
  onShareChallenge,
  onSelectPaymentMethod,
  personalJoinChallenge,
  checkInChallenge,
  chatChallenge,
  onClosePersonalJoin,
  onJoinWithPersonalGoal,
  onCloseCheckIn,
  onCloseChat,
}: {
  acceptChallenge?: Challenge | null;
  reportsChallenge?: Challenge | null;
  reportsDialogOpen: boolean;
  acceptDialogOpen: boolean;
  reportsLoading: boolean;
  participants: ChallengeParticipant[];
  reports: Report[];
  paymentDialogOpen: boolean;
  challengeDialogOpen: boolean;
  editingChallenge?: Challenge | null;
  goals: Goal[];
  onCloseReports: () => void;
  onCloseAcceptDialog: () => void;
  onSetPaymentDialogOpen: (open: boolean) => void;
  onCloseChallengeDialog: (open: boolean) => void;
  onDownloadReport: (reportId: string) => Promise<boolean>;
  onKickParticipant: (challengeId: string, userId: string) => Promise<void>;
  onSaveChallenge: (data: ChallengeInput) => Promise<unknown>;
  onAcceptChallenge: (id: string) => Promise<{ status: "accepted" | "payment_required" | "ignored" }>;
  onShareChallenge: (id: string) => void;
  onSelectPaymentMethod: (method: PaymentMethod) => Promise<boolean>;
  personalJoinChallenge?: Challenge | null;
  checkInChallenge?: Challenge | null;
  chatChallenge?: Challenge | null;
  onClosePersonalJoin: () => void;
  onJoinWithPersonalGoal: (challenge: Challenge, goal: PersonalChallengeGoalInput) => Promise<void>;
  onCloseCheckIn: () => void;
  onCloseChat: () => void;
}) {
  const showReportsDialog = Boolean(reportsChallenge) && reportsDialogOpen;
  const showAcceptDialog = Boolean(acceptChallenge) && acceptDialogOpen && !showReportsDialog;

  return (
    <>
      <AcceptChallengeSheet
        open={showAcceptDialog}
        challenge={acceptChallenge ?? null}
        onOpenChange={(open) => {
          if (!open) {
            onCloseAcceptDialog();
          }
        }}
        onAccept={onAcceptChallenge}
        onShare={onShareChallenge}
      />

      <Suspense fallback={<SheetFallback />}>
        {reportsChallenge && showReportsDialog && (
          <ChallengeDetailsSheet
            open={showReportsDialog}
            challenge={reportsChallenge}
            loading={reportsLoading}
            participants={participants}
            reports={reports}
            onOpenChange={(open) => {
              if (!open) onCloseReports();
            }}
            onDownload={onDownloadReport}
            onKick={onKickParticipant}
          />
        )}

        {paymentDialogOpen && (
          <SelectPaymentMethodSheet
            open={paymentDialogOpen}
            onOpenChange={onSetPaymentDialogOpen}
            onSelect={onSelectPaymentMethod}
          />
        )}

        {challengeDialogOpen && (
          <ChallengeFormSheet
            open={challengeDialogOpen}
            challenge={editingChallenge ?? undefined}
            goals={goals}
            onOpenChange={onCloseChallengeDialog}
            onSave={onSaveChallenge}
          />
        )}

        {personalJoinChallenge && (
          <PersonalChallengeJoinSheet
            challenge={personalJoinChallenge}
            open
            onOpenChange={(nextOpen) => { if (!nextOpen) onClosePersonalJoin(); }}
            onJoin={onJoinWithPersonalGoal}
          />
        )}

        {checkInChallenge && (
          <ChallengeCheckInSheet challenge={checkInChallenge} open onOpenChange={(nextOpen) => { if (!nextOpen) onCloseCheckIn(); }} />
        )}

        {chatChallenge && (
          <ChallengeChatSheet challenge={chatChallenge} open onOpenChange={(nextOpen) => { if (!nextOpen) onCloseChat(); }} />
        )}
      </Suspense>
    </>
  );
}
