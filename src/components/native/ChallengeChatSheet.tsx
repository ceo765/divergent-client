import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { ActionChip } from "@/components/native/ActionChip";
import { FieldInput } from "@/components/native/FieldInput";
import { FormSheetLayout } from "@/components/native/form-sheet/Layout";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { getChallengeMessages, sendChallengeMessage } from "@/shared/api/client";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";
import type { Challenge, ChallengeGroupMessage } from "@/types";

export function ChallengeChatSheet({ challenge, open, onOpenChange }: { challenge: Challenge; open: boolean; onOpenChange: (open: boolean) => void }) {
  const userId = useAppStore((state) => state.user?.id);
  const [messages, setMessages] = useState<ChallengeGroupMessage[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    const load = async () => {
      try { const next = await getChallengeMessages(challenge.id); if (active) setMessages(next); }
      catch { if (active) setError("Не удалось загрузить чат."); }
    };
    setError("");
    void load();
    const interval = setInterval(() => void load(), 5000);
    return () => { active = false; clearInterval(interval); };
  }, [challenge.id, open]);

  const send = async () => {
    const value = content.trim();
    if (!value || sending) return;
    try {
      setSending(true); setError("");
      const saved = await sendChallengeMessage(challenge.id, value);
      setMessages((current) => [...current.filter((item) => item.id !== saved.id), saved]);
      setContent("");
    } catch { setError("Не удалось отправить сообщение."); }
    finally { setSending(false); }
  };

  return (
    <FormSheetLayout open={open} onOpenChange={onOpenChange} title={`Общий чат · ${challenge.title}`} subtitle="Обсуждайте результаты и поддерживайте друг друга." footer={<ActionChip onPress={() => onOpenChange(false)}>Закрыть</ActionChip>}>
      {messages.length === 0 ? <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12 }}>Сообщений пока нет. Начните разговор.</Text> : messages.map((message) => {
        const own = message.authorId === userId;
        return <View key={message.id} style={{ alignItems: own ? "flex-end" : "flex-start" }}><SurfaceCard padding={12} gap={4}>
          {!own && <Text style={{ color: appPalette.brand.primary, fontWeight: "600", fontFamily: "Montserrat", fontSize: 12 }}>{message.author?.name || "Участник"}</Text>}
          <Text style={{ color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontSize: 12 }}>{message.content}</Text>
          <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 10 }}>{new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}</Text>
        </SurfaceCard></View>;
      })}
      <FieldInput label="Сообщение" value={content} onChangeText={setContent} multiline numberOfLines={4} maxLength={2000} placeholder="Напишите сообщение…" />
      {!!error && <Text style={{ color: appPalette.semantic.dangerText, fontFamily: "Montserrat", fontSize: 12 }}>{error}</Text>}
      <ActionChip tone="primary" disabled={!content.trim() || sending} onPress={() => void send()}>{sending ? "Отправляем…" : "Отправить"}</ActionChip>
    </FormSheetLayout>
  );
}
