import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAppStore } from "@/stores/useAppStore";
import type { ChatMessage, Goal } from "@/types";

type UseAiChatSessionArgs = {
  open: boolean;
  onDraftAdded: (goal: Goal) => void;
  initialPrompt?: string;
  category?: string | null;
};

export function useAiChatSession({ open, onDraftAdded, initialPrompt, category }: UseAiChatSessionArgs) {
  const { t } = useTranslation();
  const { chatAIStream, getChatHistory } = useAppStore();

  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [draftPendingMessageId, setDraftPendingMessageId] = useState<string | null>(null);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const allowAutoScrollRef = useRef(true);

  useEffect(() => {
    if (!open) {
      allowAutoScrollRef.current = true;
      setPrompt("");
      setHistory([]);
      setHistoryLoading(false);
      setLoading(false);
      setError(null);
      setSubmitting(false);
      setStreamingMessageId(null);
      setDraftPendingMessageId(null);
      setGenerationStartedAt(null);
      setElapsedSeconds(0);
      return;
    }

    if (initialPrompt) {
      setPrompt(initialPrompt);
    }

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const storedHistory = await getChatHistory(category);
        setHistory(storedHistory ?? []);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    void loadHistory();
  }, [open, getChatHistory, initialPrompt, category]);

  useEffect(() => {
    if (!loading || generationStartedAt == null) {
      setElapsedSeconds(0);
      return;
    }

    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - generationStartedAt) / 1000)));
    };

    updateElapsed();
    const intervalId = setInterval(updateElapsed, 1000);
    return () => clearInterval(intervalId);
  }, [generationStartedAt, loading]);

  const handleGenerate = async (promptOverride?: string) => {
    const currentPrompt = (promptOverride ?? prompt).trim();
    if (!currentPrompt) return;

    const nextStreamingMessageId = `stream-${Date.now()}`;
    allowAutoScrollRef.current = true;
    setStreamingMessageId(nextStreamingMessageId);
    setDraftPendingMessageId(null);
    if (!promptOverride) {
      setPrompt("");
    }
    setHistory((items) => [
      ...items,
      { role: "user", content: currentPrompt, isDraftAdded: false },
      {
        id: nextStreamingMessageId,
        role: "assistant",
        content: "",
        isDraftAdded: false,
      },
    ]);
    setLoading(true);
    setSubmitting(true);
    setGenerationStartedAt(Date.now());
    setElapsedSeconds(0);
    setError(null);

    try {
      const data = await chatAIStream(currentPrompt, {
        onAccepted: () => {
          setSubmitting(false);
        },
        onMessage: (content) => {
          setHistory((items) =>
            items.map((item) =>
              item.id === nextStreamingMessageId ? { ...item, content } : item
            )
          );
        },
        onDraftStatus: () => {
          setDraftPendingMessageId(nextStreamingMessageId);
        },
      }, category);

      if (data.message) {
        if (data.goalDraft) {
          allowAutoScrollRef.current = false;
        }

        setHistory((items) => {
          const finalizedMessage: ChatMessage = {
            id: data.id,
            role: "assistant",
            content: data.message,
            goalDraft: data.goalDraft ?? null,
            isDraftAdded: data.isDraftAdded,
          };

          return items.map((item) =>
            item.id === nextStreamingMessageId ? finalizedMessage : item
          );
        });
      }
    } catch {
      setHistory((items) => items.filter((item) => item.id !== nextStreamingMessageId));
      setError(t("ai.goal_response_error"));
    } finally {
      setSubmitting(false);
      setStreamingMessageId((current) => (current === nextStreamingMessageId ? null : current));
      setDraftPendingMessageId((current) => (current === nextStreamingMessageId ? null : current));
      setGenerationStartedAt(null);
      setLoading(false);
    }
  };

  const handleDraftAdded = (goal: Goal, messageId?: string) => {
    onDraftAdded(goal);

    if (!messageId) return;
    setHistory((items) =>
      items.map((item) =>
        item.id === messageId ? { ...item, isDraftAdded: true } : item
      )
    );
  };

  const resetSession = () => {
    allowAutoScrollRef.current = true;
    setPrompt("");
    setHistory([]);
    setHistoryLoading(false);
    setLoading(false);
    setError(null);
    setSubmitting(false);
    setStreamingMessageId(null);
    setDraftPendingMessageId(null);
    setGenerationStartedAt(null);
    setElapsedSeconds(0);
  };

  return {
    prompt,
    setPrompt,
    history,
    historyLoading,
    loading,
    submitting,
    error,
    streamingMessageId,
    draftPendingMessageId,
    elapsedSeconds,
    allowAutoScrollRef,
    handleGenerate,
    handleDraftAdded,
    resetSession,
  };
}
