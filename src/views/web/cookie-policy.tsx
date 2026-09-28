import "./public-pages.css";

const supportEmail = "support@divergentclub.ru";

export default function CookiePolicyView() {
  return (
    <main className="public-page">
      <div className="public-page__shell">
        <section className="public-page__hero public-page__hero--single">
          <div className="public-page__hero-card">
            <span className="public-page__eyebrow">Cookie Policy</span>
            <h1 className="public-page__title">Политика использования cookie-файлов</h1>
            <p className="public-page__lead">
              Эта страница объясняет, зачем сайт divergentclub.ru использует cookie-файлы и как ими
              можно управлять.
            </p>
          </div>
        </section>

        <section className="public-page__content">
          <div className="public-page__section">
            <h2>1. Что такое cookie-файлы</h2>
            <p>
              Сайт divergentclub.ru использует cookie-файлы - небольшие текстовые файлы, которые
              сохраняются в браузере при посещении сайта.
            </p>
          </div>

          <div className="public-page__section">
            <h2>2. Зачем используются cookie-файлы</h2>
            <ul className="public-page__bullets">
              <li>чтобы сайт работал корректно: вход в аккаунт, сохранение настроек;</li>
              <li>для анализа посещаемости и улучшения сервиса.</li>
            </ul>
          </div>

          <div className="public-page__section">
            <h2>3. Какие данные обрабатываются</h2>
            <p>
              Технические данные о посещении: IP-адрес, тип браузера и устройства, посещённые
              страницы, время визита. Данные обрабатываются в обобщённом виде.
            </p>
          </div>

          <div className="public-page__section">
            <h2>4. Согласие</h2>
            <p>
              Оставаясь на сайте и нажимая «Согласен» в уведомлении о cookie-файлах, вы соглашаетесь
              на обработку cookie-файлов в целях, описанных выше.
            </p>
          </div>

          <div className="public-page__section">
            <h2>5. Отключение cookie-файлов</h2>
            <p>
              Отключить cookie-файлы можно в настройках браузера. В этом случае часть функций сайта
              может работать некорректно.
            </p>
          </div>

          <div className="public-page__section">
            <h2>6. Оператор</h2>
            <p>
              Вопросы по этой политике можно направить по email{" "}
              <a className="public-page__link" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
