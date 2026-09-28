import "./CookieConsentBanner.css";

import { useCookieConsent } from "@/hooks/useCookieConsent";

export default function CookieConsentBanner() {
  const { showBanner, accept } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Уведомление об использовании cookie-файлов">
      <p className="cookie-banner__text">
        На информационном ресурсе применяются cookie-файлы. Оставаясь на сайте, вы подтверждаете своё{" "}
        <a className="cookie-banner__link" href="/cookie-policy">
          согласие
        </a>{" "}
        на их использование.
      </p>
      <button type="button" className="cookie-banner__button" onClick={accept}>
        Согласен
      </button>
    </div>
  );
}
