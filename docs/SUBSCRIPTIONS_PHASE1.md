# Divergent Premium - Фаза 1 (подписка + платные челленджи)

История: `idea/subscriptions` влита в `codex/development` (merge `4ee4c3c`, откат `0c6d5af`,
повторное применение `abe4084` - см. ниже почему две лишние ревизии).

## Что вошло в merge

### 1. Подписка (эта задача)

- **Типы** (`src/types/index.ts`): `User.subscription`, `SubscriptionView` / `SubscriptionStatus` /
  `SubscriptionPlan` / `SubscriptionPlans`, `PaymentMethodType`, `Challenge.prizePool`.
- **API** (`src/shared/api/client.ts`): `fetchSubscription`, `fetchSubscriptionPlans`,
  `createSubscription`, `cancelSubscription`, `resumeSubscription`, `fetchPaymentMethods`;
  `payChallenge` принимает `methodType`.
- **Стор** (`src/stores/slices/subscription.ts` + `types.ts` + `base.ts` + `useAppStore.ts`):
  `loadSubscriptionPlans`, `startSubscriptionCheckout`, `refreshSubscription`,
  `cancelSubscription`, `resumeSubscription`; `subscriptionPlans` в state.
- **Экран** `SubscriptionScreen` (native `src/components/native/`, web `src/components/web/`):
  пейволл (SberPay / T-Bank, цена, преимущества) + управление (статус, дата списания,
  отмена / возобновление), опрос статуса платежа после возврата с ЮKassa.
- **Гейт**: таб «Челленджи» за пейволлом при `!user.subscription.hasChallengesAccess`
  (native `AppShell.tsx`, web `views/web/challenges.tsx`). Модалка Premium из настроек
  (`views/native/settings.tsx`). Веб-роут `/subscription` (`views/web/subscription.tsx`).

Серверная часть - отдельный репозиторий, ветка `idea/subscriptions` в `codex/development`
(модели `Subscription` / `SavedPaymentMethod`, роуты `/subscriptions/*`, вебхук
`/webhooks/yookassa`, воркер `subscriptionBilling`, гейт в `challenges/join`).

### 2. Незакоммиченная работа 05.08, доехавшая вместе с подпиской

На момент возобновления работы (05.09) рабочее дерево клиента содержало незакоммиченные
изменения с обрыва 05.08 (тот же обрыв, что оставил `challenges.ts` на сервере). `git status`
под iCloud возвращал пусто, поэтому они попали в подписочный merge. Все компилируются и входят
в зелёную сборку. Что это:

- **Фиксы typecheck**: без них `codex/development` (b43df55) **не проходил `tsc -b`** -
  `ProgressOverviewSection.tsx`, `ShowcaseSheet.tsx`, `AppShell.tsx` (мёртвый импорт `Bell`).
- **Удаление челленджа создателем** (клиентская половина): `deleteChallenge` в api/сторе/хуке,
  кнопка + `onDelete` в `ChallengeCard` / `challenges-screen/Sections` / `views/web/challenges`.
  Серверный эндпоинт `DELETE /api/challenges/:id` лежит в stash server-репо - **не влит**,
  так что кнопка пока ведёт в никуда. Довести отдельной задачей.
- **Панель отчётов челленджа** (`ChallengeReportPanel.tsx`) + правки `ChallengeCheckInDialog`.
- **Веб-версия Identity Space / 3D-аватар**: `src/components/web/identity-space/*`,
  `views/web/avatar.tsx`, роут `/avatar`, `buildAvatarPath()`, шим `expo-video` + правка
  `vite.config.ts`, `Profile.tsx`. Блок аватара запаркован Owner - это НЕ продолжение
  разработки, а фиксация состояния кода на отсечке. Роут `/avatar` активен, но развивать
  фичу до решения по продуктовому аудиту не начинаем.

## Перед Staging (нужно от Owner)

- Доступ в ЛК ЮKassa: заявка на рекуррентные платежи, подключение SberPay и Tinkoff Pay,
  URL вебхука, фискализация.
- env: `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `PAYMENT_RETURN_URL`, `PAYWALL_IOS_ENABLED`.
- Домен и база под Staging.

## Открытые хвосты

- Серверный `DELETE /api/challenges/:id` (в stash) + нативная кнопка удаления.
- Выбор SberPay / T-Bank в диалоге оплаты платного челленджа (сейчас одна кнопка, дальше
  выбор способа на странице ЮKassa).
- Форма создания челленджа: связать `price` и `prizePool` (сейчас можно задать цену без
  флага фонда, и такой челлендж уходит под подписку с проигнорированной ценой).
