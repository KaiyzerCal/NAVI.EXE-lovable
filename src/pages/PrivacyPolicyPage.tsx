import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="PRIVACY POLICY" subtitle="// DATA HANDLING PROTOCOLS" />

      <Link to="/settings" className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft size={12} /> BACK TO SETTINGS
      </Link>

      <div className="space-y-6 text-sm font-body text-foreground/85 leading-relaxed">
        <p className="text-[10px] font-mono text-muted-foreground">Last updated: May 2026</p>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">1. Who We Are</h2>
          <p>NAVI.EXE ("we", "us", "our") is a personal productivity and AI companion application. By using NAVI.EXE, you agree to the collection and use of information as described in this policy.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">2. What We Collect</h2>
          <ul className="space-y-1.5 list-disc list-inside text-muted-foreground">
            <li><span className="text-foreground">Account data:</span> Email address and display name provided during registration.</li>
            <li><span className="text-foreground">Profile data:</span> Operator name, NAVI name, character class, MBTI type, and customisation preferences you set.</li>
            <li><span className="text-foreground">Activity data:</span> Quests you create and complete, journal entries, XP, streaks, and in-app statistics.</li>
            <li><span className="text-foreground">AI conversation data:</span> Messages you send to NAVI are processed to generate responses and stored as memory to improve personalisation.</li>
            <li><span className="text-foreground">Payment data:</span> Subscription and purchase transactions are handled by Stripe. We do not store card details.</li>
            <li><span className="text-foreground">Error data:</span> Crash reports and performance traces collected via Sentry to improve stability.</li>
            <li><span className="text-foreground">Device data:</span> Browser type, operating system, and approximate location (country level) for analytics purposes.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">3. How We Use Your Data</h2>
          <ul className="space-y-1.5 list-disc list-inside text-muted-foreground">
            <li>To provide and personalise the NAVI.EXE experience</li>
            <li>To process subscriptions and one-time purchases</li>
            <li>To send operational emails (streak warnings, account verification)</li>
            <li>To diagnose crashes and improve app performance</li>
            <li>To enforce our Terms of Service</li>
          </ul>
          <p className="mt-2">We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">4. Third-Party Services</h2>
          <div className="space-y-2 text-muted-foreground">
            <p><span className="text-foreground font-mono text-xs">Supabase</span> — Hosts our database and authentication. Data is stored in EU/US regions. <a href="https://supabase.com/privacy" target="_blank" rel="noopener" className="text-primary hover:underline">Privacy Policy</a></p>
            <p><span className="text-foreground font-mono text-xs">Stripe</span> — Processes payments. <a href="https://stripe.com/privacy" target="_blank" rel="noopener" className="text-primary hover:underline">Privacy Policy</a></p>
            <p><span className="text-foreground font-mono text-xs">Google (Gemini)</span> — Powers AI responses for Elite subscribers. Messages are processed per Google's API terms. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-primary hover:underline">Privacy Policy</a></p>
            <p><span className="text-foreground font-mono text-xs">OpenAI</span> — Used as AI fallback. <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener" className="text-primary hover:underline">Privacy Policy</a></p>
            <p><span className="text-foreground font-mono text-xs">Sentry</span> — Error monitoring. <a href="https://sentry.io/privacy/" target="_blank" rel="noopener" className="text-primary hover:underline">Privacy Policy</a></p>
          </div>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">5. Data Retention</h2>
          <p>Your data is retained while your account is active. When you delete your account, we permanently delete your profile, quests, journal entries, AI memories, and associated data within 30 days. Anonymised aggregate analytics may be retained.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">6. Your Rights</h2>
          <p className="mb-2">Depending on your jurisdiction, you may have the right to:</p>
          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
            <li>Access the personal data we hold about you</li>
            <li>Export your data (available in Settings → Export Data)</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and all associated data (available in Settings → Danger Zone)</li>
            <li>Withdraw consent for marketing emails at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">7. Cookies</h2>
          <p>We use essential cookies and localStorage for authentication session management and user preferences. We do not use advertising cookies or third-party tracking cookies.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">8. Children's Privacy</h2>
          <p>NAVI.EXE is not directed at children under 13. We do not knowingly collect data from children under 13. If you believe a child has provided us data, contact us and we will delete it promptly.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Significant changes will be communicated via in-app notification or email. Continued use of the app after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">10. Contact</h2>
          <p>For privacy-related requests or questions, contact us at: <span className="text-primary font-mono text-xs">privacy@naviexe.app</span></p>
        </section>
      </div>
    </div>
  );
}
