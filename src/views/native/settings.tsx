import { ScrollView, Text, View } from "react-native";
import { HapticPressable as Pressable } from "@/components/native/HapticPressable";
import { useTranslation } from "react-i18next";

import { Bell, Crown } from "@/components/native/icons";
import { ScreenHeader } from "@/components/native/ScreenHeader";
import {
  CredentialsSection,
  DeleteAccountSection,
  handleSettingsSubmit,
  LanguageSection,
  ProfileSection,
  SignOutSection,
  TimeZoneSection,
} from "@/components/native/settings-screen/Sections";
import { useSettingsScreen } from "@/shared/screens/settings/useSettingsScreen";
import { appPalette } from "@/theme/palette";

export default function NativeSettingsScreen({
  onOpenReminders,
  onOpenSubscription,
}: {
  onOpenReminders?: () => void;
  onOpenSubscription?: () => void;
}) {
  const { t } = useTranslation();
  const {
    user,
    formData,
    error,
    success,
    isSubmitting,
    isSavingProfile,
    isDeletingAccount,
    hasPassword,
    credentialsTitle,
    deviceTimeZone,
    language,
    timeZone,
    setField,
    submitCredentials,
    changeLanguage,
    changeTimeZone,
    removeAccount,
    signOut,
  } = useSettingsScreen();

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: appPalette.surface.background }}>
      <ScreenHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 8, gap: 8 }}>
        <ProfileSection user={user} />
        <Pressable
          onPress={onOpenSubscription}
          style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: appPalette.semantic.borderSubtle, borderRadius: 12, padding: 14, backgroundColor: appPalette.surface.card }}
        >
          <Crown size={20} color={appPalette.brand.primary} />
          <Text style={{ flex: 1, fontSize: 14, fontWeight: "500", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>
            {user.subscription?.hasChallengesAccess ? "Подписка Premium" : "Divergent Premium"}
          </Text>
          <Text style={{ fontSize: 20, color: appPalette.semantic.textMuted }}>›</Text>
        </Pressable>
        <Pressable
          onPress={onOpenReminders}
          style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: appPalette.semantic.borderSubtle, borderRadius: 12, padding: 14, backgroundColor: appPalette.surface.card }}
        >
          <Bell size={20} color={appPalette.brand.primary} />
          <Text style={{ flex: 1, fontSize: 14, fontWeight: "500", color: appPalette.semantic.textStrong, fontFamily: "Montserrat" }}>{t("navigation.reminders")}</Text>
          <Text style={{ fontSize: 20, color: appPalette.semantic.textMuted }}>›</Text>
        </Pressable>
        <LanguageSection
          language={language}
          isSavingProfile={isSavingProfile}
          onChangeLanguage={(nextLanguage) => {
            void changeLanguage(nextLanguage);
          }}
        />
        <TimeZoneSection
          timeZone={timeZone}
          deviceTimeZone={deviceTimeZone}
          onUseDeviceTimeZone={() => {
            void changeTimeZone(deviceTimeZone);
          }}
        />
        <CredentialsSection
          title={credentialsTitle}
          formData={formData}
          hasPassword={hasPassword}
          error={error}
          success={success}
          isSubmitting={isSubmitting}
          onSetField={setField}
          onSubmit={() => handleSettingsSubmit(submitCredentials, hasPassword, t)}
        />
        <SignOutSection
          onSignOut={async () => {
            await signOut();
          }}
        />
        <DeleteAccountSection
          isDeletingAccount={isDeletingAccount}
          onDeleteAccount={removeAccount}
        />
      </ScrollView>
    </View>
  );
}
