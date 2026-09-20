import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { ActionChip } from "@/components/native/ActionChip";
import { FieldInput } from "@/components/native/FieldInput";
import { FormSheetLayout } from "@/components/native/form-sheet/Layout";
import { SurfaceCard } from "@/components/native/SurfaceCard";
import { analyzeMealPhoto, deleteMeal, fetchMeals, saveMeal } from "@/shared/api/client";
import { appPalette } from "@/theme/palette";
import type { Goal, MealsDay, NutritionItem } from "@/types";

export function todayRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return { from, to };
}

function rescale(item: NutritionItem, grams: number): NutritionItem {
  if (item.grams <= 0) return { ...item, grams };
  const k = grams / item.grams;
  const r1 = (v: number) => Math.round(v * k * 10) / 10;
  return { ...item, grams, calories: Math.round(item.calories * k), protein: r1(item.protein), fat: r1(item.fat), carbs: r1(item.carbs) };
}

const text = { fontFamily: "Montserrat" } as const;

export function NutritionSheet({ goal, open, onOpenChange, onChanged }: {
  goal: Goal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: (day: MealsDay) => void;
}) {
  const [day, setDay] = useState<MealsDay | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<NutritionItem[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState<"analyze" | "save" | null>(null);
  const [error, setError] = useState("");
  const hasResult = items.length > 0;

  const reloadDay = useCallback(async () => {
    const { from, to } = todayRange();
    const next = await fetchMeals(goal.id, from, to);
    setDay(next);
    onChanged?.(next);
  }, [goal.id, onChanged]);

  useEffect(() => {
    if (!open) return;
    setError("");
    void reloadDay().catch(() => setError("Не удалось загрузить дневник питания."));
  }, [open, reloadDay]);

  const reset = () => {
    setPhotoUri(null);
    setItems([]);
    setTitle("");
    setNote(null);
    setHint("");
  };

  const analyze = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!asset.base64) {
      setError("Не удалось прочитать фото.");
      return;
    }
    setPhotoUri(asset.uri);
    setBusy("analyze");
    setError("");
    try {
      const result = await analyzeMealPhoto({ goalId: goal.id, imageBase64: asset.base64, mimeType: asset.mimeType || "image/jpeg", hint: hint.trim() || undefined });
      setTitle(result.title);
      setItems(result.items);
      setNote(result.note ?? (result.items.length === 0 ? "Еду на фото найти не удалось. Попробуйте другой ракурс." : null));
    } catch (e) {
      setError(e instanceof Error && e.message && !e.message.startsWith("API error") ? e.message : "Не удалось распознать фото. Попробуйте ещё раз.");
    } finally {
      setBusy(null);
    }
  };

  const pick = async (source: "camera" | "library") => {
    setError("");
    const permission = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(source === "camera" ? "Разрешите доступ к камере в настройках iPhone." : "Разрешите доступ к фото в настройках iPhone.");
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.4, base64: true, exif: false };
    const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets[0]) await analyze(result.assets[0]);
  };

  const totals = useMemo(
    () => items.reduce((a, i) => ({ calories: a.calories + i.calories, protein: a.protein + i.protein, fat: a.fat + i.fat, carbs: a.carbs + i.carbs }), { calories: 0, protein: 0, fat: 0, carbs: 0 }),
    [items],
  );

  const save = async () => {
    setBusy("save");
    setError("");
    try {
      await saveMeal({ goalId: goal.id, title: title.trim() || items[0]?.name || "Приём пищи", items });
      reset();
      await reloadDay();
    } catch {
      setError("Не удалось сохранить. Попробуйте ещё раз.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteMeal(id);
      await reloadDay();
    } catch {
      setError("Не удалось удалить запись.");
    }
  };

  const target = goal.targetValue ?? 0;
  const eaten = day?.totals.calories ?? 0;

  return (
    <FormSheetLayout
      open={open}
      onOpenChange={(next) => { if (!next) reset(); onOpenChange(next); }}
      title={goal.title}
      subtitle="Сфотографируйте еду - калории и БЖУ посчитаются примерно, порции можно поправить."
      footer={<ActionChip onPress={() => { reset(); onOpenChange(false); }}>Закрыть</ActionChip>}
    >
      <SurfaceCard>
        <Text style={{ ...text, color: appPalette.semantic.textMuted, fontSize: 11 }}>Сегодня</Text>
        <Text style={{ ...text, color: appPalette.semantic.textStrong, fontSize: 22, fontWeight: "700" }}>
          {eaten} {target > 0 ? `из ${target} ` : ""}ккал
        </Text>
        <Text style={{ ...text, color: appPalette.semantic.text, fontSize: 12 }}>
          Б {Math.round(day?.totals.protein ?? 0)} · Ж {Math.round(day?.totals.fat ?? 0)} · У {Math.round(day?.totals.carbs ?? 0)} г
        </Text>
      </SurfaceCard>

      {!hasResult && (
        <>
          <FieldInput label="Подсказка (необязательно)" value={hint} onChangeText={setHint} placeholder="Напр.: 200 г риса, масло не добавлял" autoCapitalize="sentences" />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}><ActionChip tone="primary" disabled={busy !== null} onPress={() => void pick("camera")}>Сфотографировать</ActionChip></View>
            <View style={{ flex: 1 }}><ActionChip disabled={busy !== null} onPress={() => void pick("library")}>Из галереи</ActionChip></View>
          </View>
        </>
      )}

      {busy === "analyze" && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <ActivityIndicator />
          <Text style={{ ...text, color: appPalette.semantic.textMuted, fontSize: 12 }}>Распознаём блюдо…</Text>
        </View>
      )}

      {hasResult && (
        <SurfaceCard>
          {!!photoUri && <Image source={{ uri: photoUri }} style={{ width: "100%", height: 160, borderRadius: 10 }} resizeMode="cover" />}
          <FieldInput label="Название" value={title} onChangeText={setTitle} autoCapitalize="sentences" />
          {items.map((item, index) => (
            <View key={`${item.name}-${index}`} style={{ gap: 6, borderTopWidth: index ? 1 : 0, borderTopColor: appPalette.semantic.borderSubtle, paddingTop: index ? 8 : 0 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ ...text, color: appPalette.semantic.textStrong, fontWeight: "600", flex: 1 }}>{item.name}</Text>
                <Text style={{ ...text, color: appPalette.semantic.textStrong, fontWeight: "600" }}>{item.calories} ккал</Text>
              </View>
              <Text style={{ ...text, color: appPalette.semantic.textMuted, fontSize: 11 }}>Б {item.protein} · Ж {item.fat} · У {item.carbs}</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
                <View style={{ flex: 1 }}>
                  <FieldInput
                    label="Граммы"
                    value={String(item.grams)}
                    keyboardType="numeric"
                    onChangeText={(v) => {
                      const grams = Math.max(0, Math.min(5000, Number(v.replace(/[^0-9]/g, "")) || 0));
                      setItems((cur) => cur.map((it, i) => (i === index ? rescale(it, grams) : it)));
                    }}
                  />
                </View>
                <ActionChip tone="danger" onPress={() => setItems((cur) => cur.filter((_, i) => i !== index))}>Убрать</ActionChip>
              </View>
            </View>
          ))}
          <Text style={{ ...text, color: appPalette.semantic.textStrong, fontWeight: "700" }}>
            Итого: {totals.calories} ккал · Б {Math.round(totals.protein)} · Ж {Math.round(totals.fat)} · У {Math.round(totals.carbs)}
          </Text>
          {!!note && <Text style={{ ...text, color: appPalette.semantic.textMuted, fontSize: 11, lineHeight: 15 }}>{note}</Text>}
          <Text style={{ ...text, color: appPalette.semantic.textSubtle, fontSize: 10, lineHeight: 14 }}>Оценка по фото приблизительная (±20-30%).</Text>
          <ActionChip tone="primary" disabled={busy !== null} onPress={() => void save()}>{busy === "save" ? "Сохраняем…" : "Добавить в дневник"}</ActionChip>
          <ActionChip disabled={busy !== null} onPress={reset}>Отмена</ActionChip>
        </SurfaceCard>
      )}

      {!hasResult && !!note && busy === null && <Text style={{ ...text, color: appPalette.semantic.warningText, fontSize: 12 }}>{note}</Text>}
      {!!error && <Text style={{ ...text, color: appPalette.semantic.dangerText, fontSize: 12 }}>{error}</Text>}

      {(day?.meals.length ?? 0) > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={{ ...text, color: appPalette.semantic.textStrong, fontWeight: "600" }}>Съедено сегодня</Text>
          {day!.meals.map((meal) => (
            <SurfaceCard key={meal.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Text style={{ ...text, color: appPalette.semantic.textStrong, fontWeight: "600", flex: 1 }}>{meal.title}</Text>
                <Text style={{ ...text, color: appPalette.semantic.textStrong }}>{meal.calories} ккал</Text>
              </View>
              <Text style={{ ...text, color: appPalette.semantic.textMuted, fontSize: 11 }}>
                {new Date(meal.eatenAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} · Б {Math.round(meal.protein)} · Ж {Math.round(meal.fat)} · У {Math.round(meal.carbs)}
              </Text>
              <ActionChip tone="danger" onPress={() => void remove(meal.id)}>Удалить</ActionChip>
            </SurfaceCard>
          ))}
        </View>
      )}
    </FormSheetLayout>
  );
}
