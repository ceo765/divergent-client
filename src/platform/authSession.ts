export type AuthSessionResult =
  | { type: "success"; url: string }
  | { type: "cancel" | "dismiss" | "opened" | "locked" };

export async function openAuthSession(url: string, _redirectUrl: string): Promise<AuthSessionResult> {
  void _redirectUrl;
  if (typeof window !== "undefined") {
    window.location.assign(url);
  }

  return { type: "dismiss" };
}
