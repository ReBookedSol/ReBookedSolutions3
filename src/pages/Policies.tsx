import { useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Scale, Shield, Mail, RefreshCw, Package, Undo2, Gavel, ShoppingCart } from "lucide-react";

const Policies = () => {
  const [activeTab, setActiveTab] = useState("privacy");

  return (
    <Layout>
      <SEO
        title="Policies & Terms | ReBooked Solutions"
        description="Complete policy documentation for ReBooked Solutions - Privacy Policy and Terms and Conditions."
        keywords="policies, terms, privacy, POPIA, consumer protection, ReBooked Solutions"
      />

      <div className="container mx-auto px-4 py-6 sm:py-12 max-w-7xl">
        <div className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Platform Policies
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-3xl mx-auto">
            Complete policy documentation for ReBooked Solutions
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 mt-6 max-w-5xl mx-auto shadow-sm">
            <div className="text-blue-900 text-xs sm:text-sm leading-snug">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <span className="whitespace-nowrap"><strong>Effective Date:</strong> 10 June 2025</span>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap"><strong>Platform:</strong> rebookedsolutions.co.za</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1">
                <span className="whitespace-nowrap"><strong>Operator:</strong> ReBooked Solutions (Pty) Ltd</span>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap break-all"><strong>Support:</strong> legal@rebookedsolutions.co.za</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1">
                <span className="whitespace-nowrap"><strong>Jurisdiction:</strong> Republic of South Africa</span>
              </div>
              <div className="mt-1 text-center">
                <span className="block sm:inline break-words max-w-[62ch] mx-auto">
                  <strong>Regulatory Compliance:</strong> Consumer Protection Act (Act 68 of 2008) • Electronic Communications and Transactions Act (Act 25 of 2002) • Protection of Personal Information Act (Act 4 of 2013)
                </span>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6 mt-6 max-w-5xl mx-auto shadow-sm">
            <div className="text-amber-900 text-sm sm:text-base">
              <p className="font-medium mb-2">Messaging & Communication Notice:</p>
              <p>The Platform may offer messaging features in the future. Currently, Users must communicate through other means agreed upon for any transactions or disputes.</p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="mb-8 sm:mb-12">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-xl sm:text-2xl">All Policies & Terms</CardTitle>
                <p className="text-gray-600 text-sm">Select a policy to view details</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                  <Button
                    onClick={() => setActiveTab("privacy")}
                    variant={activeTab === "privacy" ? "default" : "outline"}
                    size="lg"
                    className="w-full justify-start font-medium px-3 py-2 whitespace-normal break-words text-sm leading-tight min-h-[44px]"
                  >
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-left">Privacy Policy</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("terms")}
                    variant={activeTab === "terms" ? "default" : "outline"}
                    size="lg"
                    className="w-full justify-start font-medium px-3 py-2 whitespace-normal break-words text-sm leading-tight min-h-[44px]"
                  >
                    <Scale className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-left">Terms & Conditions</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("refunds")}
                    variant={activeTab === "refunds" ? "default" : "outline"}
                    size="lg"
                    className="w-full justify-start font-medium px-3 py-2 whitespace-normal break-words text-sm leading-tight min-h-[44px]"
                  >
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-left">Refund Policy</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("cancellation")}
                    variant={activeTab === "cancellation" ? "default" : "outline"}
                    size="lg"
                    className="w-full justify-start font-medium px-3 py-2 whitespace-normal break-words text-sm leading-tight min-h-[44px]"
                  >
                    <Gavel className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-left">Cancellation Policy</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("shipping")}
                    variant={activeTab === "shipping" ? "default" : "outline"}
                    size="lg"
                    className="w-full justify-start font-medium px-3 py-2 whitespace-normal break-words text-sm leading-tight min-h-[44px]"
                  >
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-left">Shipping & Delivery</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("returns")}
                    variant={activeTab === "returns" ? "default" : "outline"}
                    size="lg"
                    className="w-full justify-start font-medium px-3 py-2 whitespace-normal break-words text-sm leading-tight min-h-[44px]"
                  >
                    <Undo2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-left">Return Policy</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("sellers")}
                    variant={activeTab === "sellers" ? "default" : "outline"}
                    size="lg"
                    className="w-full justify-start font-medium px-3 py-2 whitespace-normal break-words text-sm leading-tight min-h-[44px]"
                  >
                    <Gavel className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-left">Seller’s Policy</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("buyers")}
                    variant={activeTab === "buyers" ? "default" : "outline"}
                    size="lg"
                    className="w-full justify-start font-medium px-3 py-2 whitespace-normal break-words text-sm leading-tight min-h-[44px]"
                  >
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-left">Buyer’s Policy</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("disputes")}
                    variant={activeTab === "disputes" ? "default" : "outline"}
                    size="lg"
                    className="w-full justify-start font-medium px-3 py-2 whitespace-normal break-words text-sm leading-tight min-h-[44px]"
                  >
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-left">Dispute Resolution</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Privacy Policy Tab */}
          {activeTab === "privacy" && (
            <div className="space-y-6 sm:space-y-8">
              <Card className="shadow-md border-gray-200">
                <CardHeader className="pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl flex items-center gap-3 mb-3 sm:mb-4 text-gray-800">
                    <Shield className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 flex-shrink-0 text-blue-600" />
                    <span>Privacy Policy</span>
                  </CardTitle>
                  <div className="text-gray-600 text-xs sm:text-sm space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span>
                        <strong>Effective Date:</strong> 10 June 2025
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        <strong>Platform:</strong>{" "}
                        <span className="break-all">
                          www.rebookedsolutions.co.za
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span>
                        <strong>Operator:</strong> ReBooked Solutions (Pty) Ltd
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        <strong>Contact:</strong>{" "}
                        <span className="break-all">
                          legal@rebookedsolutions.co.za
                        </span>
                      </span>
                    </div>
                    <strong>Jurisdiction:</strong>
                    <div>
                      <span> Republic of South Africa</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        1. Introduction
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked Solutions (Pty) Ltd ("ReBooked", "we", "our",
                        or "us") is committed to protecting your privacy. This
                        Privacy Policy outlines how we collect, use, store,
                        share, and protect your personal information in
                        accordance with the Protection of Personal Information
                        Act (POPIA) and applicable South African law.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        By accessing or using any part of the ReBooked platform,
                        including ReBooked Campus, you consent to the collection
                        and processing of your personal information as outlined
                        in this Policy. If you do not agree, please refrain from
                        using the platform.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        2. Scope of the Policy
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        This Privacy Policy applies to all visitors, users, and
                        account holders of ReBooked Solutions. It covers
                        information collected through our main marketplace,
                        ReBooked Campus, our communication tools, analytics
                        systems, and any third-party integrations we use.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3. What Information We Collect
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We collect personal information that is necessary to
                        provide our services and ensure platform security. This
                        includes, but is not limited to:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          Identification and contact information: full name,
                          email address, phone number, and optionally your
                          school or university.
                        </li>
                        <li>
                          Account credentials: hashed passwords and login
                          activity.
                        </li>
                        <li>
                          Listing and transaction data: books or items listed,
                          viewed, sold, or purchased.
                        </li>
                        <li>
                          Delivery information: shipping address, courier
                          tracking data, and delivery preferences.
                        </li>
                        <li>
                          Payment-related information: banking details and payment
                          references, collected and processed securely through
                          trusted third-party providers like Paystack.
                        </li>
                        <li>
                          Educational data: input used in APS calculators, study
                          tips submitted, bursary tools used, and program
                          searches within ReBooked Campus.
                        </li>
                        <li>
                          Technical and usage data: IP address, browser type,
                          device info, time on page, actions performed, and
                          referral source.
                        </li>
                        <li>
                          Communication data: messages sent to our support
                          email, helpdesk forms, or via any integrated chat or
                          contact system.
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        4. How We Collect Your Information
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We collect personal information directly from you when
                        you create an account, submit forms, list items, browse
                        educational resources, or communicate with us.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We also collect certain data automatically through
                        cookies, server logs, analytics tools, and browser-based
                        tracking, which help us improve the platform and detect
                        suspicious activity.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Where applicable, we may collect information from
                        third-party services you interact with through our
                        platform, such as payment providers or delivery
                        companies.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5. How We Use Your Information
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We use your information for the following lawful
                        purposes:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>To register and manage your account.</li>
                        <li>
                          To facilitate the listing, browsing, and sale of books
                          and other goods.
                        </li>
                        <li>
                          To enable communication between buyers and sellers.
                        </li>
                        <li>
                          To coordinate with courier services for deliveries.
                        </li>
                        <li>
                          To display and improve ReBooked Campus resources,
                          including APS tools, bursary data, and university
                          programs.
                        </li>
                        <li>
                          To send important notifications, alerts, and updates
                          related to your account, listings, or educational
                          tools.
                        </li>
                        <li>
                          To respond to user queries and provide customer
                          support.
                        </li>
                        <li>
                          To analyse user behaviour and improve platform
                          performance, reliability, and security.
                        </li>
                        <li>
                          To enforce our terms and conditions and protect
                          against fraud, abuse, or policy violations.
                        </li>
                        <li>
                          To comply with South African legal obligations, such
                          as tax, consumer protection, or data protection laws.
                        </li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        We will only use your personal information for the
                        purpose it was collected, unless we reasonably believe
                        another purpose is compatible or we obtain your further
                        consent.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        6. Sharing of Information
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We do not sell, lease, or rent your personal information
                        to any third parties. However, we may share your
                        personal data under strict conditions with:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          Third-party service providers who help operate the
                          platform, such as our database host (Supabase), web
                          host (Vercel), or analytics partners.
                        </li>
                        <li>
                          Courier companies for fulfilling delivery instructions
                          and providing tracking updates.
                        </li>
                        <li>
                          Payment processors like Paystack for secure handling
                          of funds, subject to their own privacy and security
                          frameworks.
                        </li>
                        <li>
                          Legal or regulatory authorities if required by law,
                          court order, subpoena, or in the defence of legal
                          claims.
                        </li>
                        <li>
                          Technical advisors or consultants strictly for
                          internal compliance, audits, or security reviews.
                        </li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        All third parties are contractually required to treat
                        your data with confidentiality and to use it only for
                        the intended service delivery purpose.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        7. Cookies and Tracking
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked Solutions uses cookies and similar technologies
                        to improve user experience, maintain security, and
                        analyse platform usage.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        These cookies may track session duration, device
                        information, login behaviour, and referral sources. You
                        can disable cookies in your browser settings, but this
                        may limit some functionality on our website.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        8. Bank Account Details and Payouts
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        To receive payouts from ReBooked Solutions (e.g. for successful textbook sales or reimbursements), users must submit valid and accurate banking details via the platform.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        By providing your banking information, you confirm that you are the rightful owner of the account or are authorized to use it.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        It is your sole responsibility to ensure that all banking details you provide are complete, correct, and up to date. ReBooked Solutions will process payments using the exact information you submit. If a payment is made to the account number you provided, it will be deemed successful and completed.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        If you later claim that you did not receive payment, we will provide you with proof of payment, including transaction receipts, the bank account number the funds were sent to, and the exact details you entered at the time of submission.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked Solutions is not liable for any losses or delays resulting from incorrect, incomplete, or fraudulent banking information provided by the user.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        We reserve the right to verify any banking details you submit and to withhold or cancel payouts if suspicious activity is detected.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        9. Data Security
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We implement industry-standard technical and
                        organisational measures to protect your personal data.
                        These include secure password hashing, role-based access
                        control, encrypted storage, audit logging, and real-time
                        threat monitoring.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        While we make every effort to safeguard your data, no
                        method of digital transmission or storage is completely
                        secure. Use of the platform is at your own risk, and you
                        acknowledge that absolute security cannot be guaranteed.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        10. Data Retention
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        We retain personal information only as long as necessary
                        to fulfil the purposes outlined in this Policy or as
                        required by law. When your information is no longer
                        required, it is securely deleted or anonymised.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        You may request deletion of your data by contacting
                        legal@rebookedsolutions.co.za. However, we may retain
                        certain information if required for legal compliance,
                        fraud prevention, dispute resolution, or transaction
                        history.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        11. User Rights Under POPIA
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Under South African data protection law, you have the
                        following rights:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>
                          The right to be informed about how your personal data
                          is collected and used.
                        </li>
                        <li>
                          The right to access the personal data we hold about
                          you.
                        </li>
                        <li>
                          The right to request correction or deletion of your
                          personal information.
                        </li>
                        <li>
                          The right to object to processing or withdraw consent
                          where applicable.
                        </li>
                        <li>
                          The right to lodge a complaint with the Information
                          Regulator.
                        </li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        To exercise any of these rights, please contact
                        legal@rebookedsolutions.co.za. We may require proof of
                        identity before processing any request.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        12. Children's Privacy
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Our platform is not intended for users under the age of
                        16 without parental or guardian consent. If we learn
                        that we have collected information from a child without
                        proper authorisation, we will take steps to delete it
                        promptly.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        13. Third-Party Links
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Our site may contain links to third-party websites,
                        services, or bursary programs. Once you leave our
                        domain, we are not responsible for the privacy
                        practices, content, or accuracy of those third-party
                        sites. You access them at your own risk.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        14. International Transfers
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Although we are based in South Africa, some of our
                        service providers (e.g., hosting or email services) may
                        process data in foreign jurisdictions. We take
                        reasonable steps to ensure that all data transfers are
                        compliant with South African data protection laws and
                        subject to adequate safeguards.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        15. Policy Updates
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        We reserve the right to update this Privacy Policy at
                        any time. Material changes will be announced on the
                        platform. Continued use after such changes implies your
                        acceptance of the revised terms.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        16. Contact Us
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3">
                        If you have any questions, requests, or concerns
                        regarding your personal information or this Privacy
                        Policy, please contact:
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                        <p className="text-blue-800 text-sm sm:text-base">
                          <strong>ReBooked Solutions (Pty) Ltd</strong>
                          <br />
                          Email:{" "}
                          <span className="break-all">
                            legal@rebookedsolutions.co.za
                          </span>
                          <br />
                          Based in the Republic of South Africa
                        </p>
                      </div>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Terms & Conditions Tab */}
          {activeTab === "terms" && (
            <div className="space-y-4 sm:space-y-6">
              <Card className="shadow-md border-gray-200">
                <CardHeader className="pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl flex items-center gap-3 mb-3 sm:mb-4 text-gray-800">
                    <Scale className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 flex-shrink-0 text-blue-600" />
                    <span>Terms and Conditions</span>
                  </CardTitle>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <div className="text-blue-800 text-xs sm:text-sm space-y-2">
                      <div className="text-center">
                        <span>
                          <strong>Effective Date:</strong> 15 November 2025
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Platform:</strong>{" "}
                          <span className="break-all">https://www.rebookedsolutions.co.za</span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Platform Operator:</strong> ReBooked Solutions (Pty) Ltd
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Registration No.:</strong> 2025 / 452062 / 07
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Email:</strong>{" "}
                          <span className="break-all">
                            legal@rebookedsolutions.co.za
                          </span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Jurisdiction:</strong> Republic of South Africa
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 py-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        1. About the company
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>ReBooked Solutions (Pty) Ltd ("ReBooked Solutions", "we", "our") operates a peer-to-peer marketplace that enables registered users to buy and sell textbooks on the Platform.</li>
                        <li>Company details: ReBooked Solutions (Pty) Ltd, Registration No.: 2025 / 452062 / 07, Principal place of business: info@rebookedsolutions.co.za, Email: legal@rebookedsolutions.co.za; Support: info@rebookedsolutions.co.za.</li>
                        <li>Acceptance: Creating an account, listing an item, purchasing, or continued use of the Platform constitutes acceptance of these Terms and any policies referenced herein.</li>
                        <li>Definitions: "User" means any person using the Platform; "Seller" means a User listing textbooks; "Buyer" means a User purchasing textbooks; "Wallet" means the virtual balance functionality on the Platform.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        2. Eligibility and accounts
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Age and capacity: You represent that you are at least the age of majority in South Africa and have legal capacity to contract; if under the age of majority, you confirm parental/guardian consent and that such guardian accepts responsibility for your actions and charges on the Platform.</li>
                        <li>Account security: You must keep credentials confidential and are responsible for all activity under your account; suspected misuse must be reported to info@rebookedsolutions.co.za immediately.</li>
                        <li>One account per person; false identities, multiple accounts, or evasion are prohibited and may result in suspension or termination.</li>
                        <li>Accurate information: You must provide true, current, and complete information and keep it updated.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3. How the Platform works
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Marketplace role: ReBooked Solutions is not the buyer or seller of textbooks and does not take title to items; the sales contract is between Buyer and Seller.</li>
                        <li>Functions: Users may list textbooks, browse, buy, save favourites, and share listings; direct off-platform transactions are not permitted for orders initiated on the Platform.</li>
                        <li>Payment processing: ReBooked Solutions acts as limited payment agent for Sellers to accept payments on their behalf; all transactions are in South African Rands (ZAR) via approved methods (EFT, card, Wallet).</li>
                        <li>Purchase flow:
                          <ol className="list-decimal pl-6 mt-2 space-y-1 text-gray-700 text-sm sm:text-base">
                            <li>Buyer pays through the Platform; funds are received by ReBooked Solutions as limited payment agent.</li>
                            <li>Seller must commit to the sale within 48 hours or the order is automatically cancelled and Buyer is refunded.</li>
                            <li>On Seller commitment, a delivery request is generated, and Seller ships using the selected method.</li>
                            <li>Buyer confirms receipt.</li>
                            <li>Upon receipt confirmation (or auto completion), funds are released to Seller and can be paid out to the Seller's bank account within 1–3 business days, subject to accurate bank details.</li>
                          </ol>
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        4. Fees, VAT, and invoices
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Seller commission: 10% of the sale price is deducted on successful completion of a sale.</li>
                        <li>Buyer fee: R20 platform fee applies per order to cover secure transaction processing; shipping charges are shown at checkout, where applicable.</li>
                        <li>VAT: Unless stated otherwise, fees are VAT inclusive/exclusive as indicated on the Platform; tax invoices are available on request to accounts@rebookedsolutions.co.za.</li>
                        <li>Fee changes: We may change fees with prior notice on the Platform; changes apply to orders initiated after the effective date of the change.</li>
                        <li>Taxes: Users are responsible for their tax obligations (including income tax and VAT registration/compliance, if applicable) arising from sales or purchases.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5. Transaction security and acceptable use
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>All order communications, payments, and shipping must occur through the Platform using approved methods; solicitation to transact off-platform is prohibited and may result in cancellation/suspension.</li>
                        <li>To reduce disputes, Users should provide accurate descriptions and respond promptly to messages; abusive, harassing, discriminatory, or misleading conduct is prohibited and may lead to removal or suspension.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        6. Shipping, delivery, and risk
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Commit and ship deadlines: Seller must commit within 48 hours of order; after commitment, Seller must ship promptly and within 60 hours / 3 days, unless otherwise stated on the listing.</li>
                        <li>Integrated couriers and tracking: Where integrated courier options are used, the Platform may auto-update shipping status; Sellers must provide accurate tracking numbers for other carriers.</li>
                        <li>Packaging standards: Sellers must safely and appropriately package textbooks; Seller is responsible for damage caused by inadequate packaging.</li>
                        <li>Risk of loss: Risk passes from Seller to Buyer upon confirmed delivery by the carrier, as evidenced by tracking or carrier confirmation, subject to Buyer protections.</li>
                        <li>Buyer confirmation and auto completion: Buyer should confirm receipt within 48 hours; if no confirmation or claim, the Platform may complete the order based on delivery evidence.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        7. Wallet and payouts
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Nature of wallet: Wallet is a payment functionality, not a bank account or investment; no interest accrues.</li>
                        <li>Payout timing: After order completion, funds reflect in Seller's Wallet; payouts to South African bank accounts typically take 1–3 business days.</li>
                        <li>Bank details: Sellers are responsible for accurate bank information; Platform not liable for delays/misdirected payments.</li>
                        <li>Dormant balances: Inactive Wallets (6 months) may be handled per unclaimed funds requirements and these Terms.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        8. Refunds, cancellations, and returns
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Non commitment: If Seller fails to commit within 48 hours, order is cancelled and Buyer refunded (fees and shipping included).</li>
                        <li>Delivery issues: If delivery fails or cannot be verified, Buyer may request a refund; Platform may cancel and refund if dispatch/delivery cannot be proven.</li>
                        <li>Not as described: Claims within 48 hours of delivery if the item differs significantly; evidence required.</li>
                        <li>Return process: Approved returns shipped back within 72 hours; tracking required; funds on hold until return confirmed; Buyer pays shipping unless otherwise required by law.</li>
                        <li>Outcomes: Funds released to Seller or refunded to Buyer; failure to respond may result in decision based on records.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        9. Disputes between users
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Internal resolution: Users should attempt to resolve via Platform messages; Platform may assist but is not obligated.</li>
                        <li>Non response: Lack of response within 48 hours may result in decision favouring responding party.</li>
                        <li>External remedies: Consumers may approach regulators or courts subject to South African law; non-waivable CPA rights preserved.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        10. Seller obligations
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Seller warranties: Lawful ownership, no liens, non-counterfeit, accurate and complete listing, including images, editions/ISBNs, pricing.</li>
                        <li>Listing standards: Use original photos; disclose defects, annotations, missing materials; avoid AI/stock images.</li>
                        <li>Pricing and availability: Prompt dispatch, correct charges, no post-purchase price changes.</li>
                        <li>Order acceptance and shipping: Commit/decline within 48 hours; dispatch within SLA; accurate tracking.</li>
                        <li>Packaging and risk before delivery: Secure packaging; Seller liable for loss/damage until confirmed delivery.</li>
                        <li>Prohibited items: Illegal, counterfeit, digital, adult, medical, dangerous items prohibited; violations may result in account action and reporting.</li>
                        <li>Communication: Respond to Buyer/Platform within 48 hours; non-responsiveness may affect dispute outcomes.</li>
                        <li>Returns and "not as described": Cooperate with claims, accept returns/refunds if required.</li>
                        <li>Taxes and compliance: Responsible for income tax, VAT, consumer law, IP, other laws.</li>
                        <li>Bank/payout details: Keep information accurate; Platform may hold funds pending KYC/AML.</li>
                        <li>Off-platform circumvention: No payment/shipment outside Platform for initiated transactions.</li>
                        <li>Indemnity to Platform: Sellers indemnify Platform from claims, losses, penalties, costs arising from listings, sales, misrepresentations, IP infringement, unlawful items, tax non-compliance, packaging failures, or breach of Terms.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        11. Liability limits
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Marketplace role: Platform not party to Buyer-Seller contracts; no inspection/guarantee; courier responsibility.</li>
                        <li>No warranties: Services "as is", no express/implied warranties; CPA rights preserved.</li>
                        <li>Limitation of liability: Aggregate liability limited to greater of fees paid in prior 6 months or R1,000; indirect, consequential, exemplary, punitive damages excluded.</li>
                        <li>User responsibility for third-party issues: Users responsible for actions, listings, packaging, delivery, compliance; Platform not liable for disputes, misdescription, carrier delays, force majeure.</li>
                        <li>Chargebacks/reversals: Users liable for deficits/fees; Platform may offset Wallet, delay payouts, or seek recovery.</li>
                        <li>Data and security: Reasonable security measures; Platform not liable for unauthorized access beyond control; POPIA remedies apply.</li>
                        <li>Statutory rights preserved: Terms subject to non-waivable rights under CPA and SA law.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        12. Prohibited items and conduct
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Only textbooks and study materials; counterfeit, stolen, illegal, digital, vouchers, medical, adult, weapons, drugs, dangerous items prohibited.</li>
                        <li>Original listing content: Use actual item photos; AI/third-party images prohibited; accurate descriptions required.</li>
                        <li>Takedown/enforcement: Violating listings removed; accounts suspended/terminated; cooperation with authorities.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        13. Intellectual property
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Platform IP: All content/software owned/licensed; no copying/distribution without consent.</li>
                        <li>User content licence: Uploading grants revocable, royalty-free, non-exclusive license to Platform; Users warrant ownership/rights.</li>
                        <li>IP complaints: Rights holders submit notices to legal@rebookedsolutions.co.za; compliant notices may result in removal/repeat infringer action.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        14. Compliance: CPA, ECTA, POPIA, AML/FICA
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>CPA: Non-waivable consumer rights preserved; certain CPA provisions may not apply to private Seller-Buyer.</li>
                        <li>ECTA: Supplier info, pricing, payment, delivery, return, complaint processes disclosed; electronic records/orders valid upon payment and Seller commitment.</li>
                        <li>POPIA/Privacy: Personal info processed per Privacy Policy; requests to info@rebookedsolutions.co.za.</li>
                        <li>AML/FICA: KYC, transaction monitoring; identity/bank docs may be requested; payments may be withheld/reversed.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        15. Withholding, chargebacks, and risk controls
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Holds, delays, reversals may occur for fraud, chargebacks, policy breaches, AML, legal requests.</li>
                        <li>Users liable for deficits and fees from chargebacks/fraud; recovery may be pursued.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        16. Platform availability and security
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Availability: May be unavailable due to maintenance, outages, force majeure; concluded transactions not affected.</li>
                        <li>Security and acceptable use: No scraping, reverse engineering, malware introduction, circumvention; rate limiting and monitoring may apply.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        17. Liability and indemnity
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>No inspection/guarantee: Platform does not inspect/endorse listings; courier responsibility.</li>
                        <li>Limitation: Liability limited to higher of fees paid in 6 months or R1,000; indirect/consequential/exemplary/special damages excluded.</li>
                        <li>Indemnity: Users indemnify Platform from claims, losses, expenses from use, breach, IP infringement, law violation.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        18. Suspension and termination
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Grounds: Breach, fraud, prohibited items, repeated disputes, legal compliance.</li>
                        <li>Effect: Pending orders may be cancelled; Wallet balances may be held pending disputes, chargebacks, AML, legal review; remaining balances paid out after resolution.</li>
                        <li>Account closure by User: Only when no open orders and Wallet zero; records retained as required by law.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        19. Force majeure
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Neither party liable for delays/failures beyond control (load shedding, power/telecom failures, strikes, acts of God, epidemics, carrier disruptions).</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        20. Changes to terms
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Amendments posted on Platform/email; effective on stated date; continued use constitutes acceptance; version history may be maintained.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        21. General
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Governing law/forum: Republic of South Africa; Magistrates' Court jurisdiction without excluding High Court.</li>
                        <li>Severability: Invalid provisions don't affect remaining Terms; no waiver effective unless in writing; assignment requires consent.</li>
                        <li>Entire agreement: These Terms plus referenced policies constitute full agreement.</li>
                        <li>Notices: Legal notices to registered address with copy to legal@rebookedsolutions.co.za; User notices via email or in-app.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        22. Security
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Technical safeguards: TLS encryption, credential hashing, role-based access, monitoring, rate limiting, vulnerability management.</li>
                        <li>Payment security: Cards processed by PCI DSS-compliant provider; 3D Secure used; ReBooked Solutions stores only truncated tokens.</li>
                        <li>User responsibilities: Confidential credentials, strong passwords, MFA, updated devices/antivirus, report compromises.</li>
                        <li>Prohibited security activity: No probing, scanning, bypassing security, scraping, load/penetration testing without consent; violations may result in suspension/action.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        23. Data protection, POPIA, and breach notification
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Privacy compliance: Info processed per Privacy Policy; POPIA/PAIA requests to info@rebookedsolutions.co.za.</li>
                        <li>Breach notification: Lawful notifications to affected Users and Information Regulator; cooperate with Users/authorities.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        24. Payments, processors, and card data
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Authorised processors: BobPay and others; Users authorise processing of payments, refunds, chargebacks.</li>
                        <li>Tokenisation: Sensitive card data handled by processors; Platform stores only truncated references/tokens.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        25. Business continuity and maintenance
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Availability: Platform access not guaranteed; planned/emergency maintenance may occur.</li>
                        <li>Disaster recovery: Backup/recovery processes exist; timelines vary with incident nature.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        26. Vulnerability disclosure
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Coordinated disclosure: Researchers report to info@rebookedsolutions.co.za; Platform acknowledges receipt; public disclosure discouraged until remediation.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        27. User Accounts
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>27.1 Users must register with accurate and truthful personal information. Providing false or misleading information may result in suspension or termination of the account.</li>
                        <li>27.2 Each user may maintain only one account. Multiple accounts or attempts to circumvent platform rules are strictly prohibited.</li>
                        <li>27.3 Users are responsible for safeguarding their login credentials. All activity under a user account is the responsibility of the account holder.</li>
                        <li>27.4 Users must notify the platform immediately of any unauthorized access or suspicious activity related to their account.</li>
                        <li>27.5 The platform reserves the right to verify a user's identity if suspicious activity is detected.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        28. Transactions & Payments
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>28.1 All transactions must be processed through the platform's payment system to ensure security and compliance.</li>
                        <li>28.2 Payments will be released to sellers only after the buyer confirms receipt or after delivery confirmation through tracking.</li>
                        <li>28.3 Sellers are responsible for providing accurate banking details. The platform is not liable for delays caused by incorrect information.</li>
                        <li>28.4 The platform is not responsible for losses due to chargebacks, fraud, or disputes beyond its control.</li>
                        <li>28.5 International transactions may require additional verification for compliance with legal obligations, including Anti-Money Laundering (AML) regulations.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        29. Seller & Buyer Responsibilities
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>29.1 Sellers must:
                          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700 text-sm sm:text-base">
                            <li>Accurately describe items, including condition, defects, and authenticity.</li>
                            <li>Upload real photos of items; stock or AI-generated images are prohibited.</li>
                            <li>Ensure proper packaging and timely delivery.</li>
                            <li>Cooperate in return requests and dispute resolutions.</li>
                          </ul>
                        </li>
                        <li>29.2 Buyers must:
                          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700 text-sm sm:text-base">
                            <li>Provide accurate delivery information.</li>
                            <li>Confirm receipt of items promptly.</li>
                            <li>Report discrepancies or damages immediately.</li>
                            <li>Cooperate with the platform during disputes.</li>
                          </ul>
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        30. Prohibited Items
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>30.1 The following items are strictly prohibited: counterfeit goods, illegal substances, weapons, adult content, expired consumables, and any items violating applicable laws.</li>
                        <li>30.2 The platform reserves the right to remove prohibited listings and terminate accounts without liability.</li>
                        <li>30.3 Users selling prohibited items may be subject to civil or criminal liability.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        31. Liability & Disclaimers
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>31.1 The platform is not responsible for the quality, authenticity, or legality of any items listed or sold.</li>
                        <li>31.2 All services are provided "as is" and "as available," without warranty of uninterrupted access, security, or accuracy.</li>
                        <li>31.3 Users acknowledge that the platform is not liable for disputes, delivery issues, or loss/damage incurred outside its control.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        32. Intellectual Property
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>32.1 All platform content, including software, logos, graphics, and text, is protected under copyright and trademark laws.</li>
                        <li>32.2 Users grant the platform a revocable, non-exclusive license to use uploaded content for service provision, marketing, or promotion.</li>
                        <li>32.3 Users may not copy, modify, distribute, or reuse platform intellectual property without explicit permission.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        33. Returns & Claims
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>33.1 Buyers may request returns if items significantly differ from descriptions or images.</li>
                        <li>33.2 Returns must be requested within 48 hours of delivery, and items returned within 72 hours, unless otherwise agreed.</li>
                        <li>33.3 The platform holds funds until the dispute is resolved between buyer and seller.</li>
                        <li>33.4 Disputes escalate in the following order: direct resolution between buyer and seller → platform mediation → external legal recourse if unresolved.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        34. Amendments
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>34.1 The platform may update these T&Cs at any time.</li>
                        <li>34.2 Users will be notified of changes via email or platform notifications.</li>
                        <li>34.3 Continued use after updates constitutes acceptance of the new terms.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        35. Indemnities
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>35.1 Users indemnify the platform against claims, damages, or legal costs arising from their actions, breaches of these T&Cs, or violations of third-party rights.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        36. Dispute Resolution
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>36.1 Parties must attempt to resolve disputes amicably.</li>
                        <li>36.2 If unresolved, disputes may proceed to mediation via an independent expert.</li>
                        <li>36.3 Should mediation fail, disputes may escalate to arbitration or the relevant South African courts.</li>
                        <li>36.4 The platform may intervene to facilitate resolution but is not obligated to act as a legal arbitrator.</li>
                      </ul>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Seller’s Policy Tab */}
          {activeTab === "sellers" && (
            <div className="space-y-4 sm:space-y-6">
              <Card className="shadow-md border-gray-200">
                <CardHeader className="pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl flex items-center gap-3 mb-3 sm:mb-4 text-gray-800">
                    <Gavel className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 flex-shrink-0 text-blue-600" />
                    <span>Seller’s Policy</span>
                  </CardTitle>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <div className="text-blue-800 text-xs sm:text-sm space-y-2">
                      <div className="text-center">
                        <span>
                          <strong>Effective Date:</strong> 10 June 2025
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Platform:</strong>{" "}
                          <span className="break-all">www.rebookedsolutions.co.za</span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Platform Operator:</strong> ReBooked Solutions (Pty) Ltd
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Support:</strong>{" "}
                          <span className="break-all">legal@rebookedsolutions.co.za</span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Jurisdiction:</strong> Republic of South Africa
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Regulatory Compliance:</strong> Consumer Protection Act (Act 68 of 2008), Electronic Communications and Transactions Act (Act 25 of 2002), Protection of Personal Information Act (Act 4 of 2013)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">1. Listing Requirements</h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Sellers must provide accurate and complete information about each book, including title, author, edition, condition, and any defects.</li>
                        <li>Clear photos must be uploaded to verify the book’s condition.</li>
                        <li>Misleading or false listings are strictly prohibited.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">2. Pricing & Fees</h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Sellers set their own prices for books.</li>
                        <li>ReBooked Solutions charges a 10% service fee on every successful sale.</li>
                        <li>A delivery/shipping fee is added at checkout and paid by the buyer.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">3. Order Process & Payouts</h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Once an order is placed, the seller must package the book securely for collection.</li>
                        <li>Funds from sales are held for 24–48 hours after successful delivery to allow buyers time to confirm the book matches the listing.</li>
                        <li>If a buyer raises a complaint, funds are held until the case is resolved.</li>
                        <li>If the seller is at fault, the buyer receives a full refund, the seller forfeits the payout, and a fine may apply.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">4. Fine System (Incorrect or Misleading Books)</h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-2">To protect buyers and maintain trust, a tiered penalty system applies for sellers who provide incorrect or misleading books:</p>
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold text-gray-900">First Offense</p>
                          <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm sm:text-base">
                            <li>Buyer receives a full refund.</li>
                            <li>Seller receives no payout for the sale.</li>
                            <li>Seller is fined the delivery fee from their address to the buyer’s address.</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Second Offense</p>
                          <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm sm:text-base">
                            <li>Buyer receives a full refund.</li>
                            <li>Seller receives no payout for the sale.</li>
                            <li>Seller is fined the delivery fee plus R100 for misuse of ReBooked Solutions’ services.</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Third Offense</p>
                          <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm sm:text-base">
                            <li>Buyer receives a full refund.</li>
                            <li>Seller receives no payout for the sale.</li>
                            <li>Seller is fined the delivery fee plus R250.</li>
                            <li>Seller account may be suspended or permanently banned, pending review.</li>
                          </ul>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <p className="font-semibold text-gray-900">Zero-Tolerance Clause</p>
                        <p className="text-gray-700 text-sm sm:text-base">The following are treated as an immediate Level 3 offense:</p>
                        <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm sm:text-base">
                          <li>Fraudulent or counterfeit book listings.</li>
                          <li>Intentional scams or repeated misrepresentation.</li>
                          <li>Attempts to bypass or abuse ReBooked Solutions’ systems.</li>
                        </ul>
                        <p className="font-semibold text-gray-900">Penalty for Zero-Tolerance Violations:</p>
                        <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm sm:text-base">
                          <li>Buyer receives a full refund.</li>
                          <li>Seller receives no payout for the sale.</li>
                          <li>Seller is fined the delivery fee plus R250.</li>
                          <li>Seller is permanently banned. Any new accounts created by the seller will also be banned.</li>
                        </ul>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">5. Book Return & Donation Policy in Disputes</h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>If the buyer wants the incorrect book returned to the seller, the buyer must cover the return delivery cost.</li>
                        <li>If neither party wants the book back, ReBooked Solutions may donate the book to partner charities that support students in need.</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-2">This ensures that even disputes can have a positive impact.</p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">6. Dispute Resolution</h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">ReBooked Solutions will act as mediator in disputes and its decision will be final within the platform. Sellers may submit additional evidence if they believe a claim is unfair.</p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">7. Policy Enforcement</h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">ReBooked Solutions reserves the right to withhold payouts, apply fines, or suspend seller accounts for any breach of this policy. By selling on ReBooked Solutions, you agree to these rules to help maintain a fair, safe, and socially impactful marketplace.</p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Buyer’s Policy Tab */}
          {activeTab === "buyers" && (
            <div className="space-y-4 sm:space-y-6">
              <Card className="shadow-md border-gray-200">
                <CardHeader className="pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl flex items-center gap-3 mb-3 sm:mb-4 text-gray-800">
                    <ShoppingCart className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 flex-shrink-0 text-blue-600" />
                    <span>Buyer’s Policy</span>
                  </CardTitle>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <div className="text-blue-800 text-xs sm:text-sm space-y-2">
                      <div className="text-center">
                        <span>
                          <strong>Effective Date:</strong> 10 June 2025
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Platform:</strong>{" "}
                          <span className="break-all">www.rebookedsolutions.co.za</span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Platform Operator:</strong> ReBooked Solutions (Pty) Ltd
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Support:</strong>{" "}
                          <span className="break-all">legal@rebookedsolutions.co.za</span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Jurisdiction:</strong> Republic of South Africa
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Regulatory Compliance:</strong> Consumer Protection Act (Act 68 of 2008), Electronic Communications and Transactions Act (Act 25 of 2002), Protection of Personal Information Act (Act 4 of 2013)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base">This Buyer’s Policy outlines the responsibilities and rules all buyers agree to when using ReBooked Solutions. By purchasing on our platform, you agree to comply with this policy.</p>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">1. Accuracy of Information</h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Buyers must provide complete and accurate delivery details, including address, phone number, and email.</li>
                        <li>Any failed deliveries resulting from incorrect or incomplete information are the buyer’s responsibility.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">2. Order Process</h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Once an order is placed and marked as “Dispatched” by the seller, it cannot be cancelled.</li>
                        <li>Buyers must accept delivery within reasonable timeframes or collect from designated courier pickup points where applicable.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">3. Refunds & Returns</h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-2">Buyers may request a refund within 3 calendar days of delivery if:</p>
                      <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm sm:text-base">
                        <li>The book received is the wrong edition, title, or author.</li>
                        <li>The book has undisclosed major defects (e.g., missing pages, water damage).</li>
                        <li>The book is counterfeit or fraudulent.</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-2">All refund requests must include photographic evidence and a clear description of the issue.</p>
                      <div className="mt-3">
                        <p className="font-semibold text-gray-900">Refunds will not be granted for:</p>
                        <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm sm:text-base">
                          <li>Buyer’s remorse (e.g., “changed mind”).</li>
                          <li>Normal wear and tear of secondhand books.</li>
                          <li>Courier delays beyond the seller’s control.</li>
                        </ul>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">4. Return Responsibilities</h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>If a refund is approved and the buyer chooses to return the book, the buyer is responsible for the return delivery cost.</li>
                        <li>If the buyer does not return the book, ReBooked Solutions may arrange to collect and donate it to charity.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">5. Buyer Misconduct</h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">ReBooked Solutions reserves the right to suspend or permanently ban buyers who:</p>
                      <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm sm:text-base">
                        <li>Submit fraudulent or false refund claims.</li>
                        <li>Repeatedly fail to accept deliveries.</li>
                        <li>Attempt to abuse the platform’s refund or dispute system.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">6. Dispute Resolution</h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">In the event of a disagreement, ReBooked Solutions will mediate based on evidence provided by both buyer and seller. Our decision is final within the platform unless escalated externally (e.g., Ombud, NCC).</p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Refund Policy Tab */}
          {activeTab === "refunds" && (
            <div className="space-y-4 sm:space-y-6">
              <Card className="shadow-md border-gray-200">
                <CardHeader className="pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl flex items-center gap-3 mb-3 sm:mb-4 text-gray-800">
                    <RefreshCw className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 flex-shrink-0 text-blue-600" />
                    <span>Refund Policy</span>
                  </CardTitle>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <div className="text-blue-800 text-xs sm:text-sm space-y-2">
                      <div className="text-center">
                        <span>
                          <strong>Effective Date:</strong> 10 June 2025
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Platform:</strong>{" "}
                          <span className="break-all">www.rebookedsolutions.co.za</span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Platform Operator:</strong> ReBooked Solutions (Pty) Ltd
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Support:</strong>{" "}
                          <span className="break-all">
                            legal@rebookedsolutions.co.za
                          </span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Jurisdiction:</strong> Republic of South Africa
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Regulatory Compliance:</strong> Consumer Protection
                          Act (Act 68 of 2008), Electronic Communications and
                          Transactions Act (Act 25 of 2002), Protection of Personal
                          Information Act (Act 4 of 2013)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 py-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        Scope and Application
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        This Refund Policy applies to all users transacting on www.rebookedsolutions.co.za and governs the circumstances under which refunds may be issued. ReBooked Solutions operates solely as a digital intermediary between independent sellers and buyers and does not own, stock, inspect, or control inventory sold on the platform.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        While Sections 20 and 56 of the Consumer Protection Act (CPA) provide consumers the right to return defective goods within six months of delivery, ReBooked Solutions facilitates the peer-to-peer resale of secondhand textbooks and study materials. Accordingly, a platform-specific refund window applies as outlined below.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Refunds will be considered only if the request is submitted within three (3) calendar days of delivery or the estimated delivery date, and at least one of the following conditions applies:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base mb-3 sm:mb-4">
                        <li>The item has not been received within fourteen (14) business days of dispatch confirmation.</li>
                        <li>
                          The item materially differs from the listing, including but not limited to:
                          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700 text-sm sm:text-base">
                            <li>Wrong edition, title, or author.</li>
                            <li>Undisclosed major defects (e.g., missing pages, mold, water damage).</li>
                          </ul>
                        </li>
                        <li>Counterfeit or illegal reproduction.</li>
                        <li>Fraudulent or deceptive conduct by the seller.</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        All refund requests must be supported by clear photographic evidence and a formal complaint lodged to legal@rebookedsolutions.co.za within the specified timeframe. Buyers are required to retain proof of delivery, shipping labels, and original packaging where applicable.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        2. Refund Request Procedure
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        To request a refund, buyers must:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Submit a formal complaint within three (3) calendar days of delivery or estimated delivery date.</li>
                        <li>
                          Send an email to legal@rebookedsolutions.co.za including:
                          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700 text-sm sm:text-base">
                            <li>Clear photographs of the item received.</li>
                            <li>A detailed description of the issue.</li>
                            <li>Relevant supporting documents (e.g., proof of delivery, shipping labels, original packaging).</li>
                          </ul>
                        </li>
                        <li>Retain all original packaging and delivery documentation until the refund process is complete.</li>
                        <li>Incomplete or late requests may not be considered.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3. Exclusions
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Refunds will not be granted for the following:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Buyer's remorse or change of mind.</li>
                        <li>Normal wear and tear consistent with secondhand goods.</li>
                        <li>Delays caused by third-party couriers.</li>
                        <li>Items damaged due to misuse, negligence, or improper handling by the buyer.</li>
                        <li>Items returned with improper packaging that results in damage during transit.</li>
                        <li>Items not returned in original condition or packaging, or with missing components.</li>
                        <li>Refund requests submitted after the specified refund period.</li>
                        <li>Issues arising from incorrect or unintended use of the product.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        4. Buyer Responsibility and Verification
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Users must ensure that all delivery and payment information provided is accurate and complete. If a refund involves a payment previously processed:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>ReBooked Solutions will provide proof of transaction details, including recipient account information and timestamps.</li>
                        <li>Buyers disputing a payment are responsible for verifying that submitted bank details and delivery records are accurate.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5. Dispute Resolution
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        If a seller disputes a refund claim:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Both parties may be required to submit evidence.</li>
                        <li>The ReBooked Solutions Resolution Team will review documentation impartially.</li>
                        <li>Decisions made by the Resolution Team are final and binding.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        6. Refund Timeframes
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Approved refunds will typically be processed within 7–10 business days, subject to payment processor and banking timelines.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Refunds may be delayed if additional verification is required or if disputes arise.
                      </p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cancellation Policy Tab */}
          {activeTab === "cancellation" && (
            <div className="space-y-4 sm:space-y-6">
              <Card className="shadow-md border-gray-200">
                <CardHeader className="pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl flex items-center gap-3 mb-3 sm:mb-4 text-gray-800">
                    <Gavel className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 flex-shrink-0 text-blue-600" />
                    <span>Cancellation Policy</span>
                  </CardTitle>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <div className="text-blue-800 text-xs sm:text-sm space-y-2">
                      <div className="text-center">
                        <span>
                          <strong>Effective Date:</strong> 10 June 2025
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Platform:</strong>{" "}
                          <span className="break-all">www.rebookedsolutions.co.za</span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Platform Operator:</strong> ReBooked Solutions (Pty) Ltd
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Support:</strong>{" "}
                          <span className="break-all">
                            legal@rebookedsolutions.co.za
                          </span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Jurisdiction:</strong> Republic of South Africa
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Regulatory Compliance:</strong> Consumer Protection
                          Act (Act 68 of 2008), Electronic Communications and
                          Transactions Act (Act 25 of 2002), Protection of Personal
                          Information Act (Act 4 of 2013)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 py-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        2.1 Buyer Cancellations
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base mb-3 sm:mb-4">
                        <li>Buyers may cancel an order only if the item has not yet been marked as "Dispatched" by the seller on the platform.</li>
                        <li>Once an item is marked as dispatched, the transaction is binding, and buyers must follow the Refund Policy (Section 1) for returns or disputes.</li>
                        <li>Valid cancellations made prior to dispatch will be refunded in full to the original payment method within 5–10 business days, subject to delays from third-party payment processors. Buyers are responsible for ensuring payment information is accurate.</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        <strong>Important:</strong> Under the Electronic Communications and Transactions Act (ECTA), Section 44, ReBooked Solutions is an intermediary and not the direct seller of goods. The standard 7-day cooling-off period does not apply to peer-to-peer transactions unless the seller is a registered business that explicitly offers this option.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        ReBooked Solutions reserves the right to review or deny repeated or abusive cancellation patterns. Excessive cancellations may result in account review, restriction, or suspension.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        2.2 Seller Cancellations
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Sellers may cancel an order only under exceptional and justifiable circumstances, such as:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base mb-3 sm:mb-4">
                        <li>Stock unavailability due to prior offline sale or external factors.</li>
                        <li>Material listing errors (e.g., wrong edition, title, or pricing mistake).</li>
                        <li>Account or listing flagged for fraud, duplicate posting, or breach of platform terms.</li>
                      </ul>

                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                        Requirements for Seller Cancellations:
                      </h4>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base mb-3 sm:mb-4">
                        <li>Must be completed within 48 hours of receiving the order.</li>
                        <li>Seller must notify the buyer via in-platform messaging.</li>
                        <li>Seller must also notify ReBooked Solutions at legal@rebookedsolutions.co.za for tracking and transparency purposes.</li>
                      </ul>

                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                        Consequences of Unwarranted or Frequent Seller Cancellations:
                      </h4>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base mb-3 sm:mb-4">
                        <li>Temporary suspension of selling privileges.</li>
                        <li>Administrative penalties or listing restrictions.</li>
                        <li>Permanent account termination in cases of repeated violations or misconduct.</li>
                      </ul>

                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                        Platform Discretion:
                      </h4>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked Solutions reserves the right to cancel any order at its discretion, particularly in cases of:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base mb-3 sm:mb-4">
                        <li>Suspected fraudulent activity.</li>
                        <li>Misuse or manipulation of the platform.</li>
                        <li>Breaches of platform terms or this cancellation policy.</li>
                      </ul>

                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                        Tracking and Privacy:
                      </h4>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>All cancellations — whether buyer- or seller-initiated — must be traceable through the Order ID and Transaction Number.</li>
                        <li>For privacy and data protection, users will not be granted direct access to each other's contact details unless legally required.</li>
                      </ul>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Shipping & Delivery Policy Tab */}
          {activeTab === "shipping" && (
            <div className="space-y-4 sm:space-y-6">
              <Card className="shadow-md border-gray-200">
                <CardHeader className="pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl flex items-center gap-3 mb-3 sm:mb-4 text-gray-800">
                    <Package className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 flex-shrink-0 text-blue-600" />
                    <span>Shipping & Delivery Policy</span>
                  </CardTitle>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <div className="text-blue-800 text-xs sm:text-sm space-y-2">
                      <div className="text-center">
                        <span>
                          <strong>Effective Date:</strong> 10 June 2025
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Platform:</strong>{" "}
                          <span className="break-all">www.rebookedsolutions.co.za</span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Platform Operator:</strong> ReBooked Solutions (Pty) Ltd
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Support:</strong>{" "}
                          <span className="break-all">
                            legal@rebookedsolutions.co.za
                          </span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Jurisdiction:</strong> Republic of South Africa
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Regulatory Compliance:</strong> Consumer Protection
                          Act (Act 68 of 2008), Electronic Communications and
                          Transactions Act (Act 25 of 2002), Protection of Personal
                          Information Act (Act 4 of 2013)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3.1 Seller Shipping Responsibilities
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked Solutions facilitates deliveries using third-party couriers, primarily Bobgo, on behalf of sellers. Sellers remain fully responsible for preparing, packaging, and making the parcel available for collection.
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base mb-3 sm:mb-4">
                        <li>Parcels must be ready for handover within three (3) business days of payment confirmation.</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Sellers must ensure:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base mb-3 sm:mb-4">
                        <li>Packaging is secure, tamper-resistant, and appropriate for the item.</li>
                        <li>Items match the listed condition accurately.</li>
                        <li>Prompt response to courier collection requests.</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Failed collection attempts:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>If the parcel is not ready for Bobgo's first collection attempt, ReBooked Solutions will cover the first rescheduling fee.</li>
                        <li>
                          Subsequent failed collections due to seller negligence may result in:
                          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700 text-sm sm:text-base">
                            <li>Charges billed to the seller,</li>
                            <li>A forced refund to the buyer, and</li>
                            <li>Temporary suspension of the seller's account pending review.</li>
                          </ul>
                        </li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3.2 Delivery Timeframes
                      </h3>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base mb-3 sm:mb-4">
                        <li>Standard delivery: 2–7 business days from courier collection, depending on regional distance and Bobgo's capacity.</li>
                        <li>ReBooked Solutions provides tracking updates via email or user dashboard.</li>
                        <li>Delivery dates cannot be guaranteed, but sellers and buyers are encouraged to monitor status and act promptly.</li>
                        <li>Buyers should collect from designated pickup points on time to avoid failed delivery issues.</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3.3 Delays and Consumer Protection
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        In line with the Consumer Protection Act (Section 19(4)), if delivery is not completed:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base mb-3 sm:mb-4">
                        <li>Within the agreed timeframe, or</li>
                        <li>Within 14 business days from collection (and the delay is not the buyer's fault),</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        buyers may:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base mb-3 sm:mb-4">
                        <li>Cancel the transaction and request a full refund, or</li>
                        <li>Agree to an extended delivery window at their discretion.</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        Courier-related issues (delays, damage, or misdelivery) will first be investigated by ReBooked Solutions in collaboration with Bobgo.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        3.4 Failed Deliveries & Redelivery
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Delivery failure due to:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base mb-3 sm:mb-4">
                        <li>Incorrect or incomplete delivery address,</li>
                        <li>Buyer's unavailability, or</li>
                        <li>Failure to collect from designated pickup points,</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        will generally result in:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Buyers bearing any redelivery costs,</li>
                        <li>Refunds issued only if the seller is at fault (e.g., wrong item sent or incorrect packaging),</li>
                        <li>Unclaimed parcels after 7 calendar days may be cancelled without refund.</li>
                      </ul>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Return Policy Tab */}
          {activeTab === "returns" && (
            <div className="space-y-4 sm:space-y-6">
              <Card className="shadow-md border-gray-200">
                <CardHeader className="pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl flex items-center gap-3 mb-3 sm:mb-4 text-gray-800">
                    <Undo2 className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 flex-shrink-0 text-blue-600" />
                    <span>Return Policy</span>
                  </CardTitle>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <div className="text-blue-800 text-xs sm:text-sm space-y-2">
                      <div className="text-center">
                        <span>
                          <strong>Effective Date:</strong> 10 June 2025
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Platform:</strong>{" "}
                          <span className="break-all">www.rebookedsolutions.co.za</span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Platform Operator:</strong> ReBooked Solutions (Pty) Ltd
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Support:</strong>{" "}
                          <span className="break-all">
                            legal@rebookedsolutions.co.za
                          </span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Jurisdiction:</strong> Republic of South Africa
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Regulatory Compliance:</strong> Consumer Protection
                          Act (Act 68 of 2008), Electronic Communications and
                          Transactions Act (Act 25 of 2002), Protection of Personal
                          Information Act (Act 4 of 2013)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        4.1 Return Grounds
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Returns are accepted only under the following conditions:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Incorrect item delivered (e.g., different title, author, or edition).</li>
                        <li>Severe damage or defects not disclosed in the listing.</li>
                        <li>Item is confirmed counterfeit or an illegal reproduction.</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3 mb-3 sm:mb-4">
                        All returns must be initiated within three (3) calendar days of delivery by contacting legal@rebookedsolutions.co.za for written return authorization. Returns sent without prior approval will be rejected.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Buyers are responsible for:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Retaining original packaging and materials.</li>
                        <li>Returning items using a trackable, insured shipping method.</li>
                        <li>Sharing tracking details with ReBooked Solutions once shipped.</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        Return shipping costs and any associated courier fees are the buyer's responsibility, except in cases of major seller misconduct, such as confirmed fraud, counterfeit goods, or undisclosed serious defects.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        4.2 Return Exclusions
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Returns will not be accepted in the following instances:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Disputes over minor flaws or typical wear associated with secondhand items.</li>
                        <li>Buyer's remorse or dissatisfaction after receiving the item.</li>
                        <li>Damage caused after delivery due to buyer negligence, improper handling, or poor storage.</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        ReBooked Solutions will not cover return shipping, packaging, or handling fees for any of the above exclusions.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        4.3 Inspection and Refund Processing
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        All returned items are subject to inspection upon receipt. Refunds will only be issued if:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>The return is approved based on the verified issue.</li>
                        <li>The item is returned in its original condition with all components.</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        If approved, refunds will be processed within 5–10 business days, covering the item's purchase price only. Shipping costs (both original and return) will not be refunded unless a major platform-verified issue is found.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        ReBooked Solutions serves as a neutral mediator in these cases, but reserves final decision-making authority on any return or refund case.
                      </p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dispute Resolution Policy Tab */}
          {activeTab === "disputes" && (
            <div className="space-y-4 sm:space-y-6">
              <Card className="shadow-md border-gray-200">
                <CardHeader className="pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                  <CardTitle className="text-2xl sm:text-3xl lg:text-4xl flex items-center gap-3 mb-3 sm:mb-4 text-gray-800">
                    <FileText className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 flex-shrink-0 text-blue-600" />
                    <span>Dispute Resolution Policy</span>
                  </CardTitle>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm">
                    <div className="text-blue-800 text-xs sm:text-sm space-y-2">
                      <div className="text-center">
                        <span>
                          <strong>Effective Date:</strong> 10 June 2025
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Platform:</strong>{" "}
                          <span className="break-all">www.rebookedsolutions.co.za</span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Platform Operator:</strong> ReBooked Solutions (Pty) Ltd
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          <strong>Support:</strong>{" "}
                          <span className="break-all">
                            legal@rebookedsolutions.co.za
                          </span>
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Jurisdiction:</strong> Republic of South Africa
                        </span>
                      </div>
                      <div className="text-center">
                        <span>
                          <strong>Regulatory Compliance:</strong> Consumer Protection
                          Act (Act 68 of 2008), Electronic Communications and
                          Transactions Act (Act 25 of 2002), Protection of Personal
                          Information Act (Act 4 of 2013)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6">
                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5.1 Initiating a Dispute
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        If a buyer or seller believes that a transaction has resulted in unfair treatment, fraud, or a breach of ReBooked Solutions' policies, a formal dispute must be submitted within seven (7) calendar days of the event by emailing legal@rebookedsolutions.co.za.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        The email must include:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Transaction reference number</li>
                        <li>Order ID</li>
                        <li>A detailed description of the dispute</li>
                        <li>All supporting evidence (e.g., photographs, courier tracking, communication history)</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        Incomplete or unsupported disputes may be closed without investigation.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5.2 Dispute Review Process
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        Once a valid dispute is received, ReBooked Solutions will:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Acknowledge receipt within 2 business days</li>
                        <li>Investigate the matter within 7–10 business days</li>
                        <li>Request additional evidence if required</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4 mt-3">
                        Disputes will be assessed based on:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Principles of fairness under the Consumer Protection Act (CPA)</li>
                        <li>Objective review of all submitted documentation</li>
                        <li>Verified transaction history and user conduct</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        ReBooked Solutions will deliver a written decision outlining the resolution. This decision will be final and binding within the platform, unless escalated externally (see 5.4).
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5.3 Platform Liability and Limitation
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked Solutions acts solely as a digital intermediary and is not a contracting party to transactions between users. In accordance with Section 56 of the CPA, sellers are responsible for the goods they list.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        ReBooked Solutions accepts no liability for:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>Product condition, accuracy, or authenticity</li>
                        <li>Courier errors or delays</li>
                        <li>Buyer or seller misconduct</li>
                        <li>Indirect, special, or consequential damages</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3 mb-3 sm:mb-4">
                        The platform's maximum liability is limited to the commission earned on the disputed transaction.
                      </p>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        By using the platform, users agree to these limitations and waive any additional claims against ReBooked Solutions.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                        5.4 External Escalation
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mb-3 sm:mb-4">
                        If either party is dissatisfied with the internal outcome, they may escalate to:
                      </p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm sm:text-base">
                        <li>The National Consumer Commission (NCC)</li>
                        <li>The Consumer Goods and Services Ombud (CGSO)</li>
                        <li>Formal legal proceedings under South African law</li>
                      </ul>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base mt-3">
                        ReBooked Solutions will comply with all lawful investigations but will not cover any legal costs incurred by either party.
                      </p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <Card className="mt-8 sm:mt-12 shadow-lg border-gray-200">
          <CardHeader className="pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl flex items-center gap-3 text-gray-800">
              <Mail className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 text-blue-600" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 sm:px-8 py-6 sm:py-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-6 sm:p-8 shadow-sm">
              <p className="text-blue-800 mb-4 sm:mb-6 text-base sm:text-lg font-medium">
                All queries, complaints, and policy-related matters must be
                directed to:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <p className="text-blue-700 text-sm sm:text-base">
                    <strong>Email:</strong>{" "}
                    <span className="break-all">
                      legal@rebookedsolutions.co.za
                    </span>
                  </p>
                  <p className="text-blue-700 text-sm sm:text-base">
                    <strong>Business Hours:</strong> Monday–Friday, 09:00–17:00
                    (SAST)
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-blue-700 text-sm sm:text-base">
                    <strong>Website:</strong>{" "}
                    <span className="break-all">
                      www.rebookedsolutions.co.za
                    </span>
                  </p>
                  <p className="text-blue-700 text-sm sm:text-base">
                    <strong>Company:</strong> ReBooked Solutions (Pty) Ltd
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Policies;
