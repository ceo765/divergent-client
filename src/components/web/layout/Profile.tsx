import { ScrollText, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { buildAvatarPath } from "@/app/routes";
import { ExperienceBar } from "@/components/shared/ExperienceBar";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAppStore } from "@/stores/useAppStore.ts";

export function Profile() {
  const navigate = useNavigate();
  const { user, missionState } = useAppStore();
  if (!user) return null;

  const { name, level, xp, requiredXp, photoUrl } = user;

  return (
    <div className="flex items-center gap-6">
      <button
        type="button"
        aria-label="Открыть Identity Space"
        onClick={() => navigate(buildAvatarPath())}
        className="rounded-full transition-transform hover:scale-105 focus:outline-none"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        <UserAvatar name={name} level={level} avatarUrl={photoUrl} size="md" />
      </button>
      <div className="flex-1 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3>{name}</h3>
            <div className="flex items-center gap-1">
              <button aria-label="Миссии" onClick={() => navigate("/missions")} className="relative rounded p-2 hover:bg-gray-200">
                {!!missionState?.badgeCount && <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{missionState.badgeCount}</span>}
                <ScrollText size={20} color={"var(--muted-foreground)"} />
              </button>
              <button aria-label="Настройки" onClick={() => navigate("/settings")} className="rounded p-2 hover:bg-gray-200">
                <Settings size={20} color={"var(--muted-foreground)"} />
              </button>
            </div>
          </div>
        </div>
        <ExperienceBar currentXp={xp} requiredXp={requiredXp} level={level} />
      </div>
    </div>
  );
}
