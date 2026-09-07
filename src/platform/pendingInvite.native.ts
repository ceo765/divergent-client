import * as Clipboard from "expo-clipboard";
import * as SecureStore from "expo-secure-store";

// Страница-приглашение (server/src/routes/challengeInvite.ts) перед переходом
// в App Store кладёт в буфер обмена "divergent-invite:<challengeId>". Приложение
// при первом запуске после установки проверяет буфер и ведёт юзера сразу в этот
// челлендж - деферред deep link для тех, у кого приложения ещё не было.
const CLIPBOARD_PREFIX = "divergent-invite:";
const CHECKED_FLAG_KEY = "divergent.pendingInvite.checked";

// Читаем буфер максимум один раз за установку - iOS показывает баннер разрешения
// на чтение буфера при каждом обращении, повторные проверки только раздражают.
export async function consumePendingInviteChallengeId(): Promise<string | null> {
  try {
    const alreadyChecked = await SecureStore.getItemAsync(CHECKED_FLAG_KEY);
    if (alreadyChecked) return null;

    await SecureStore.setItemAsync(CHECKED_FLAG_KEY, "1");

    const hasContent = await Clipboard.hasStringAsync();
    if (!hasContent) return null;

    const text = await Clipboard.getStringAsync();
    if (!text || !text.startsWith(CLIPBOARD_PREFIX)) return null;

    const challengeId = text.slice(CLIPBOARD_PREFIX.length).trim();
    return challengeId || null;
  } catch {
    return null;
  }
}
