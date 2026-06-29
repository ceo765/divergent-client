import type { ReportUploadPayload } from "@/types";

export async function pickChallengePhoto(): Promise<ReportUploadPayload | null> {
  const documentPicker = await import("expo-document-picker");
  const result = await documentPicker.getDocumentAsync({
    type: "image/*",
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  if (asset.size && asset.size > 10 * 1024 * 1024) throw new Error("PHOTO_TOO_LARGE");
  if (asset.mimeType && !["image/jpeg", "image/png", "image/webp"].includes(asset.mimeType)) {
    throw new Error("PHOTO_TYPE_UNSUPPORTED");
  }
  const response = await fetch(asset.uri);
  const file = Object.assign(await response.blob(), { uri: asset.uri });
  return {
    file,
    fileName: asset.name || "photo",
    mimeType: asset.mimeType || file.type || "application/octet-stream",
  };
}
