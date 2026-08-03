import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const EFFECTIVE_DATE = "August 3, 2026";
const CONTACT_EMAIL = "support@navi.exe";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-sm font-bold text-primary tracking-widest">{title}</h2>
      <div className="text-sm font-body text-foreground/90 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft size={12} /> BACK TO NAVI.EXE
        </Link>

        <h1 className="text-2xl font-display font-bold text-primary tracking-wider text-glow-cyan mb-1">
          PRIVACY POLICY
        </h1>
        <p className="text-xs font-mono text-muted-foreground mb-8">Effective {EFFECTIVE_DATE}</p>

        <div className="space-y-8">
          <Section title="OVERVIEW">
            <p>
              NAVI.EXE ("we", "us", "the app") is a gamified AI-companion application. This policy
              explains what information we collect, why we collect it, and how it's used and
              protected. By creating an account, you agree to this policy.
            </p>
          </Section>

          <Section title="INFORMATION WE COLLECT">
            <p><strong>Account information:</strong> email address, display name, username, and authentication data, handled via Supabase Auth.</p>
            <p><strong>App activity:</strong> quests, journal entries, chat messages with your NAVI AI companion, personality/MBTI responses, streaks, XP, in-app currency, and social posts you choose to share.</p>
            <p><strong>Payment information:</strong> if you subscribe, payment is processed by Stripe. We never see or store your full card number — Stripe handles that directly.</p>
            <p><strong>Device information:</strong> if you enable push notifications, we store a push subscription token tied to your device/browser so we can deliver notifications to you.</p>
            <p><strong>Error/diagnostic data:</strong> if the app crashes or errors, technical details (not your chat content) may be sent to our crash-reporting service to help us fix bugs.</p>
          </Section>

          <Section title="HOW WE USE YOUR INFORMATION">
            <p>We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Operate your account and sync your progress across sessions</li>
              <li>Power your NAVI AI companion's conversations and personalization</li>
              <li>Process subscription payments and manage billing</li>
              <li>Send you optional push notifications you've opted into (streak reminders, quest alerts, etc.)</li>
              <li>Diagnose and fix bugs or crashes</li>
              <li>Maintain the safety and integrity of social features (guilds, feed, direct messages)</li>
            </ul>
          </Section>

          <Section title="THIRD-PARTY SERVICES">
            <p>We rely on the following processors to run NAVI.EXE. Each only receives the data necessary to perform its function:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Supabase</strong> — database, authentication, file storage, and backend functions</li>
              <li><strong>OpenAI</strong> — processes your messages to generate your NAVI companion's AI responses</li>
              <li><strong>Tavily</strong> — provides web search results used by certain AI features</li>
              <li><strong>Stripe</strong> — payment processing for subscriptions</li>
              <li><strong>Sentry</strong> — crash and error reporting</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
          </Section>

          <Section title="PUSH NOTIFICATIONS">
            <p>
              Push notifications are opt-in. You can enable or disable them at any time from
              Settings → Notifications. Disabling push access revokes your device's notification
              subscription.
            </p>
          </Section>

          <Section title="DATA RETENTION & DELETION">
            <p>
              We retain your data for as long as your account is active. To request deletion of
              your account and associated data, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
              We'll process deletion requests within a reasonable timeframe, except where we're
              required to retain certain records (e.g., billing history) for legal or accounting
              purposes.
            </p>
          </Section>

          <Section title="CHILDREN'S PRIVACY">
            <p>
              NAVI.EXE is not directed to children under 13, and we do not knowingly collect
              information from children under 13. If you believe a child has provided us with
              personal information, contact us and we'll delete it.
            </p>
          </Section>

          <Section title="YOUR RIGHTS">
            <p>
              Depending on where you live, you may have rights to access, correct, export, or
              delete your personal data, and to object to or restrict certain processing. Contact
              us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a> to
              exercise these rights.
            </p>
          </Section>

          <Section title="CHANGES TO THIS POLICY">
            <p>
              We may update this policy from time to time. We'll update the effective date above
              when we do. Continued use of NAVI.EXE after changes take effect constitutes
              acceptance of the updated policy.
            </p>
          </Section>

          <Section title="CONTACT">
            <p>
              Questions about this policy? Reach us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
