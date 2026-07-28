import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, ScrollView, Text, TextInput, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";

import { AiChatSheet } from "@/components/native/AiChatSheet";
import { CircleCheck, Plus, Sparkles, Star, Target, X } from "@/components/native/icons";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";
import type { CollectionItem } from "@/types";

const DEFAULT_CATEGORIES = ["Книги", "Фильмы"];

function Stars({ value, onSet }: { value: number; onSet: (v: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onSet(n === value ? 0 : n)} hitSlop={4}>
          <Star size={16} color={n <= value ? appPalette.semantic.warningStrong : appPalette.semantic.borderSubtle} />
        </Pressable>
      ))}
    </View>
  );
}

export function CollectionsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { collections, goals, loadCollections, addCollectionItem, editCollectionItem, removeCollectionItem, sendCollectionToGoal, toggleTask } = useAppStore();
  const [extraCats, setExtraCats] = useState<string[]>([]);
  const [tab, setTab] = useState("Книги");
  const [draft, setDraft] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [pickingFor, setPickingFor] = useState<string | null>(null);

  useEffect(() => {
    if (open) void loadCollections();
  }, [open, loadCollections]);

  const categories = useMemo(() => {
    const set = new Set<string>([...DEFAULT_CATEGORIES, ...collections.map((c) => c.type), ...extraCats]);
    return Array.from(set);
  }, [collections, extraCats]);

  const items = useMemo(() => collections.filter((c) => c.type === tab), [collections, tab]);

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    void addCollectionItem({ type: tab, title });
    setDraft("");
  };

  const addCategory = () => {
    Alert.prompt?.("Новая категория", "Например: Игры, Подкасты, Курсы", (name) => {
      const cat = (name || "").trim();
      if (!cat) return;
      setExtraCats((prev) => [...prev, cat]);
      setTab(cat);
    });
  };

  const toggleDone = (item: CollectionItem) => {
    const nextDone = item.status !== "done";
    void editCollectionItem(item.id, { status: nextDone ? "done" : "planned" });
    if (item.taskId) void toggleTask(item.taskId); // синхронно отмечаем в цели
  };

  const coachPrompt = () => {
    const done = collections.filter((c) => c.status === "done");
    const byCat: Record<string, string[]> = {};
    for (const c of done) (byCat[c.type] ??= []).push(`${c.title}${c.rating ? ` (${c.rating}/5)` : ""}`);
    const parts = Object.entries(byCat).map(([cat, list]) => `${cat}: ${list.join(", ")}`);
    return `Вот что у меня в коллекциях (пройдено). ${parts.join(". ") || "-"}. Разбери мой вкус и порекомендуй, что дальше.`;
  };

  const taskGoals = goals.filter((g) => g.goalType === "TASK" && !g.archivedAt);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => onOpenChange(false)}>
      <View style={{ flex: 1, backgroundColor: appPalette.surface.overlay, justifyContent: "flex-end" }}>
        <View style={{ maxHeight: "90%", backgroundColor: appPalette.surface.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", lineHeight: 24 }}>Коллекции</Text>
            <Pressable onPress={() => onOpenChange(false)} hitSlop={8}><X size={22} color={appPalette.semantic.textMuted} /></Pressable>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {categories.map((cat) => {
              const active = tab === cat;
              return (
                <Pressable key={cat} onPress={() => setTab(cat)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: active ? appPalette.brand.primary : appPalette.semantic.borderSubtle, backgroundColor: active ? appPalette.brand.primary : appPalette.semantic.neutralSurfaceStrong }}>
                  <Text style={{ color: active ? appPalette.semantic.textInverse : appPalette.semantic.textStrong, fontSize: 12, fontWeight: "500", fontFamily: "Montserrat", lineHeight: 16 }}>{cat}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={addCategory} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", borderColor: appPalette.semantic.borderStrong, flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Plus size={13} color={appPalette.semantic.textMuted} />
              <Text style={{ color: appPalette.semantic.textMuted, fontSize: 12, fontFamily: "Montserrat", lineHeight: 16 }}>Категория</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Добавить в «${tab}»…`}
              placeholderTextColor={appPalette.semantic.textSubtle}
              onSubmitEditing={add}
              style={{ flex: 1, height: 40, borderWidth: 1, borderColor: appPalette.semantic.borderStrong, borderRadius: 12, paddingHorizontal: 12, color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontSize: 13 }}
            />
            <Pressable onPress={add} style={{ width: 44, height: 40, borderRadius: 12, backgroundColor: appPalette.brand.primary, alignItems: "center", justifyContent: "center" }}>
              <Plus size={20} color={appPalette.semantic.textInverse} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 4 }} keyboardShouldPersistTaps="handled" style={{ maxHeight: "56%" }}>
            {items.length === 0 ? (
              <Text style={{ color: appPalette.semantic.textSubtle, fontSize: 12, fontFamily: "Montserrat", lineHeight: 18, paddingVertical: 12 }}>Пусто. Добавь и отмечай, что пройдено.</Text>
            ) : (
              items.map((item) => {
                const done = item.status === "done";
                const picking = pickingFor === item.id;
                return (
                  <View key={item.id} style={{ backgroundColor: appPalette.semantic.neutralSurfaceStrong, borderRadius: 12, padding: 11, gap: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Pressable onPress={() => toggleDone(item)} hitSlop={6}>
                        <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: done ? 0 : 1.5, borderColor: appPalette.semantic.textSubtle, backgroundColor: done ? appPalette.semantic.successStrong : appPalette.surface.background, alignItems: "center", justifyContent: "center" }}>
                          {done && <CircleCheck size={15} color={appPalette.semantic.textInverse} />}
                        </View>
                      </Pressable>
                      <Text style={{ flex: 1, fontSize: 13, color: appPalette.semantic.textStrong, textDecorationLine: done ? "line-through" : "none", fontFamily: "Montserrat", lineHeight: 18 }} numberOfLines={2}>{item.title}</Text>
                      <Pressable onPress={() => void removeCollectionItem(item.id)} hitSlop={6}><X size={16} color={appPalette.semantic.textSubtle} /></Pressable>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, paddingLeft: 32 }}>
                      {done && <Stars value={item.rating ?? 0} onSet={(v) => void editCollectionItem(item.id, { rating: v || null })} />}
                      {item.taskId ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Target size={12} color={appPalette.semantic.successStrong} />
                          <Text style={{ fontSize: 11, color: appPalette.semantic.successText, fontFamily: "Montserrat" }}>в цели</Text>
                        </View>
                      ) : (
                        <Pressable onPress={() => setPickingFor(picking ? null : item.id)} style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, borderWidth: 1, borderColor: appPalette.brand.primary, paddingHorizontal: 8, paddingVertical: 4 }}>
                          <Target size={12} color={appPalette.brand.primary} />
                          <Text style={{ fontSize: 11, color: appPalette.brand.primary, fontWeight: "600", fontFamily: "Montserrat" }}>В цель</Text>
                        </Pressable>
                      )}
                    </View>
                    {picking && (
                      <View style={{ paddingLeft: 32, gap: 4 }}>
                        {taskGoals.length === 0 ? (
                          <Text style={{ fontSize: 11, color: appPalette.semantic.textSubtle, fontFamily: "Montserrat" }}>Нет целей-задач. Создай цель, напр. «Чтение».</Text>
                        ) : (
                          taskGoals.slice(0, 8).map((g) => (
                            <Pressable key={g.id} onPress={() => { setPickingFor(null); void sendCollectionToGoal(item.id, g.id); }} style={{ paddingVertical: 6 }}>
                              <Text style={{ fontSize: 12, color: appPalette.brand.primary, fontFamily: "Montserrat" }}>→ {g.title}</Text>
                            </Pressable>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          <Pressable onPress={() => setAiOpen(true)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: appPalette.semantic.infoSurface, borderRadius: 12, paddingVertical: 12 }}>
            <Sparkles size={15} color={appPalette.brand.primary} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: appPalette.brand.primary, fontFamily: "Montserrat", lineHeight: 18 }}>Рекомендация от коуча</Text>
          </Pressable>
        </View>
      </View>

      {aiOpen && <AiChatSheet open={aiOpen} onOpenChange={setAiOpen} onDraftAdded={() => {}} initialPrompt={coachPrompt()} />}
    </Modal>
  );
}
