import { Suspense, lazy, type ReactNode } from "react";
import { Route } from "react-router-dom";

import { AppLoader } from "@/components/shared/AppLoader";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import Footer from "@/layout/Footer";
import Header from "@/layout/Header";
import Layout from "@/layout";

const ResetPasswordView = lazy(() => import("@/views/auth/reset"));
const SignInView = lazy(() => import("@/views/auth/sign-in"));
const SignUpView = lazy(() => import("@/views/auth/sign-up"));
const ChallengesView = lazy(() => import("@/views/web/challenges"));
const CookiePolicyView = lazy(() => import("@/views/web/cookie-policy"));
const FrensView = lazy(() => import("@/views/web/frens"));
const GoalsView = lazy(() => import("@/views/web/goals"));
const IndexView = lazy(() => import("@/views/web/index"));
const MarketingView = lazy(() => import("@/views/web/marketing"));
const PrivacyView = lazy(() => import("@/views/web/privacy"));
const ProgressView = lazy(() => import("@/views/web/progress"));
const RemindersView = lazy(() => import("@/views/web/reminders"));
const RewardsView = lazy(() => import("@/views/web/rewards"));
const SettingsView = lazy(() => import("@/views/web/settings"));
const SubscriptionView = lazy(() => import("@/views/web/subscription"));
const SupportView = lazy(() => import("@/views/web/support"));
const MissionsView = lazy(() => import("@/views/web/missions"));
const IdentitySpaceView = lazy(() => import("@/views/web/avatar"));

function RouteFallback() {
  return <AppLoader />;
}

function withSuspense(component: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{component}</Suspense>;
}

function renderProtectedWeb(component: ReactNode) {
  return (
    <ProtectedRoute>
      <Layout header={<Header />} footer={<Footer />}>
        {withSuspense(component)}
      </Layout>
    </ProtectedRoute>
  );
}

export function renderAuthRoutes() {
  return (
    <>
      <Route path="/signin" element={withSuspense(<SignInView />)} />
      <Route path="/signup" element={withSuspense(<SignUpView />)} />
      <Route path="/reset" element={withSuspense(<ResetPasswordView />)} />
    </>
  );
}

export function renderProductWebRoutes() {
  return (
    <>
      <Route path="/app" element={withSuspense(<MarketingView />)} />
      <Route path="/support" element={withSuspense(<SupportView />)} />
      <Route path="/privacy" element={withSuspense(<PrivacyView />)} />
      <Route path="/cookie-policy" element={withSuspense(<CookiePolicyView />)} />
      <Route path="/" element={renderProtectedWeb(<IndexView />)} />
      <Route path="/frens" element={renderProtectedWeb(<FrensView />)} />
      <Route path="/goals" element={renderProtectedWeb(<GoalsView />)} />
      <Route path="/challenges" element={renderProtectedWeb(<ChallengesView />)} />
      <Route path="/settings" element={renderProtectedWeb(<SettingsView />)} />
      <Route path="/subscription" element={renderProtectedWeb(<SubscriptionView />)} />
      <Route path="/rewards" element={renderProtectedWeb(<RewardsView />)} />
      <Route path="/reminders" element={renderProtectedWeb(<RemindersView />)} />
      <Route path="/progress" element={renderProtectedWeb(<ProgressView />)} />
      <Route path="/missions" element={renderProtectedWeb(<MissionsView />)} />
      {/* Identity Space - полноэкранный 3D-роут: защищён, но БЕЗ Layout (шапка/футер), т.к. иммерсивная сцена. */}
      <Route path="/avatar" element={<ProtectedRoute>{withSuspense(<IdentitySpaceView />)}</ProtectedRoute>} />
    </>
  );
}
