import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";

import { AiChatSheet } from "@/components/native/AiChatSheet";
import { ChevronDown, CircleCheck, Clock, Sparkles } from "@/components/native/icons";
import { useTodayScreen, type TodayItem } from "@/shared/screens/today/useTodayScreen";
import { appPalette } from "@/theme/palette";

function todayLabel(): string {
  const days = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
  const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const d = new Date();
  const day = days[d.getDay()];
  return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${d.getDate()} ${months[d.getMonth()]}`;
}

function TodayRow({ item, onToggle, onOpen }: { item: TodayItem; onToggle: () => void; onOpen: () => void }) {
  const deadline = item.kind === "deadline";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: appPalette.semantic.borderSubtle }}>
      <Pressable onPress={onToggle} hitSlop={8}>
        <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: item.done ? 0 : 1.5, borderColor: deadline ? appPalette.semantic.warningStrong : appPalette.semantic.textSubtle, backgroundColor: item.done ? appPalette.semantic.successStrong : appPalette.surface.background, alignItems: "center", justifyContent: "center" }}>
          {item.done && <CircleCheck size={16} color={appPalette.semantic.textInverse} />}
        </View>
      </Pressable>
      <Pressable onPress={onOpen} style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 14, color: item.done ? appPalette.semantic.textMuted : appPalette.semantic.textStrong, textDecorationLine: item.done ? "line-through" : "none", fontFamily: "Montserrat", lineHeight: 18 }} numberOfLines={2}>{item.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          {deadline && <Clock size={11} color={appPalette.semantic.warningText} />}
          <Text style={{ fontSize: 11, color: deadline ? appPalette.semantic.warningText : appPalette.semantic.textSubtle, fontFamily: "Montserrat", lineHeight: 15 }} numberOfLines={1}>
            {deadline ? "дедлайн сегодня · " : ""}из «{item.goalTitle}»
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={onOpen} hitSlop={8}>
        <View style={{ transform: [{ rotate: "-90deg" }] }}>
          <ChevronDown size={16} color={appPalette.semantic.textMuted} />
        </View>
      </Pressable>
    </View>
  );
}

export default function NativeTodayScreen({ onOpenGoal }: { onOpenGoal: (goalId: string) => void }) {
  const { items, total, done, toggle } = useTodayScreen();
  const [aiOpen, setAiOpen] = useState(false);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: appPalette.surface.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={{ fontSize: 24, fontWeight: "700", color: appPalette.semantic.textStrong, fontFamily: "Montserrat", lineHeight: 30 }}>Сегодня</Text>
        <Text style={{ fontSize: 12, color: appPalette.semantic.textMuted, fontFamily: "Montserrat", lineHeight: 16, marginTop: 2 }}>
          {todayLabel()}{total > 0 ? ` · ${done} из ${total} сделано` : ""}
        </Text>

        {total > 0 && (
          <View style={{ height: 6, borderRadius: 3, backgroundColor: appPalette.semantic.borderSubtle, overflow: "hidden", marginTop: 14, marginBottom: 6 }}>
            <View style={{ width: `${pct}%`, height: "100%", borderRadius: 3, backgroundColor: appPalette.brand.primary }} />
          </View>
        )}

        {total === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: "center", gap: 8 }}>
            <CircleCheck size={40} color={appPalette.semantic.successStrong} />
            <Text style={{ fontSize: 14, color: appPalette.semantic.textMuted, fontFamily: "Montserrat", lineHeight: 20, textAlign: "center" }}>На сегодня задач нет.{"\n"}Создай цель с задачами - и они появятся здесь.</Text>
          </View>
        ) : (
          <View style={{ marginTop: 8 }}>
            {items.map((item) => (
              <TodayRow key={item.key} item={item} onToggle={() => void toggle(item)} onOpen={() => onOpenGoal(item.goalId)} />
            ))}
          </View>
        )}

        <Pressable
          onPress={() => setAiOpen(true)}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 18, backgroundColor: appPalette.semantic.infoSurface, borderRadius: 12, paddingVertical: 12 }}
        >
          <Sparkles size={15} color={appPalette.brand.primary} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: appPalette.brand.primary, fontFamily: "Montserrat", lineHeight: 18 }}>Спланировать день с коучем</Text>
        </Pressable>
      </ScrollView>

      {aiOpen && (
        <AiChatSheet
          open={aiOpen}
          onOpenChange={setAiOpen}
          onDraftAdded={() => {}}
          initialPrompt="Помоги спланировать мой день: посмотри мои цели и задачи и предложи, на чём сфокусироваться сегодня."
        />
      )}
    </View>
  );
}
