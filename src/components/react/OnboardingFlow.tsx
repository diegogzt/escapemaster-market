import React, { useEffect, useState } from "react";
import { auth, type AuthSession } from "../../lib/auth";
import { OnboardingWizard } from "./OnboardingWizard";
import { OnboardingEnterpriseWizard } from "./OnboardingEnterpriseWizard";

type State =
  | { status: "loading" }
  | { status: "ready"; session: AuthSession }
  | { status: "error"; message: string };

export function OnboardingFlow({ lang }: { lang: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    (async () => {
      try {
        const session = await auth.getSession();
        if (!session.user || !session.token) {
          window.location.href = `/${lang}/login`;
          return;
        }

        if (session.user.onboarding_completed) {
          window.location.href = `/${lang}/profile`;
          return;
        }

        setState({ status: "ready", session });
      } catch (e: any) {
        setState({ status: "error", message: e?.message || "Error" });
      }
    })();
  }, [lang]);

  if (state.status === "loading") {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-tropical-secondary/30 border-t-tropical-primary animate-spin" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-svh flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-tropical-accent/20 bg-white p-5 text-tropical-text">
          <div className="font-black text-lg">Onboarding</div>
          <p className="mt-2 text-sm text-tropical-text/70">{state.message}</p>
        </div>
      </div>
    );
  }

  const accountType = state.session.user?.account_type || "customer";
  if (accountType === "enterprise") {
    return <OnboardingEnterpriseWizard lang={lang} />;
  }

  return <OnboardingWizard lang={lang} />;
}
