export default function PoliciesRoute() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header>
          <h1 className="text-3xl font-bold mb-6">
            Listen To Luther - Policies
          </h1>
          <nav>
            <ul className="flex gap-4 mb-8">
              <li>
                <a href="#eula">
                  End User License Agreement (EULA)
                </a>
              </li>
              <li>
                <a href="#privacy-policy">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </nav>
        </header>

        <main>
          <section id="eula" className="mb-12">
            <h2 className="text-2xl font-bold mb-4">
              End User License Agreement (EULA)
            </h2>
            <p className="mb-4">
              <strong>Welcome to Listen To Luther!</strong>
            </p>
            <p className="mb-4">
              This End User License Agreement ("Agreement") is a legal contract
              between you ("User" or "you") and Listen To Luther ("we," "our,"
              or "us"), governing your access to and use of Listen To Luther
              ("App"). By using the App, you agree to be bound by this
              Agreement. If you do not agree to these terms, please do not use
              the App.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">1. License</h3>
            <p className="mb-4">
              We grant you a non-exclusive, non-transferable, revocable license
              to use the App for personal, non-commercial purposes, subject to
              this Agreement.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              2. User Responsibilities
            </h3>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">
                You must use the App in compliance with applicable laws and
                regulations.
              </li>
              <li className="mb-2">
                You are responsible for ensuring that your use of the Spotify
                service complies with Spotify's Terms of Use.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              3. Prohibited Uses
            </h3>
            <p className="mb-4">You may not:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">
                Use the App to infringe on any third-party rights.
              </li>
              <li className="mb-2">
                Use the App for any illegal or unauthorized purposes.
              </li>
              <li className="mb-2">
                Modify or create derivative works based on the Spotify Platform,
                Spotify Service, or Spotify Content.
              </li>
              <li className="mb-2">
                Decompile, reverse-engineer, disassemble, or otherwise reduce
                the Spotify Platform, Spotify Service, or Spotify Content to
                source code or other human-perceivable form, to the fullest
                extent allowed by law.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              4. Intellectual Property
            </h3>
            <p className="mb-4">
              All rights, title, and interest in the App, including all
              copyrights, trademarks, and other intellectual property rights,
              belong to Listen To Luther. This Agreement does not grant you
              ownership of the App or any of its content.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              5. Disclaimer of Warranties
            </h3>
            <p className="mb-4">
              The App is provided "as is" without warranties of any kind, either
              express or implied, including but not limited to implied
              warranties of merchantability, fitness for a particular purpose,
              or non-infringement. We do not make any warranties or
              representations on behalf of Spotify and expressly disclaim all
              implied warranties with respect to the Spotify Platform, Spotify
              Service, and Spotify Content.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              6. Limitation of Liability
            </h3>
            <p className="mb-4">
              To the fullest extent permitted by law, we will not be liable for
              any damages arising out of or related to your use or inability to
              use the App. You are solely responsible for your use of the App,
              and we disclaim any liability on the part of third parties,
              including Spotify.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              7. Third-Party Beneficiary
            </h3>
            <p className="mb-4">
              Spotify is a third-party beneficiary of this Agreement and is
              entitled to directly enforce its terms.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8. Termination</h3>
            <p className="mb-4">
              We reserve the right to terminate or suspend your access to the
              App at any time, with or without notice, for any reason.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              9. Governing Law
            </h3>
            <p className="mb-4">
              This Agreement will be governed by and construed in accordance
              with the laws of USA, without regard to its conflict of law
              principles.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10. Contact Us</h3>
            <p className="mb-4">
              If you have any questions about this Agreement, please contact us
              at{" "}
              <a href="mailto:luther@listentoluther.com">
                luther@listentoluther.com
              </a>
              .
            </p>
          </section>

          <hr className="border-gray-300 dark:border-gray-700 my-8" />

          <section id="privacy-policy">
            <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
            <p className="mb-4">
              <strong>Welcome to Listen To Luther!</strong>
            </p>
            <p className="mb-4">
              Your privacy is important to us. This Privacy Policy explains how
              we handle your information when you use our App.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              1. Information We Collect
            </h3>
            <p className="mb-4">
              We do not collect, store, share, or sell any personal information
              or data from our users.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              2. How We Use Your Information
            </h3>
            <p className="mb-4">
              The App processes your natural language inputs solely to provide
              its core functionality: discovering music and playing it on
              Spotify. No data is stored or shared.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              3. Third-Party Services
            </h3>
            <p className="mb-4">
              The App integrates with Spotify's API to provide music playback
              services. Your use of Spotify is subject to Spotify's Privacy
              Policy. We do not access or store any information from your
              Spotify account.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4. Cookies</h3>
            <p className="mb-4">
              We do not use Cookies or allow third parties to place Cookies on
              users' browsers to collect information about their browsing
              activities.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              5. Children's Privacy
            </h3>
            <p className="mb-4">
              Our App is not directed at children under the age of 13. We do not
              knowingly collect any information from children.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              6. Data Security
            </h3>
            <p className="mb-4">
              While we do not collect or store user data, we use
              industry-standard security measures to protect the App and its
              integrations.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              7. Changes to This Privacy Policy
            </h3>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. Any changes
              will be posted within the App.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">
              8. Third-Party Beneficiary
            </h3>
            <p className="mb-4">
              Spotify is a third-party beneficiary of this Privacy Policy and is
              entitled to directly enforce its terms.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">9. Contact Us</h3>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please
              contact us at{" "}
              <a href="mailto:luther@listentoluther.com">
                luther@listentoluther.com
              </a>
              .
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
