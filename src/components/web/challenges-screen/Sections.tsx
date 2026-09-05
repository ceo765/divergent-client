import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ChallengeCard } from "@/components/web/challenges/ChallengeCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Challenge } from "@/types";

export function ChallengesScreenHeader({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between py-2">
      <h2>{t("challenges.title")}</h2>

      <Button onClick={onCreate}>
        <Plus className="mr-2 size-4" />
        {t("challenges.create")}
      </Button>
    </div>
  );
}

export function ChallengesScreenContent({
  challenges,
  focusId,
  onCreate,
  onEdit,
  onShare,
  onSelect,
  onLeave,
  onDelete,
  onOpenLink,
  onOpenParticipants,
  onAccept,
  onReport,
  onChat,
}: {
  challenges: Challenge[];
  focusId?: string | null;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onShare: (id: string) => void;
  onSelect: (challenge: Challenge) => void;
  onLeave: (id: string) => void;
  onDelete: (id: string) => Promise<void> | void;
  onOpenLink: (id: string) => void;
  onOpenParticipants: (id: string) => Promise<boolean>;
  onAccept: (id: string) => Promise<{ status: "accepted" | "payment_required" | "ignored" }>;
  onReport: (id: string) => void;
  onChat: (id: string) => void;
}) {
  const { t } = useTranslation();

  if (challenges.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="mb-4 text-muted-foreground">{t("challenges.empty")}</p>
          <Button onClick={onCreate}>
            <Plus className="mr-2 size-4" />
            {t("challenges.create_first")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="columns-1 gap-2 sm:columns-2 lg:columns-3 xl:columns-4">
      {challenges.map((challenge) => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          focused={challenge.id === focusId}
          onEdit={onEdit}
          onShare={onShare}
          onSelect={onSelect}
          onLeave={onLeave}
          onDelete={onDelete}
          onOpenLink={onOpenLink}
          onOpenParticipants={onOpenParticipants}
          onAccept={onAccept}
          onReport={onReport}
          onChat={onChat}
        />
      ))}
    </div>
  );
}
