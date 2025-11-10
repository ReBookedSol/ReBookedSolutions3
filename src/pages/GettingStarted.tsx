import React from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  ShieldAlert,
  CheckCircle,
  Truck,
  CreditCard,
  ClipboardList,
  Image as ImageIcon,
  DollarSign,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Info,
  BookOpen,
  MessageCircle,
  ChevronRight,
  AlertCircle,
  Phone,
} from "lucide-react";

const TimelineStep = ({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) => (
  <li className="relative pl-10">
    <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-book-100 text-book-700 flex items-center justify-center font-semibold border border-book-200">
      {n}
    </div>
    <div className="text-gray-900 font-medium mb-1">{title}</div>
    <div className="text-gray-700 text-sm leading-relaxed">{children}</div>
  </li>
);

const GettingStarted = () => {
  return (
    <Layout>
      <SEO
        title="Getting Started | ReBooked Solutions"
        description="Learn how to become a seller or buyer on ReBooked Solutions. Step-by-step guides, packaging guidelines, buyer protection, and important disclaimers."
        keywords="getting started, how to sell, how to buy, packaging guidelines, seller guide, buyer guide, buyer protection, rebooked solutions"
        url="https://www.rebookedsolutions.co.za/getting-started"
      />

      {/* Hero */}
      <section id="top" className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-3">
              Getting Started with ReBooked Solutions
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl leading-relaxed mb-6">
              Whether you're selling textbooks or buying affordable editions, we've made the process simple and secure. Follow these guides to get started in minutes.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-book-600 text-white hover:bg-book-700 shadow-md">
                <a href="#seller" aria-label="Jump to Becoming a Seller">
                  <Package className="mr-2 h-5 w-5" /> I'm selling
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <a href="#buyer" aria-label="Jump to Becoming a Buyer">
                  <ShoppingCart className="mr-2 h-5 w-5" /> I'm buying
                </a>
              </Button>
            </div>
          </div>

          {/* Quick visual guide */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">How it works at a glance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Seller steps */}
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-book-50 to-white p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 text-gray-900 mb-2">
                  <div className="p-2 bg-book-100 rounded-lg">
                    <Package className="h-5 w-5 text-book-700" />
                  </div>
                  <span className="font-semibold text-base">List</span>
                </div>
                <p className="text-gray-600 text-sm">Add photos, price, and condition details</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-book-50 to-white p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 text-gray-900 mb-2">
                  <div className="p-2 bg-book-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-book-700" />
                  </div>
                  <span className="font-semibold text-base">Confirm</span>
                </div>
                <p className="text-gray-600 text-sm">Approve the sale within 48 hours</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-book-50 to-white p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 text-gray-900 mb-2">
                  <div className="p-2 bg-book-100 rounded-lg">
                    <Truck className="h-5 w-5 text-book-700" />
                  </div>
                  <span className="font-semibold text-base">Ship</span>
                </div>
                <p className="text-gray-600 text-sm">Print your waybill, courier collects</p>
              </div>
              {/* Buyer steps */}
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 text-gray-900 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-700" />
                  </div>
                  <span className="font-semibold text-base">Search</span>
                </div>
                <p className="text-gray-600 text-sm">Find the right edition and price</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 text-gray-900 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-700" />
                  </div>
                  <span className="font-semibold text-base">Pay</span>
                </div>
                <p className="text-gray-600 text-sm">Secure checkout with Paystack</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 text-gray-900 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-blue-700" />
                  </div>
                  <span className="font-semibold text-base">Track</span>
                </div>
                <p className="text-gray-600 text-sm">Real-time delivery updates</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main content */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            {/* Seller Section */}
            <Card id="seller" className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-2xl">
                  <Package className="w-6 h-6 mr-2 text-book-600" /> Becoming a Seller
                </CardTitle>
                <p className="text-gray-600 text-sm">Everything you need to list and ship your book confidently.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-4 bg-white/60">
                    <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                      <ClipboardList className="w-4 h-4 mr-2 text-book-600" /> Requirements
                    </h3>
                    <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                      <li>Valid email address and South African phone number.</li>
                      <li>Banking setup for payouts after successful sales.</li>
                      <li>Only list genuine books with accurate condition details.</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4 bg-white/60">
                    <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-2 text-book-600" /> Best practices
                    </h3>
                    <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                      <li>Upload clear, well‑lit photos of the book cover and spine.</li>
                      <li>Price competitively; factor in condition and edition.</li>
                      <li>Respond to orders within 48 hours to avoid cancellation.</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-gray-200 p-0 overflow-hidden">
                  <div className="px-5 py-4 bg-gradient-to-r from-book-50 to-transparent border-b border-gray-200">
                    <h3 className="text-base font-semibold text-book-800 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" /> How it works
                    </h3>
                  </div>
                  <div className="p-5">
                    <ol className="relative space-y-5 border-l border-gray-200 pl-6">
                      <TimelineStep n={1} title="Create an account and verify your email.">
                        Already have an account? Just log in.
                      </TimelineStep>
                      <TimelineStep n={2} title="Complete your payout setup.">
                        Enable secure transfers after sales. Go to {" "}
                        <Link to="/banking-setup" className="text-book-700 underline">Banking Setup</Link>.
                      </TimelineStep>
                      <TimelineStep n={3} title="List your book with photos, price, and condition.">
                        Accurate details help buyers decide faster.
                      </TimelineStep>
                      <TimelineStep n={4} title="Confirm the order within 48 hours when notified.">
                        Orders auto‑cancel if not confirmed in time.
                      </TimelineStep>
                      <TimelineStep n={5} title="Receive your waybill (shipping label), print and affix to the package.">
                        We email the waybill and add it to your dashboard right after you confirm. Paste it on the padded envelope so the courier can collect and route it correctly.
                      </TimelineStep>
                    </ol>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link to="/register"><Button variant="default"><ArrowRight className="mr-2" /> Sign up</Button></Link>
                      <Link to="/create-listing"><Button variant="outline">Create a listing</Button></Link>
                    </div>
                  </div>
                </div>

                <div id="packaging-guidelines" className="rounded-lg border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-book-600" />
                    <h4 className="text-base font-semibold text-gray-900">Packaging Guidelines</h4>
                  </div>
                  <p className="text-gray-700 mb-3 text-sm">
                    To reduce the risk of damage during transit, use padded envelopes and protective inner wrapping.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Do</h5>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />Use a padded envelope sized so the book cannot move around.</li>
                        <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />Wrap the book in bubble wrap or kraft paper.</li>
                        <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />Seal edges securely with strong packing tape.</li>
                        <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />Include order number and return details inside.</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Waybill tips</h5>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex gap-2"><ShieldCheck className="w-4 h-4 text-blue-700 mt-0.5" />Place the printed label flat on the outside (not a seam).</li>
                        <li className="flex gap-2"><ShieldCheck className="w-4 h-4 text-blue-700 mt-0.5" />Cover with clear tape so it stays readable.</li>
                        <li className="flex gap-2"><ShieldCheck className="w-4 h-4 text-blue-700 mt-0.5" />Ensure the barcode isn’t wrinkled or bent.</li>
                        <li className="flex gap-2"><ShieldCheck className="w-4 h-4 text-blue-700 mt-0.5" />No printer? Clearly handwrite recipient name, full delivery address, phone number, order number and courier reference (if provided) on the padded envelope — large, legible, and visible.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-700">Example padded envelopes (external links):</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>
                        <a
                          href="https://www.waltons.co.za/buy/unbranded-protective-envelopes-padded-size-4-240mm-x-330mm-w916#:~:text=Introducing%20the%20Unbranded%20Protective%20Envelopes%20Padded%20Size%204%2C,important%20documents%2C%20photos%2C%20and%20other%20items%20during%20transit"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-book-700 hover:underline inline-flex items-center"
                        >
                          Waltons – Unbranded Protective Envelopes <ArrowUpRight className="ml-1 w-3 h-3" />
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://www.pnp.co.za/mailite-padded-envelope-no-4-x-50/p/000000000000208659_CS1"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-book-700 hover:underline inline-flex items-center"
                        >
                          Pick n Pay – Mailite Padded Envelope <ArrowUpRight className="ml-1 w-3 h-3" />
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://www.officenational.co.za/envelopes/padded/padded-envelopes-150-x-210mm-10-pack-gs103042072"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-book-700 hover:underline inline-flex items-center"
                        >
                          Office National – Padded Envelopes <ArrowUpRight className="ml-1 w-3 h-3" />
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://www.checkers.co.za/department/stationery-and-crafts/office-supplies/envelopes-and-courier-3-6707a53fc927aad4bab8db80?msockid=1895d113a8f5699a198bc73aa93c68c0"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-book-700 hover:underline inline-flex items-center"
                        >
                          Checkers – Envelopes & Courier Supplies <ArrowUpRight className="ml-1 w-3 h-3" />
                        </a>
                      </li>
                    </ul>
                  </div>

                  <Alert variant="destructive" className="mt-5">
                    <ShieldAlert className="w-5 h-5" />
                    <AlertTitle>Important Disclaimer</AlertTitle>
                    <AlertDescription>
                      The platform is not responsible for damage caused during transit. Sellers are responsible for packaging items securely.
                    </AlertDescription>
                  </Alert>

                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                    <Truck className="w-4 h-4" />
                    Compare courier options on the <Link to="/shipping" className="text-book-700 underline">Shipping</Link> page.
                  </div>
                </div>

                <div className="pt-2">
                  <a href="#top" className="text-sm text-book-700 underline">Back to top</a>
                </div>
              </CardContent>
            </Card>

            {/* Buyer Section */}
            <Card id="buyer" className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-2xl">
                  <ShoppingCart className="w-6 h-6 mr-2 text-book-600" /> Becoming a Buyer
                </CardTitle>
                <p className="text-gray-600 text-sm">What to expect when purchasing through ReBooked Solutions.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-4 bg-white/60">
                    <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                      <ClipboardList className="w-4 h-4 mr-2 text-book-600" /> Requirements
                    </h3>
                    <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                      <li>Valid email address for order updates and receipts.</li>
                      <li>Secure payment method (processed by Paystack).</li>
                    </ul>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4 bg-white/60">
                    <h3 className="text-base font-semibold text-gray-900 mb-2 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-book-600" /> What you get
                    </h3>
                    <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                      <li>Protected checkout and receipts via email.</li>
                      <li>Shipment tracking once courier is booked.</li>
                      <li>Automatic refund if seller doesn’t confirm in 48 hours.</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-gray-200 p-0 overflow-hidden">
                  <div className="px-5 py-4 bg-gradient-to-r from-book-50 to-transparent border-b border-gray-200">
                    <h3 className="text-base font-semibold text-book-800 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" /> How it works
                    </h3>
                  </div>
                  <div className="p-5">
                    <ol className="relative space-y-5 border-l border-gray-200 pl-6">
                      <TimelineStep n={1} title="Browse available books and compare options.">
                        Use filters to find the right edition and condition.
                      </TimelineStep>
                      <TimelineStep n={2} title="Click Buy Now and complete secure payment.">
                        Payments are processed by Paystack.
                      </TimelineStep>
                      <TimelineStep n={3} title="Wait for seller confirmation (within 48 hours).">
                        You’ll be notified via email and notifications.
                      </TimelineStep>
                      <TimelineStep n={4} title="Track your delivery once shipping is arranged.">
                        Follow progress from your dashboard and notifications.
                      </TimelineStep>
                    </ol>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link to="/books"><Button variant="default"><ArrowRight className="mr-2" /> Browse books</Button></Link>
                      <Link to="/shipping"><Button variant="outline">View shipping options</Button></Link>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-md p-4">
                  <ShieldCheck className="w-4 h-4 mt-0.5" />
                  <p>
                    Buyer protection: after delivery, if there are no complaints within 24 hours, payment is released to the seller. This helps prevent scams while keeping transactions fair.
                  </p>
                </div>

                <div className="text-sm text-gray-700">
                  Please also read our <Link to="/policies" className="text-book-700 underline">Seller’s Policy</Link> and <Link to="/policies" className="text-book-700 underline">Buyer’s Policy</Link> for full details.
                </div>

                <div className="pt-2">
                  <a href="#top" className="text-sm text-book-700 underline">Back to top</a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">On this page</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <nav className="flex flex-col text-sm">
                  <a href="#seller" className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-book-50 hover:text-book-800">
                    <Package className="w-4 h-4 text-book-600" />
                    <span>Becoming a Seller</span>
                    <ChevronRight className="ml-auto w-4 h-4 text-gray-400" />
                  </a>
                  <a href="#packaging-guidelines" className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-book-50 hover:text-book-800">
                    <Info className="w-4 h-4 text-book-600" />
                    <span>Packaging Guidelines</span>
                    <ChevronRight className="ml-auto w-4 h-4 text-gray-400" />
                  </a>
                  <a href="#buyer" className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-book-50 hover:text-book-800">
                    <ShoppingCart className="w-4 h-4 text-book-600" />
                    <span>Becoming a Buyer</span>
                    <ChevronRight className="ml-auto w-4 h-4 text-gray-400" />
                  </a>
                </nav>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <Link to="/create-listing">
                  <Button className="w-full bg-book-600 hover:bg-book-700 text-white shadow-sm" aria-label="Create a listing">
                    <Package className="w-4 h-4" />
                    Create a listing
                  </Button>
                </Link>
                <Link to="/books">
                  <Button variant="outline" className="w-full justify-between" aria-label="Browse books">
                    <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" />Browse books</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Button>
                </Link>
                <Link to="/shipping">
                  <Button variant="outline" className="w-full justify-between" aria-label="Check shipping">
                    <span className="flex items-center gap-2"><Truck className="w-4 h-4" />Check shipping</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Need help?</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-gray-700 space-y-3">
                <div className="flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 mt-0.5 text-book-600" />
                  <p>Check our FAQ or contact support if you’re stuck.</p>
                </div>
                <div className="flex gap-2">
                  <Link to="/faq"><Button size="sm" variant="outline">FAQ</Button></Link>
                  <Link to="/contact"><Button size="sm" className="bg-book-600 hover:bg-book-700 text-white">Contact Us</Button></Link>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default GettingStarted;
