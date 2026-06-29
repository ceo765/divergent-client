import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ChallengeMessagePhoto } from "@/components/web/challenges/ChallengeMessagePhoto";
import { deleteChallengeMessage, editChallengeMessage, getChallengeMessages, sendChallengeMessage, sendChallengePhoto } from "@/shared/api/client";
import { useAppStore } from "@/stores/useAppStore";
import type { Challenge, ChallengeGroupMessage } from "@/types";

export function ChallengeChatDialog({ challenge, open, onOpenChange }: { challenge: Challenge; open: boolean; onOpenChange: (open: boolean) => void }) {
  const userId = useAppStore((state) => state.user?.id);
  const [messages, setMessages] = useState<ChallengeGroupMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [messageActionPending, setMessageActionPending] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const load = async (initial = false) => {
      try {
        if (initial) setLoading(true);
        const next = await getChallengeMessages(challenge.id);
        if (active) setMessages(next);
      } catch {
        if (active) setError("Не удалось загрузить чат.");
      } finally {
        if (active && initial) setLoading(false);
      }
    };
    setError("");
    void load(true);
    const interval = setInterval(() => void load(), 5000);
    return () => { active = false; clearInterval(interval); };
  }, [challenge.id, open]);

  const send = async () => {
    const value = content.trim();
    if ((!value && !selectedPhoto) || sending) return;
    try {
      setSending(true);
      setError("");
      const saved = selectedPhoto
        ? await sendChallengePhoto(challenge.id, { file: selectedPhoto, fileName: selectedPhoto.name, mimeType: selectedPhoto.type, comment: value })
        : await sendChallengeMessage(challenge.id, value);
      setMessages((current) => [...current.filter((item) => item.id !== saved.id), saved]);
      setContent("");
      setSelectedPhoto(null);
    } catch {
      setError("Не удалось отправить сообщение.");
    } finally {
      setSending(false);
    }
  };

  const replaceMessage = (next: ChallengeGroupMessage) => {
    setMessages((current) => current.map((item) => item.id === next.id ? next : item));
  };

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

  const remove = async (messageId: string) => {
    if (!window.confirm("Удалить сообщение? Вместо текста останется отметка об удалении.")) return;
    try {
      setMessageActionPending(true); setError("");
      replaceMessage(await deleteChallengeMessage(challenge.id, messageId));
    } catch { setError("Не удалось удалить сообщение."); }
    finally { setMessageActionPending(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[86vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>Общий чат · {challenge.title}</DialogTitle>
          <DialogDescription>Обсуждайте результаты, задавайте вопросы и поддерживайте друг друга.</DialogDescription>
        </DialogHeader>
        <div className="min-h-48 flex-1 space-y-3 overflow-y-auto rounded-lg border p-3">
          {loading ? <p className="text-sm text-muted-foreground">Загружаем сообщения…</p> : messages.length === 0 ? <p className="text-sm text-muted-foreground">Сообщений пока нет. Начните разговор.</p> : messages.map((message) => {
            const own = message.authorId === userId;
            const deleted = Boolean(message.deletedAt);
            const canEdit = own && !deleted && Date.now() - new Date(message.createdAt).getTime() <= 60 * 60 * 1000;
            const canDelete = !deleted && (own || challenge.creatorId === userId);
            return <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 ${own ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <p className="text-xs font-semibold">{own ? "Вы" : message.author?.name || message.authorName}</p>
                {!!message.imageUrl && !deleted && <ChallengeMessagePhoto message={message} />}
                {editingId === message.id ? <div className="space-y-2">
                  <Textarea value={editingContent} maxLength={2000} onChange={(event) => setEditingContent(event.target.value)} />
                  <div className="flex gap-2"><Button size="sm" variant="secondary" disabled={!editingContent.trim() || messageActionPending} onClick={() => void saveEdit()}>Сохранить</Button><Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Отмена</Button></div>
                </div> : (deleted || message.content) ? <p className={`whitespace-pre-wrap break-words text-sm ${deleted ? "italic opacity-70" : ""}`}>{deleted ? "Сообщение удалено" : message.content}</p> : null}
                <p className={`mt-1 text-[10px] ${own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}{message.editedAt && !deleted ? " · изменено" : ""}</p>
                {editingId !== message.id && (canEdit || canDelete) && <div className="mt-1 flex gap-2">
                  {canEdit && <button className="text-[10px] underline" onClick={() => { setEditingId(message.id); setEditingContent(message.content); }}>Изменить</button>}
                  {canDelete && <button className="text-[10px] underline" disabled={messageActionPending} onClick={() => void remove(message.id)}>Удалить</button>}
                </div>}
              </div>
            </div>;
          })}
        </div>
        <Textarea value={content} maxLength={2000} onChange={(event) => setContent(event.target.value)} placeholder={selectedPhoto ? "Добавьте подпись…" : "Напишите сообщение…"} />
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            event.target.value = "";
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) { setError("Фото должно быть не больше 10 МБ."); return; }
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Поддерживаются JPEG, PNG и WebP."); return; }
            setError(""); setSelectedPhoto(file);
          }}
        />
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()}>Добавить фото</Button>
          {selectedPhoto && <><span className="truncate text-sm text-muted-foreground">{selectedPhoto.name}</span><Button type="button" size="sm" variant="ghost" onClick={() => setSelectedPhoto(null)}>Убрать</Button></>}
        </div>
        {!!error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
          <Button disabled={(!content.trim() && !selectedPhoto) || sending} onClick={() => void send()}>{sending ? "Отправляем…" : "Отправить"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
