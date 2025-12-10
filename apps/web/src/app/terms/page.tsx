// 09 December 2025 19 40 00
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | BollaLabz",
  description: "Terms of Service for BollaLabz Command Center",
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block"
        >
          &larr; Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: December 9, 2025
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground">
              By accessing or using BollaLabz Command Center (&quot;the Service&quot;),
              you agree to be bound by these Terms of Service. If you do not
              agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground">
              BollaLabz Command Center is an AI-powered personal productivity
              platform that provides:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Contact management and organization</li>
              <li>Task and calendar management</li>
              <li>Voice call handling with AI transcription</li>
              <li>AI-powered analysis and summarization</li>
              <li>Integration with third-party communication services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              3. User Accounts
            </h2>
            <p className="text-muted-foreground">
              To use the Service, you must create an account. You are
              responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Providing accurate and complete information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              4. Acceptable Use
            </h2>
            <p className="text-muted-foreground">You agree NOT to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Use the Service for any illegal purpose</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Transmit malware, viruses, or harmful code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Record calls without proper consent where required by law</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              5. Voice Recording and Transcription
            </h2>
            <p className="text-muted-foreground">
              The Service may record and transcribe voice calls. By using these
              features, you acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>
                You are responsible for complying with all applicable call
                recording laws in your jurisdiction
              </li>
              <li>
                You will obtain necessary consent from all parties before
                recording calls where required
              </li>
              <li>
                Recordings and transcriptions are stored according to our
                Privacy Policy
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              6. AI-Generated Content
            </h2>
            <p className="text-muted-foreground">
              The Service uses artificial intelligence to generate summaries,
              analyses, and other content. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>AI-generated content may not always be accurate</li>
              <li>
                You should review and verify important information before
                relying on it
              </li>
              <li>
                We are not liable for decisions made based on AI-generated
                content
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-muted-foreground">
              The Service and its original content, features, and functionality
              are owned by BollaLabz and are protected by international
              copyright, trademark, and other intellectual property laws. You
              retain ownership of any content you create or upload to the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
            <p className="text-muted-foreground">
              The Service integrates with third-party services including Clerk,
              Anthropic, Deepgram, ElevenLabs, and Twilio. Your use of these
              integrations is subject to their respective terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              9. Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT
              NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR
              A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              10. Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, BOLLALABZ SHALL NOT BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
              INCURRED DIRECTLY OR INDIRECTLY.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account and access to the Service
              at our sole discretion, without prior notice, for conduct that we
              believe violates these Terms or is harmful to other users, us, or
              third parties, or for any other reason.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">
              12. Changes to Terms
            </h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will
              notify you of any changes by posting the new Terms on this page
              and updating the &quot;Last updated&quot; date. Your continued use of the
              Service after any changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with
              the laws of the United States, without regard to its conflict of
              law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2">Email: legal@bollalabz.com</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/privacy"
            className="text-primary hover:underline"
          >
            View Privacy Policy &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
