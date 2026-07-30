import dayjs from "dayjs";

// Короткие русские подписи (getDay(): 0=вс). Именительный падеж, этого хватает для чипов.
const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export type ReminderLead = "1h" | "3h" | "eve";

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// Список из n дат, начиная с сегодня (локальная полночь).
export function nextDays(n: number): Date[] {
  const start = dayjs().startOf("day");
  return Array.from({ length: n }, (_, i) => start.add(i, "day").toDate());
}

// Подпись чипа дня: Сегодня / Завтра / «пн 4».
export function dayChipLabel(d: Date): string {
  const diff = dayjs(d).startOf("day").diff(dayjs().startOf("day"), "day");
  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Завтра";
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}`;
}

// Полная подпись события: «пн 4 авг, 19:00».
export function formatEventWhen(iso: string): string {
  const d = new Date(iso);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayjs(a).isSame(dayjs(b), "day");
}

// Собрать дату+время из выбранного дня и строки «ЧЧ:ММ».
export function combineDayTime(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  const d = new Date(day);
  d.setHours(Number.isFinite(h) ? h : 19, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

// Когда напомнить: за 1ч / за 3ч / накануне в 20:00.
export function reminderFromEvent(event: Date, lead: ReminderLead): Date {
  const d = new Date(event);
  if (lead === "1h") d.setHours(d.getHours() - 1);
  else if (lead === "3h") d.setHours(d.getHours() - 3);
  else {
    d.setDate(d.getDate() - 1);
    d.setHours(20, 0, 0, 0);
  }
  return d;
}

// Событие ещё не прошло (в пределах 12ч после начала считаем «сегодняшним»).
export function isUpcoming(iso?: string | null): boolean {
  if (!iso) return true;
  return new Date(iso).getTime() >= Date.now() - 12 * 60 * 60 * 1000;
}

// Сортировка событий: ближайшие сверху, без даты — в конец.
export function byEventDate(a: { eventDate?: string | null }, b: { eventDate?: string | null }): number {
  const ta = a.eventDate ? new Date(a.eventDate).getTime() : Number.POSITIVE_INFINITY;
  const tb = b.eventDate ? new Date(b.eventDate).getTime() : Number.POSITIVE_INFINITY;
  return ta - tb;
}
