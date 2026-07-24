import type { ReportUploadPayload } from "@/types";

export function createReportUploadBody(data: ReportUploadPayload): FormData {
  const formData = new FormData();
  const filePart =
    "name" in data.file && typeof (data.file as File).name === "string"
      ? (data.file as File)
      : new File([data.file], data.fileName, {
          type: data.mimeType || data.file.type || "application/octet-stream",
        });

  formData.append("file", filePart);
  if (data.comment) {
    formData.append("comment", data.comment);
  }

  return formData;
}

export function createChallengePhotoUploadBody(data: ReportUploadPayload): FormData {
  const formData = new FormData();
  const filePart = "name" in data.file && typeof (data.file as File).name === "string"
    ? (data.file as File)
    : new File([data.file], data.fileName, { type: data.mimeType || data.file.type || "application/octet-stream" });
  formData.append("photo", filePart);
  formData.append("content", data.comment || "");
  return formData;
}
