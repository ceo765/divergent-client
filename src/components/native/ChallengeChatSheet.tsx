import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";

import { ActionChip } from "@/components/native/ActionChip";
import { FieldInput } from "@/components/native/FieldInput";
import { FormSheetLayout } from "@/components/native/form-sheet/Layout";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { deleteChallengeMessage, editChallengeMessage, getChallengeMessages, sendChallengeMessage } from "@/shared/api/client";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";
import type { Challenge, ChallengeGroupMessage } from "@/types";

export function ChallengeChatSheet({ challenge, open, onOpenChange }: { challenge: Challenge; open: boolean; onOpenChange: (open: boolean) => void }) {
  const userId = useAppStore((state) => state.user?.id);
  const [messages, setMessages] = useState<ChallengeGroupMessage[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [messageActionPending, setMessageActionPending] = useState(false);

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

  const replaceMessage = (next: ChallengeGroupMessage) => setMessages((current) => current.map((item) => item.id === next.id ? next : item));

  const saveEdit = async () => {
    const value = editingContent.trim();
    if (!editingId || !value || messageActionPending) return;
    try {
      setMessageActionPending(true); setError("");
      replaceMessage(await editChallengeMessage(challenge.id, editingId, value));
      setEditingId(null); setEditingContent("");
    } catch { setError("Не удалось отредактировать сообщение."); }
    finally { setMessageActionPending(false); }
  };

  const remove = (messageId: string) => Alert.alert("Удалить сообщение?", "Вместо текста останется отметка об удалении.", [
    { text: "Отмена", style: "cancel" },
    { text: "Удалить", style: "destructive", onPress: () => void (async () => {
      try { setMessageActionPending(true); setError(""); replaceMessage(await deleteChallengeMessage(challenge.id, messageId)); }
      catch { setError("Не удалось удалить сообщение."); }
      finally { setMessageActionPending(false); }
    })() },
  ]);

  return (
    <FormSheetLayout open={open} onOpenChange={onOpenChange} title={`Общий чат · ${challenge.title}`} subtitle="Обсуждайте результаты и поддерживайте друг друга." footer={<ActionChip onPress={() => onOpenChange(false)}>Закрыть</ActionChip>}>
      {messages.length === 0 ? <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 12 }}>Сообщений пока нет. Начните разговор.</Text> : messages.map((message) => {
        const own = message.authorId === userId;
        const deleted = Boolean(message.deletedAt);
        const canEdit = own && !deleted && Date.now() - new Date(message.createdAt).getTime() <= 60 * 60 * 1000;
        const canDelete = !deleted && (own || challenge.creatorId === userId);
        return <View key={message.id} style={{ alignItems: own ? "flex-end" : "flex-start" }}><SurfaceCard padding={12} gap={4}>
          <Text style={{ color: appPalette.brand.primary, fontWeight: "600", fontFamily: "Montserrat", fontSize: 12 }}>{own ? "Вы" : message.author?.name || message.authorName}</Text>
          {editingId === message.id ? <>
            <FieldInput value={editingContent} onChangeText={setEditingContent} multiline numberOfLines={3} maxLength={2000} />
            <View style={{ flexDirection: "row", gap: 8 }}><ActionChip tone="primary" disabled={!editingContent.trim() || messageActionPending} onPress={() => void saveEdit()}>Сохранить</ActionChip><ActionChip onPress={() => setEditingId(null)}>Отмена</ActionChip></View>
          </> : <Text style={{ color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontSize: 12, fontStyle: deleted ? "italic" : "normal", opacity: deleted ? 0.7 : 1 }}>{deleted ? "Сообщение удалено" : message.content}</Text>}
          <Text style={{ color: appPalette.semantic.textMuted, fontFamily: "Montserrat", fontSize: 10 }}>{new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}{message.editedAt && !deleted ? " · изменено" : ""}</Text>
          {editingId !== message.id && (canEdit || canDelete) && <View style={{ flexDirection: "row", gap: 8 }}>{canEdit && <ActionChip onPress={() => { setEditingId(message.id); setEditingContent(message.content); }}>Изменить</ActionChip>}{canDelete && <ActionChip tone="danger" disabled={messageActionPending} onPress={() => remove(message.id)}>Удалить</ActionChip>}</View>}
        </SurfaceCard></View>;
      })}
      <FieldInput label="Сообщение" value={content} onChangeText={setContent} multiline numberOfLines={4} maxLength={2000} placeholder="Напишите сообщение…" />
      {!!error && <Text style={{ color: appPalette.semantic.dangerText, fontFamily: "Montserrat", fontSize: 12 }}>{error}</Text>}
      <ActionChip tone="primary" disabled={!content.trim() || sending} onPress={() => void send()}>{sending ? "Отправляем…" : "Отправить"}</ActionChip>
    </FormSheetLayout>
  );
}
