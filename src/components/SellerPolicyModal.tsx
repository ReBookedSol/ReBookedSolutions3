import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Shield, AlertTriangle, CheckCircle, BookOpen } from "lucide-react";

interface SellerPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SellerPolicyModal = ({ isOpen, onClose }: SellerPolicyModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[90vw] sm:max-w-3xl max-h-[85vh] mx-auto my-auto overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-3 text-book-700 text-lg sm:text-xl">
                <Shield className="h-5 w-5 text-book-600" />
                Marketplace Rules & Responsibilities
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Please read carefully — continuing requires agreement to these rules.
              </DialogDescription>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                <DollarSign className="h-3 w-3 mr-1" /> Fee: 10%
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Required to list
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[72vh] pr-4">
          <div className="space-y-6 text-sm text-gray-800">
            <div className="rounded-lg border border-book-200 bg-book-50 p-4">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-book-700 mt-1" />
                <div>
                  <h3 className="font-semibold text-book-800">Welcome to ReBooked Marketplace</h3>
                  <p className="text-gray-700 mt-1">By listing books on ReBooked, you agree to follow these policies which protect both buyers and sellers. ReBooked Solutions operates solely as a digital intermediary between independent sellers and buyers.</p>
                </div>
              </div>
            </div>

            {/* Highlighted fee banner */}
            <div className="rounded-lg p-4 border border-yellow-200 bg-yellow-50 flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-800 font-medium">Platform Fee</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-900 mt-1">10% service fee on every successful sale</p>
                <p className="text-sm text-yellow-800 mt-1">A delivery/shipping fee is added at checkout and paid by the buyer.</p>
              </div>
              <div className="hidden sm:block text-right">
                <DollarSign className="h-8 w-8 text-yellow-800" />
              </div>
            </div>

            {/* 1. Account Registration & Eligibility */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                1. Account Registration & Eligibility
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Users must register with accurate and truthful information.</li>
                <li>Only one account per user is permitted. Multiple accounts or attempts to circumvent rules may result in suspension or termination.</li>
                <li>Users are responsible for account security. Report suspicious activity immediately to info@rebookedsolutions.co.za.</li>
                <li>Buyers and Sellers must have legal capacity to contract under South African law.</li>
              </ul>
            </section>

            {/* 2. Listing & Pricing Rules */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                2. Listing & Pricing Rules
              </h3>
              <div className="space-y-3 ml-6">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Listing Requirements</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm mt-1">
                    <li>Provide accurate book details, including title, author, edition, condition, and defects.</li>
                    <li>Upload clear photos; stock or AI-generated images are prohibited.</li>
                    <li className="font-medium">Misleading or false listings are strictly prohibited.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Pricing & Fees</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm mt-1">
                    <li>Sellers set their own prices.</li>
                    <li className="font-semibold text-book-800">ReBooked Solutions charges a <span className="text-book-700">10% service fee</span> on the book's sale price for every successful transaction.</li>
                    <li>Delivery/shipping fees are added at checkout and paid by the buyer.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Order Process & Payouts</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm mt-1">
                    <li>Once an order is placed, the seller must securely package the book for collection via Bobgo.</li>
                    <li>Funds are held until delivery confirmation or resolution of disputes.</li>
                    <li>If a buyer files a valid complaint, funds remain on hold until the case is resolved.</li>
                    <li>Sellers at fault for misrepresentation forfeit payouts and may incur fines.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. Fine System */}
            <section className="space-y-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                3. Fine System (Incorrect or Misleading Books)
              </h3>
              <p className="text-gray-700">ReBooked Solutions operates a tiered fine system to protect buyers and maintain marketplace integrity. Fines will be deducted from seller wallets or withheld from payouts.</p>

              <div className="grid gap-3 sm:grid-cols-3 ml-6">
                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <h4 className="font-semibold">First Offense</h4>
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
                    <li>Buyer receives a full refund.</li>
                    <li>Seller receives no payout for the sale.</li>
                    <li>Seller is fined the delivery fee.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <h4 className="font-semibold">Second Offense</h4>
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
                    <li>Buyer receives a full refund.</li>
                    <li>Seller receives no payout for the sale.</li>
                    <li>Seller is fined the delivery fee plus <span className="font-medium">R100</span>.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <h4 className="font-semibold">Third Offense</h4>
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 space-y-1">
                    <li>Buyer receives a full refund.</li>
                    <li>Seller receives no payout for the sale.</li>
                    <li>Seller is fined the delivery fee plus <span className="font-medium">R250</span>.</li>
                    <li>Seller account may be suspended or permanently banned.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-3 p-3 rounded-lg border border-red-200 bg-red-50 ml-6">
                <h4 className="font-semibold text-red-800">Zero-Tolerance Clause</h4>
                <p className="text-sm text-red-700 mt-1">The following are treated as an immediate Level 3 offense:</p>
                <ul className="list-disc pl-5 mt-2 text-sm text-red-700 space-y-1">
                  <li>Fraudulent or counterfeit book listings.</li>
                  <li>Intentional scams or repeated misrepresentation.</li>
                  <li>Attempts to bypass or abuse ReBooked Solutions' systems.</li>
                </ul>

                <div className="mt-2">
                  <p className="font-semibold text-red-800">Penalty for Zero-Tolerance Violations:</p>
                  <ul className="list-disc pl-5 mt-2 text-sm text-red-700 space-y-1">
                    <li>Buyer receives a full refund.</li>
                    <li>Seller receives no payout for the sale.</li>
                    <li>Seller is fined the delivery fee plus <span className="font-medium">R250</span>.</li>
                    <li>Seller is permanently banned. Any new accounts created by the seller will also be banned.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 4. Shipping & Delivery */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                4. Shipping & Delivery (Bobgo)
              </h3>
              <div className="space-y-3 ml-6">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Seller Responsibility</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm mt-1">
                    <li>Sellers prepare, package, and make items available for Bobgo collection within 3 business days of payment confirmation.</li>
                    <li>Packaging must be secure and tamper-resistant.</li>
                    <li>Sellers respond promptly to Bobgo collection requests.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Delivery Timeframes</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm mt-1">
                    <li>Standard delivery: 2–7 business days from collection.</li>
                    <li>Tracking updates provided via Bobgo; buyers should monitor delivery status.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. Refund & Return Policy */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                5. Refund & Return Policy
              </h3>
              <div className="space-y-3 ml-6">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Refund Grounds</p>
                  <p className="text-gray-700 text-sm mt-1">Refunds are approved within 3 calendar days of delivery for:</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm mt-1">
                    <li>Incorrect item (wrong edition, title, author)</li>
                    <li>Undisclosed major defects (e.g., missing pages, water damage, mold)</li>
                    <li>Counterfeit or illegal reproduction</li>
                    <li>Fraudulent or deceptive seller conduct</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Return Responsibilities</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm mt-1">
                    <li>Buyers pay return shipping via Bobgo, unless the seller is at fault</li>
                    <li>Items must be returned securely packaged and in original condition</li>
                    <li>If the buyer does not return the book, ReBooked Solutions may donate it to partner charities</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Refund Timeframes</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700 text-sm mt-1">
                    <li>Approved refunds processed within 7–10 business days, subject to banking/payment processor timelines</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 6. Buyer Responsibilities */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                6. Buyer Responsibilities
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Provide complete and accurate delivery information</li>
                <li>Cannot cancel orders after the seller marks them "Dispatched"</li>
                <li>Accept deliveries promptly or collect from Bobgo pickup points</li>
                <li>Report discrepancies within 3 calendar days</li>
                <li>Repeated fraud, abuse, or delivery non-compliance may result in suspension or permanent ban</li>
              </ul>
            </section>

            {/* 7. Prohibited Conduct & Items */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                7. Prohibited Conduct & Items
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Only textbooks and study materials are allowed</li>
                <li>Prohibited items: counterfeit, illegal, adult content, weapons, drugs, digital copies, or any item violating law</li>
                <li>Misrepresentation, harassment, fraud, or platform abuse is strictly prohibited</li>
                <li>Violations may result in account suspension, permanent ban, or reporting to authorities</li>
              </ul>
            </section>

            {/* 8. Dispute Resolution */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                8. Dispute Resolution
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Users should first attempt direct resolution via platform messages</li>
                <li>ReBooked Solutions mediates disputes impartially; its decisions are final within the platform</li>
                <li>External escalation may include the Consumer Commission, Ombud, or South African courts if unresolved</li>
              </ul>
            </section>

            {/* 9. Liability & Compliance */}
            <section className="space-y-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                9. Liability & Compliance
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>ReBooked Solutions is a platform intermediary. We do not own, inspect, or guarantee items</li>
                <li>Users are responsible for legal compliance, tax obligations, and accurate information</li>
                <li>Statutory rights under the Consumer Protection Act (CPA), ECTA, and POPIA remain protected</li>
              </ul>
            </section>

            <div className="mt-2 text-xs text-gray-500">By checking the agreement box on the listing form you confirm that you have read and agree to these Marketplace Rules & Responsibilities.</div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SellerPolicyModal;
