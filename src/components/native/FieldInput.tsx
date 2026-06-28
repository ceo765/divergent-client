import { Text, TextInput, View } from "react-native";

import { appPalette } from "@/theme/palette";

export function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  editable = true,
  keyboardType,
  autoCapitalize = "none",
  autoComplete,
  textContentType,
  multiline = false,
  numberOfLines,
  maxLength,
}: {
  label?: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  editable?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "url";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?:
    | "off"
    | "email"
    | "name"
    | "password"
    | "username"
    | "current-password"
    | "new-password";
  textContentType?:
    | "none"
    | "emailAddress"
    | "name"
    | "password"
    | "username"
    | "newPassword"
    | "password";
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
}) {
  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={{ fontSize: 14, fontWeight: "600", color: appPalette.semantic.text }}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        editable={editable}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        keyboardType={keyboardType}
        autoCorrect={false}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          borderWidth: 1,
          borderColor: appPalette.semantic.borderStrong,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          minHeight: multiline ? 104 : undefined,
          backgroundColor: editable ? appPalette.surface.background : appPalette.ui.inputBackground,
          color: appPalette.semantic.textStrong,
        }}
        placeholderTextColor={appPalette.semantic.textSubtle}
      />
    </View>
  );
}
