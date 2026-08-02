// Фундамент аватара: у игрока ОДИН персонаж, который эволюционирует по уровню.
// Стадии - это заранее отрисованные кино-образы (твои 5 рендеров = 5 стадий).
// Ассеты (луп + постер) хостятся на сервере в /avatars. Позже к аватару
// привязываются артефакты/трофеи (отдельная модель).
export type AvatarDef = {
  id: string;
  name: string;
  className: string; // класс/титул стадии (Visionary, Vanguard, Ascendant…)
  minLevel: number; // с какого уровня открывается стадия
  video: string; // имя файла лупа в /avatars
  poster: string; // постер-кадр (мгновенная подложка)
  accent: string; // цвет акцента стадии
};

// Отсортированы по возрастанию minLevel. Пока 2 стадии (по мере генерации - 5+).
export const AVATAR_STAGES: AvatarDef[] = [
  { id: "techwear", name: "Neon Drifter", className: "Visionary", minLevel: 1, video: "techwear.mp4", poster: "techwear.jpg", accent: "#2f6bff" },
  { id: "athlete", name: "Iron Will", className: "Vanguard", minLevel: 20, video: "athlete.mp4", poster: "athlete.jpg", accent: "#3aa0ff" },
];

// Текущая стадия аватара для уровня игрока (авто-эволюция).
export function avatarForLevel(level: number): AvatarDef {
  for (let i = AVATAR_STAGES.length - 1; i >= 0; i--) {
    if (level >= AVATAR_STAGES[i].minLevel) return AVATAR_STAGES[i];
  }
  return AVATAR_STAGES[0];
}

// Следующая стадия (для тизера «до неё N уровней»), либо null если это финальная.
export function nextStage(level: number): AvatarDef | null {
  return AVATAR_STAGES.find((s) => s.minLevel > level) ?? null;
}

export const DEFAULT_AVATAR = AVATAR_STAGES[0];
