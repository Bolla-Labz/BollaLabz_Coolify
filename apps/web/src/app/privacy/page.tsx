// 09 December 2025 19 40 00
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | BollaLabz",
  description: "Privacy Policy for BollaLabz Command Center",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block"
        >
          &larr; Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: December 9, 2025
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              BollaLabz (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our
              BollaLabz Command Center application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. Information We Collect
            </h2>
            <h3 className="text-xl font-medium mb-2">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Account information (name, email address) when you register
              </li>
              <li>Contact information you add to your address book</li>
              <li>Task and calendar data you create</li>
              <li>Voice recordings and transcriptions from phone calls</li>
              <li>Any other information you choose to provide</li>
            </ul>

            <h3 className="text-xl font-medium mb-2 mt-4">
              2.2 Information Collected Automatically
            </h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Device information and browser type</li>
              <li>IP address and general location</li>
              <li>Usage data and interaction with our services</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>To provide and maintain our services</li>
              <li>To process and manage your account</li>
              <li>To enable AI-powered features like transcription and summarization</li>
              <li>To improve and personalize your experience</li>
              <li>To communicate with you about updates and features</li>
              <li>To ensure security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              4. Third-Party Services
            </h2>
            <p className="text-muted-foreground">
              We use trusted third-party services to provide our functionality:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>
                <strong>Clerk</strong> - Authentication and user management
              </li>
              <li>
                <strong>Anthropic (Claude AI)</strong> - AI-powered analysis and summarization
              </li>
              <li>
                <strong>Deepgram</strong> - Speech-to-text transcription
              </li>
              <li>
                <strong>ElevenLabs</strong> - Text-to-speech synthesis
              </li>
              <li>
                <strong>Twilio</strong> - Voice and SMS communications
              </li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Each of these services has their own privacy policies governing
              their use of your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures to protect your
              data, including encryption in transit (TLS/SSL), secure database
              storage, and access controls. However, no method of transmission
              over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your account is active or as
              needed to provide you services. You may request deletion of your
              data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Access and receive a copy of your data</li>
              <li>Correct inaccurate personal information</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground">
              Our services are not intended for users under the age of 18. We do
              not knowingly collect information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              9. Changes to This Policy
            </h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new policy on this page
              and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy, please contact us
              at:
            </p>
            <p className="text-muted-foreground mt-2">
              Email: privacy@bollalabz.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/terms"
            className="text-primary hover:underline"
          >
            View Terms of Service &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
