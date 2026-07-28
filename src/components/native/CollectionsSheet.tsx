import { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, Text, TextInput, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";

import { AiChatSheet } from "@/components/native/AiChatSheet";
import { CircleCheck, Plus, Sparkles, Star, X } from "@/components/native/icons";
import { useAppStore } from "@/stores/useAppStore";
import { appPalette } from "@/theme/palette";
import type { CollectionItem } from "@/types";

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
  const { collections, loadCollections, addCollectionItem, editCollectionItem, removeCollectionItem } = useAppStore();
  const [tab, setTab] = useState<"book" | "film">("book");
  const [draft, setDraft] = useState("");
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (open) void loadCollections();
  }, [open, loadCollections]);

  const items = useMemo(() => collections.filter((c) => c.type === tab), [collections, tab]);

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    void addCollectionItem({ type: tab, title });
    setDraft("");
  };

  const coachPrompt = () => {
    const done = collections.filter((c) => c.status === "done");
    const books = done.filter((c) => c.type === "book").map((c) => `${c.title}${c.rating ? ` (${c.rating}/5)` : ""}`);
    const films = done.filter((c) => c.type === "film").map((c) => `${c.title}${c.rating ? ` (${c.rating}/5)` : ""}`);
    return `Вот что я прочитал и посмотрел. Книги: ${books.join(", ") || "-"}. Фильмы: ${films.join(", ") || "-"}. Разбери мой вкус и порекомендуй, что почитать и посмотреть дальше.`;
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={() => onOpenChange(false)}>
      <View style={{ flex: 1, backgroundColor: appPalette.surface.overlay, justifyContent: "flex-end" }}>
        <View style={{ maxHeight: "90%", backgroundColor: appPalette.surface.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", lineHeight: 24 }}>Коллекции</Text>
            <Pressable onPress={() => onOpenChange(false)} hitSlop={8}><X size={22} color={appPalette.semantic.textMuted} /></Pressable>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["book", "film"] as const).map((tk) => {
              const active = tab === tk;
              return (
                <Pressable key={tk} onPress={() => setTab(tk)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: active ? appPalette.brand.primary : appPalette.semantic.borderSubtle, backgroundColor: active ? appPalette.brand.primary : appPalette.semantic.neutralSurfaceStrong }}>
                  <Text style={{ color: active ? appPalette.semantic.textInverse : appPalette.semantic.textStrong, fontSize: 12, fontWeight: "500", fontFamily: "Montserrat", lineHeight: 16 }}>{tk === "book" ? "Книги" : "Фильмы"}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={tab === "book" ? "Название книги…" : "Название фильма…"}
              placeholderTextColor={appPalette.semantic.textSubtle}
              onSubmitEditing={add}
              style={{ flex: 1, height: 40, borderWidth: 1, borderColor: appPalette.semantic.borderStrong, borderRadius: 12, paddingHorizontal: 12, color: appPalette.semantic.textStrong, fontFamily: "Montserrat", fontSize: 13 }}
            />
            <Pressable onPress={add} style={{ width: 44, height: 40, borderRadius: 12, backgroundColor: appPalette.brand.primary, alignItems: "center", justifyContent: "center" }}>
              <Plus size={20} color={appPalette.semantic.textInverse} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 4 }} keyboardShouldPersistTaps="handled" style={{ maxHeight: "58%" }}>
            {items.length === 0 ? (
              <Text style={{ color: appPalette.semantic.textSubtle, fontSize: 12, fontFamily: "Montserrat", lineHeight: 18, paddingVertical: 12 }}>Пусто. Добавь {tab === "book" ? "книгу" : "фильм"} - и отмечай, что прочитал/посмотрел.</Text>
            ) : (
              items.map((item: CollectionItem) => {
                const done = item.status === "done";
                return (
                  <View key={item.id} style={{ backgroundColor: appPalette.semantic.neutralSurfaceStrong, borderRadius: 12, padding: 11, gap: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Pressable onPress={() => void editCollectionItem(item.id, { status: done ? "planned" : "done" })} hitSlop={6}>
                        <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: done ? 0 : 1.5, borderColor: appPalette.semantic.textSubtle, backgroundColor: done ? appPalette.semantic.successStrong : appPalette.surface.background, alignItems: "center", justifyContent: "center" }}>
                          {done && <CircleCheck size={15} color={appPalette.semantic.textInverse} />}
                        </View>
                      </Pressable>
                      <Text style={{ flex: 1, fontSize: 13, color: appPalette.semantic.textStrong, textDecorationLine: done ? "line-through" : "none", fontFamily: "Montserrat", lineHeight: 18 }} numberOfLines={2}>{item.title}</Text>
                      <Pressable onPress={() => void removeCollectionItem(item.id)} hitSlop={6}><X size={16} color={appPalette.semantic.textSubtle} /></Pressable>
                    </View>
                    {done && (
                      <View style={{ paddingLeft: 32 }}>
                        <Stars value={item.rating ?? 0} onSet={(v) => void editCollectionItem(item.id, { rating: v || null })} />
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
