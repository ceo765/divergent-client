import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getChallengePhoto } from "@/shared/api/client";
import type { ChallengeGroupMessage } from "@/types";

export function ChallengeMessagePhoto({ message }: { message: ChallengeGroupMessage }) {
  const [source, setSource] = useState("");
  const [failed, setFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!message.imageUrl) return;
    let active = true;
    let objectUrl = "";
    setSource("");
    setFailed(false);

    void getChallengePhoto(message.imageUrl)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setSource(objectUrl);
      })
      .catch(() => { if (active) setFailed(true); });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [message.imageUrl]);

  if (failed) return <p className="mb-2 text-xs opacity-80">Не удалось загрузить фото</p>;
  if (!source) return <div className="mb-2 h-24 w-40 animate-pulse rounded-lg bg-black/10" aria-label="Загружаем фото" />;

  const photoName = message.imageOriginalName || "Фото";
  return <>
    <button type="button" className="mb-2 block cursor-zoom-in overflow-hidden rounded-lg" aria-label={`Открыть фото: ${photoName}`} onClick={() => setPreviewOpen(true)}>
      <img src={source} alt={photoName} className="max-h-72 max-w-full object-contain" />
    </button>
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogContent className="max-h-[94vh] max-w-5xl overflow-auto bg-black/95 p-4">
        <DialogHeader className="sr-only">
          <DialogTitle>{photoName}</DialogTitle>
          <DialogDescription>Просмотр фотографии из чата челленджа</DialogDescription>
        </DialogHeader>
        <img src={source} alt={photoName} className="mx-auto max-h-[86vh] max-w-full object-contain" />
      </DialogContent>
    </Dialog>
  </>;
}
