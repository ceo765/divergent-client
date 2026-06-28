import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getChallengeMessages, sendChallengeMessage } from "@/shared/api/client";
import { useAppStore } from "@/stores/useAppStore";
import type { Challenge, ChallengeGroupMessage } from "@/types";

export function ChallengeChatDialog({ challenge, open, onOpenChange }: { challenge: Challenge; open: boolean; onOpenChange: (open: boolean) => void }) {
  const userId = useAppStore((state) => state.user?.id);
  const [messages, setMessages] = useState<ChallengeGroupMessage[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

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
    if (!value || sending) return;
    try {
      setSending(true);
      setError("");
      const saved = await sendChallengeMessage(challenge.id, value);
      setMessages((current) => [...current.filter((item) => item.id !== saved.id), saved]);
      setContent("");
    } catch {
      setError("Не удалось отправить сообщение.");
    } finally {
      setSending(false);
    }
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
            return <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 ${own ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {!own && <p className="text-xs font-semibold">{message.author?.name || "Участник"}</p>}
                <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                <p className={`mt-1 text-[10px] ${own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}</p>
              </div>
            </div>;
          })}
        </div>
        <Textarea value={content} maxLength={2000} onChange={(event) => setContent(event.target.value)} placeholder="Напишите сообщение…" />
        {!!error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
          <Button disabled={!content.trim() || sending} onClick={() => void send()}>{sending ? "Отправляем…" : "Отправить"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
