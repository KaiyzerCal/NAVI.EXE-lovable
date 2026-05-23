import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="TERMS OF SERVICE" subtitle="// OPERATOR AGREEMENT" />

      <Link to="/settings" className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft size={12} /> BACK TO SETTINGS
      </Link>

      <div className="space-y-6 text-sm font-body text-foreground/85 leading-relaxed">
        <p className="text-[10px] font-mono text-muted-foreground">Last updated: May 2026</p>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>By creating an account or using NAVI.EXE, you agree to be bound by these Terms of Service and our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. If you do not agree, do not use the app.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">2. Eligibility</h2>
          <p>You must be at least 13 years old to use NAVI.EXE. By using the app you represent that you meet this requirement. Users in certain jurisdictions may need to be older to enter into binding agreements.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">3. Your Account</h2>
          <ul className="space-y-1.5 list-disc list-inside text-muted-foreground">
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must provide accurate information during registration.</li>
            <li>You may not share your account with others or use another person's account.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">4. Subscriptions and Payments</h2>
          <ul className="space-y-1.5 list-disc list-inside text-muted-foreground">
            <li>NAVI.EXE offers free and paid subscription tiers (Core Operator at $7.99/mo and Elite Operator at $19.99/mo).</li>
            <li>Subscriptions automatically renew each billing period unless cancelled before the renewal date.</li>
            <li>Currency bundles (Codex Points, Cali Coins) are one-time purchases and non-refundable once credited to your account.</li>
            <li>All payments are processed by Stripe. We do not store payment card details.</li>
            <li>Refunds for subscriptions may be requested within 7 days of a charge if the service was not used. Contact support.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">5. In-App Currency</h2>
          <p>Codex Points and Cali Coins are virtual in-app currencies with no real-world monetary value. They cannot be transferred, traded for real money, or refunded. We reserve the right to modify currency earn rates, pricing, and availability at any time.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">6. Acceptable Use</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="space-y-1 list-disc list-inside text-muted-foreground">
            <li>Use the app for any unlawful purpose</li>
            <li>Attempt to reverse-engineer, hack, or disrupt the service</li>
            <li>Upload harmful, abusive, or illegal content</li>
            <li>Impersonate other users or entities</li>
            <li>Exploit bugs or loopholes to gain unfair advantages</li>
            <li>Use automated tools to access the service without permission</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">7. AI-Generated Content</h2>
          <p>NAVI.EXE uses AI systems to generate responses. AI output may occasionally be inaccurate, incomplete, or inappropriate. You should not rely on AI responses for medical, legal, financial, or other professional advice. We are not liable for decisions made based on AI output.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">8. Intellectual Property</h2>
          <p>NAVI.EXE, its logo, design, and content are owned by us and protected by intellectual property laws. You retain ownership of the content you create (journal entries, quest descriptions). You grant us a limited licence to store and process your content to provide the service.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">9. Termination</h2>
          <p>We may suspend or terminate your account at any time for violation of these Terms. You may delete your account at any time from Settings. Upon termination, your data will be deleted in accordance with our Privacy Policy.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">10. Disclaimer of Warranties</h2>
          <p>NAVI.EXE is provided "as is" without warranties of any kind, express or implied. We do not guarantee the service will be uninterrupted, error-free, or that AI responses will be accurate or appropriate for your needs.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">11. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of NAVI.EXE, even if we have been advised of the possibility of such damages. Our total liability shall not exceed the amount you paid us in the 12 months prior to the claim.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">12. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. Material changes will be communicated via in-app notification or email with at least 14 days notice. Continued use after the effective date constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">13. Governing Law</h2>
          <p>These Terms are governed by applicable law. Any disputes shall be resolved through binding arbitration or in a court of competent jurisdiction, as required by local law.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-foreground mb-2">14. Contact</h2>
          <p>Questions about these Terms: <span className="text-primary font-mono text-xs">legal@naviexe.app</span></p>
        </section>
      </div>
    </div>
  );
}
