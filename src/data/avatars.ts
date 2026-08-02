// Каталог кино-аватаров. Ассеты (луп + постер) хостятся на сервере в /avatars.
// Позже станет серверным (редкости, условия открытия, «N/48»).
export type AvatarDef = {
  id: string;
  name: string;
  className: string; // класс/титул (Visionary, Дисциплина…)
  video: string; // имя файла лупа в /avatars
  poster: string; // постер-кадр (мгновенная подложка)
  accent: string; // цвет акцента (по редкости)
};

export const AVATARS: AvatarDef[] = [
  { id: "techwear", name: "Neon Drifter", className: "Visionary", video: "techwear.mp4", poster: "techwear.jpg", accent: "#2f6bff" },
  { id: "athlete", name: "Iron Will", className: "Дисциплина", video: "athlete.mp4", poster: "athlete.jpg", accent: "#3aa0ff" },
];

export const DEFAULT_AVATAR = AVATARS[0];
