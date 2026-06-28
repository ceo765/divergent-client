import { useEffect, useState } from "react";

import { useAppStore } from "@/stores/useAppStore";
import type { Challenge, ChallengeParticipant, PaymentMethod, Report } from "@/types";
import type { ChallengeInput } from "@/types";

export function useChallengesScreen(options: {
  focusId?: string | null;
  paymentId?: string | null;
  onShareChallenge?: (id: string) => void;
  onOpenLink?: (url: string) => void;
} = {}) {
  const {
    challenges,
    goals,
    addChallenge,
    updateChallenge,
    acceptChallenge,
    joinChallengeWithPersonalGoal,
    leaveChallenge,
    payChallenge,
    getReports,
    getParticipants,
    kickParticipant,
    downloadReport,
    syncPaymentStatus,
  } = useAppStore();

  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | undefined>();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentChallenge, setPaymentChallenge] = useState<Challenge | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [reportsDialogOpen, setReportsDialogOpen] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | undefined>();
  const [personalJoinChallenge, setPersonalJoinChallenge] = useState<Challenge | null>(null);
  const [checkInChallenge, setCheckInChallenge] = useState<Challenge | null>(null);
  const [chatChallenge, setChatChallenge] = useState<Challenge | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [paymentSyncStatus, setPaymentSyncStatus] = useState<{
    paymentId: string;
    status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  } | null>(null);

  const openCreateChallenge = () => {
    setEditingChallenge(undefined);
    setChallengeDialogOpen(true);
  };

  const openEditChallenge = (id: string) => {
    const challenge = challenges.find((item) => item.id === id);
    setEditingChallenge(challenge);
    setChallengeDialogOpen(true);
  };

  const saveChallenge = async (data: ChallengeInput) => {
    if (editingChallenge) {
      await updateChallenge(data);
      return { status: "updated" as const, challengeId: data.id };
    }

    await addChallenge(data);
    return { status: "created" as const, challengeId: data.id };
  };

  const closeChallengeDialog = (open: boolean) => {
    setChallengeDialogOpen(open);
    if (!open) {
      setEditingChallenge(undefined);
    }
  };

  const shareChallenge = (id: string) => {
    options.onShareChallenge?.(id);
  };

  const prepareLeaveChallenge = (id: string) => {
    const challenge = challenges.find((item) => item.id === id);
    if (!challenge) {
      return;
    }

    setSelectedChallenge(challenge);
    setLeaveDialogOpen(true);
  };

  const confirmLeaveChallenge = async () => {
    if (!selectedChallenge) {
      return false;
    }

    await leaveChallenge(selectedChallenge.id);
    setLeaveDialogOpen(false);
    setSelectedChallenge(undefined);
    return true;
  };

  const selectChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setAcceptDialogOpen(true);
  };

  const closeAcceptDialog = () => {
    setSelectedChallenge(undefined);
    setAcceptDialogOpen(false);
  };

  const loadParticipantsData = async (id: string) => {
    const challenge = challenges.find((item) => item.id === id);
    if (!challenge) {
      return null;
    }

    const nextReports = await getReports(challenge.id);
    const nextParticipants = await getParticipants(challenge.id);

    setReports(nextReports);
    setParticipants(nextParticipants);

    return {
      challenge,
      reports: nextReports,
      participants: nextParticipants,
    };
  };

  const openParticipants = async (id: string) => {
    const loaded = await loadParticipantsData(id);
    if (!loaded) {
      return false;
    }

    setSelectedChallenge(loaded.challenge);
    setReportsDialogOpen(true);
    return true;
  };

  const downloadChallengeReport = async (reportId: string) => {
    if (!selectedChallenge) {
      return false;
    }

    const report = reports.find((item) => item.id === reportId);
    if (!report) {
      return false;
    }

    await downloadReport(report);
    return true;
  };

  const closeReportsDialog = () => {
    setSelectedChallenge(undefined);
    setReportsDialogOpen(false);
  };

  const acceptSelectedChallenge = async (id: string) => {
    const challenge = challenges.find((item) => item.id === id);
    if (!challenge) {
      return { status: "ignored" as const };
    }

    if (challenge.price && challenge.price > 0) {
      setPaymentChallenge(challenge);
      setPaymentDialogOpen(true);
      return { status: "payment_required" as const, challengeId: challenge.id };
    }

    if (challenge.personalGoalsEnabled) {
      setAcceptDialogOpen(false);
      setPersonalJoinChallenge(challenge);
      return { status: "ignored" as const, challengeId: challenge.id };
    }

    await acceptChallenge(challenge);
    return { status: "accepted" as const, challengeId: challenge.id };
  };

  const joinWithPersonalGoal = async (
    challenge: Challenge,
    goal: Parameters<typeof joinChallengeWithPersonalGoal>[1],
  ) => {
    await joinChallengeWithPersonalGoal(challenge, goal);
    setPersonalJoinChallenge(null);
  };

  const selectPaymentMethod = async (method: PaymentMethod) => {
    if (!paymentChallenge) {
      return false;
    }

    await payChallenge(paymentChallenge, method);
    setPaymentDialogOpen(false);
    setPaymentChallenge(null);
    return true;
  };

  const kickChallengeParticipant = async (challengeId: string, userId: string) => {
    await kickParticipant(challengeId, userId);
    const nextParticipants = await getParticipants(challengeId);
    setParticipants(nextParticipants);
  };

  const openChallengeLink = (id: string) => {
    const challenge = challenges.find((item) => item.id === id);
    if (challenge?.link) {
      options.onOpenLink?.(challenge.link);
    }
  };

  useEffect(() => {
    if (!options.focusId || options.paymentId) {
      return;
    }

    const challenge = challenges.find((item) => item.id === options.focusId);
    if (challenge) {
      selectChallenge(challenge);
    }
  }, [options.focusId, options.paymentId, challenges]);

  useEffect(() => {
    if (!options.paymentId) {
      return;
    }

    void (async () => {
      const status = await syncPaymentStatus(options.paymentId!);
      setPaymentSyncStatus({
        paymentId: options.paymentId!,
        status,
      });
    })();
  }, [options.paymentId, syncPaymentStatus]);

  return {
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
    chatChallenge,
    paymentSyncStatus,
    setPaymentDialogOpen,
    setLeaveDialogOpen,
    openCreateChallenge,
    openEditChallenge,
    saveChallenge,
    closeChallengeDialog,
    shareChallenge,
    prepareLeaveChallenge,
    confirmLeaveChallenge,
    selectChallenge,
    closeAcceptDialog,
    loadParticipantsData,
    openParticipants,
    downloadChallengeReport,
    closeReportsDialog,
    acceptSelectedChallenge,
    joinWithPersonalGoal,
    closePersonalJoinDialog: () => setPersonalJoinChallenge(null),
    openCheckInDialog: (id: string) => setCheckInChallenge(challenges.find((item) => item.id === id) ?? null),
    closeCheckInDialog: () => setCheckInChallenge(null),
    openChatDialog: (id: string) => setChatChallenge(challenges.find((item) => item.id === id) ?? null),
    closeChatDialog: () => setChatChallenge(null),
    selectPaymentMethod,
    kickChallengeParticipant,
    openChallengeLink,
    clearPaymentSyncStatus: () => setPaymentSyncStatus(null),
  };
}
