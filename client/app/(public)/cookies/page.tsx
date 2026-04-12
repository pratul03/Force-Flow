"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";

export default function CookiesPage() {
  return (
    <PublicLayout>
      <StaggerContainer>
        <StaggerItem>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-8">
                Cookie Policy
              </h1>
              <p className="text-muted-foreground mb-8">
                Last updated: April 2024
              </p>

              <div className="prose prose-sm max-w-none space-y-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4">What Are Cookies?</h2>
                  <p>
                    Cookies are small text files that are placed on your device
                    when you visit a website. They are widely used to make
                    websites work more effectively, as well as to provide
                    information to the site owners. FlowForce uses cookies to
                    help personalize your experience and provide essential
                    functionality.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">
                    Types of Cookies We Use
                  </h2>

                  <h3 className="text-xl font-semibold mb-3 mt-6">
                    Essential Cookies
                  </h3>
                  <p>
                    These cookies are necessary for the website to function
                    properly. They enable user navigation and access to secure
                    areas of the website. Without these cookies, the site cannot
                    function properly.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">
                    Functional Cookies
                  </h3>
                  <p>
                    These cookies remember your preferences and settings to
                    provide a personalized experience. They may track your usage
                    patterns to improve functionality and user experience.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">
                    Analytics Cookies
                  </h3>
                  <p>
                    We use analytics cookies to understand how visitors interact
                    with our website. This information helps us improve our
                    services and user experience.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">
                    Marketing Cookies
                  </h3>
                  <p>
                    These cookies are used to track visitors across websites to
                    display relevant advertisements. This helps us understand
                    our audience better.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">
                    How We Use Cookies
                  </h2>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>
                      To remember your login information and authentication
                      status
                    </li>
                    <li>To remember your preferences and settings</li>
                    <li>To analyze website traffic and usage patterns</li>
                    <li>To provide personalized content and recommendations</li>
                    <li>To measure the effectiveness of marketing campaigns</li>
                    <li>To prevent fraud and enhance security</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">
                    Managing Your Cookies
                  </h2>
                  <p>
                    Most web browsers allow you to control cookies through
                    browser settings. You can set your browser to refuse all
                    cookies or alert you when a cookie is being sent. However,
                    disabling cookies may affect the functionality of our
                    website.
                  </p>
                  <p className="mt-4">To manage cookies in popular browsers:</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                    <li>
                      Chrome: Settings → Privacy → Cookies and other site data
                    </li>
                    <li>
                      Firefox: Preferences → Privacy & Security → Cookies and
                      Site Data
                    </li>
                    <li>Safari: Preferences → Privacy → Manage Website Data</li>
                    <li>
                      Edge: Settings → Privacy, search, and services → Cookies
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">
                    Third-Party Cookies
                  </h2>
                  <p>
                    Some cookies may be placed by third-party service providers
                    who perform services on our behalf, such as analytics
                    providers. These third parties have their own privacy
                    policies and cookie policies.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">
                    Changes to This Policy
                  </h2>
                  <p>
                    We may update this Cookie Policy from time to time to
                    reflect changes in our practices or technology. We will
                    notify you of significant changes by updating the &quot;Last
                    updated&quot; date at the top of this page.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                  <p>
                    If you have any questions about our use of cookies, please
                    contact us at:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                    <li>Email: privacy@flowforce.com</li>
                    <li>Address: 123 Business Street, Tech City, TC 12345</li>
                  </ul>
                </section>
              </div>
            </div>
          </section>
        </StaggerItem>
      </StaggerContainer>
    </PublicLayout>
  );
}
