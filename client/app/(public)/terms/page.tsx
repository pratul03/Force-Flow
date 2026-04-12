"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/StaggerReveal";

export default function TermsPage() {
  return (
    <PublicLayout>
      <StaggerContainer>
        <StaggerItem>
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-8">
                Terms of Service
              </h1>
              <p className="text-muted-foreground mb-8">
                Last updated: April 2024
              </p>

              <div className="prose prose-sm max-w-none space-y-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4">
                    1. Agreement to Terms
                  </h2>
                  <p>
                    By accessing and using the FlowForce application, you accept
                    and agree to be bound by the terms and provision of this
                    agreement. If you do not agree to abide by the above, please
                    do not use this service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
                  <p>
                    Permission is granted to temporarily download one copy of
                    the materials (information or software) on FlowForce for
                    personal, non-commercial transitory viewing only. This is
                    the grant of a license, not a transfer of title, and under
                    this license you may not:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                    <li>Modify or copy the materials</li>
                    <li>
                      Use the materials for any commercial purpose or for any
                      public display
                    </li>
                    <li>
                      Attempt to decompile or reverse engineer any software
                      contained on FlowForce
                    </li>
                    <li>
                      Remove any copyright or other proprietary notations from
                      the materials
                    </li>
                    <li>
                      Transfer the materials to another person or
                      &quot;mirror&quot; the materials on any other server
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">3. Disclaimer</h2>
                  <p>
                    The materials on FlowForce&apos;s website are provided on an
                    &apos;as is&apos; basis. FlowForce makes no warranties,
                    expressed or implied, and hereby disclaims and negates all
                    other warranties including, without limitation, implied
                    warranties or conditions of merchantability, fitness for a
                    particular purpose, or non-infringement of intellectual
                    property or other violation of rights.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">4. Limitations</h2>
                  <p>
                    In no event shall FlowForce or its suppliers be liable for
                    any damages (including, without limitation, damages for loss
                    of data or profit, or due to business interruption) arising
                    out of the use or inability to use the materials on
                    FlowForce, even if FlowForce or an authorized representative
                    has been notified orally or in writing of the possibility of
                    such damage.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">
                    5. Accuracy of Materials
                  </h2>
                  <p>
                    The materials appearing on FlowForce could include
                    technical, typographical, or photographic errors. FlowForce
                    does not warrant that any of the materials on its website
                    are accurate, complete, or current. FlowForce may make
                    changes to the materials contained on its website at any
                    time without notice.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">6. Links</h2>
                  <p>
                    FlowForce has not reviewed all of the sites linked to its
                    website and is not responsible for the contents of any such
                    linked site. The inclusion of any link does not imply
                    endorsement by FlowForce of the site. Use of any such linked
                    website is at the user&apos;s own risk.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">7. Modifications</h2>
                  <p>
                    FlowForce may revise these terms of service for its website
                    at any time without notice. By using this website, you are
                    agreeing to be bound by the then current version of these
                    terms of service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">8. Governing Law</h2>
                  <p>
                    These terms and conditions are governed by and construed in
                    accordance with the laws of the jurisdiction in which
                    FlowForce operates, and you irrevocably submit to the
                    exclusive jurisdiction of the courts in that location.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">9. User Accounts</h2>
                  <p>
                    When you create an account on FlowForce, you are responsible
                    for maintaining the confidentiality of your account
                    information and password and for restricting access to your
                    account. You agree to accept responsibility for all
                    activities that occur under your account or password.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">
                    10. Prohibited Activities
                  </h2>
                  <p>You agree not to use FlowForce:</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                    <li>
                      To upload, transmit or otherwise distribute any content
                      that is unlawful, threatening, abusive, libelous,
                      defamatory, obscene, or otherwise objectionable
                    </li>
                    <li>To impersonate any person or entity</li>
                    <li>
                      To upload or transmit viruses or any other malicious code
                    </li>
                    <li>
                      To engage in any conduct that restricts or inhibits
                      anyone&apos;s use or enjoyment of FlowForce
                    </li>
                    <li>
                      To attempt to gain unauthorized access to any portion of
                      FlowForce
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold mb-4">
                    11. Contact Information
                  </h2>
                  <p>
                    If you have any questions about these Terms of Service,
                    please contact us at:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                    <li>Email: legal@flowforce.com</li>
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
