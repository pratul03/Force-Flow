"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <StaggerContainer>
        <StaggerItem>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-8">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground mb-8">
                Last updated: April 2024
              </p>

              <div className="prose prose-sm max-w-none space-y-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4">Introduction</h2>
                  <p>
                    FlowForce (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;,
                    or &quot;Company&quot;) operates the FlowForce application.
                    This page informs you of our policies regarding the
                    collection, use, and disclosure of personal data when you
                    use our service and the choices you have associated with
                    that data.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">
                    1. Information Collection and Use
                  </h2>
                  <p>
                    We collect several different types of information for
                    various purposes to provide and improve our service to you.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">
                    Types of Data Collected:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>
                      Personal Data: name, email address, phone number, address,
                      cookies and usage data
                    </li>
                    <li>
                      Usage Data: pages visited, access times, referring pages
                    </li>
                    <li>
                      Employee Data: information about employees managed through
                      the platform
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">2. Use of Data</h2>
                  <p>FlowForce uses the collected data for various purposes:</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                    <li>To provide and maintain our service</li>
                    <li>To notify you about changes to our service</li>
                    <li>
                      To allow you to participate in interactive features of our
                      service
                    </li>
                    <li>To provide customer support</li>
                    <li>
                      To gather analysis or valuable information to improve our
                      service
                    </li>
                    <li>To monitor the usage of our service</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">
                    3. Security of Data
                  </h2>
                  <p>
                    The security of your data is important to us but remember
                    that no method of transmission over the Internet or method
                    of electronic storage is 100% secure. While we strive to use
                    commercially acceptable means to protect your personal data,
                    we cannot guarantee its absolute security.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">
                    4. Changes to This Privacy Policy
                  </h2>
                  <p>
                    We may update our Privacy Policy from time to time. We will
                    notify you of any changes by posting the new Privacy Policy
                    on this page and updating the &quot;Last updated&quot; date
                    at the top of this Privacy Policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">5. Contact Us</h2>
                  <p>
                    If you have any questions about this Privacy Policy, please
                    contact us at:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                    <li>Email: privacy@flowforce.com</li>
                    <li>Address: 123 Business Street, Tech City, TC 12345</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
                  <p>
                    We will retain your personal data only for as long as
                    necessary for the purposes set out in this Privacy Policy.
                    We will retain and use your personal data to the extent
                    necessary to comply with our legal obligations.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">
                    7. Your Privacy Rights
                  </h2>
                  <p>
                    Depending on your location, you may have certain rights
                    regarding your personal data, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                    <li>The right to access personal data we hold about you</li>
                    <li>The right to correct inaccurate data</li>
                    <li>The right to request deletion of your data</li>
                    <li>The right to restrict processing of your data</li>
                    <li>The right to data portability</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">8. Cookies</h2>
                  <p>
                    We use cookies and similar tracking technologies to track
                    activity on our service and hold certain information.
                    Cookies are files with small amounts of data which may
                    include an anonymous unique identifier. You can instruct
                    your browser to refuse all cookies or to indicate when a
                    cookie is being sent.
                  </p>
                </section>
              </div>
            </div>
          </section>
        </StaggerItem>
      </StaggerContainer>
    </PublicLayout>
  );
}
