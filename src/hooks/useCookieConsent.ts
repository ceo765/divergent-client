import { useEffect, useState } from "react";

const COOKIE_NAME = "cookie_consent";
const COOKIE_MAX_AGE_DAYS = 365;

function readCookie(name: string): string | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: string, maxAgeDays: number) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeDays * 24 * 60 * 60}; path=/; SameSite=Lax`;
  } catch {
    // cookies недоступны - полагаемся на localStorage
  }
}

function readStoredConsent(): boolean {
  if (readCookie(COOKIE_NAME) === "1") return true;
  try {
    return window.localStorage.getItem(COOKIE_NAME) === "1";
  } catch {
    return false;
  }
}

export function useCookieConsent() {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    setAccepted(readStoredConsent());
  }, []);

  const accept = () => {
    writeCookie(COOKIE_NAME, "1", COOKIE_MAX_AGE_DAYS);
    try {
      window.localStorage.setItem(COOKIE_NAME, "1");
    } catch {
      // localStorage недоступен - куки уже выставлены
    }
    setAccepted(true);
  };

  return { showBanner: !accepted, accept };
}
