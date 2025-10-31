import { ShieldCheck, ShieldAlert, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BuyersProtectionDialogProps {
  triggerClassName?: string;
  triggerVariant?: "link" | "ghost" | "secondary" | "outline" | "default" | "destructive";
  triggerLabel?: string;
  triggerProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

const BuyersProtectionDialog = ({
  triggerClassName,
  triggerVariant = "link",
  triggerLabel = "Buyer Protection",
  triggerProps,
}: BuyersProtectionDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size="sm"
          className={triggerClassName}
          {...triggerProps}
        >
          <ShieldCheck className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" /> Buyer Protection
          </DialogTitle>
          <DialogDescription>
            We keep your money safe until you receive the correct book.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-relaxed text-gray-700">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
            <p>
              Your payment is held securely and is only released to the seller after
              delivery has been confirmed or the order is successfully completed.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
            <p>
              If the book is not delivered, arrives significantly different to the listing,
              or is the wrong item, you may be eligible for a full refund.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
            <p>
              Report any issues through your Orders page. Our team will assist with
              returns, replacements, or refunds based on the outcome.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <p>
              Keep all communication and proof of the issue (photos, tracking updates).
              This helps us resolve your case quickly.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5" />
            <p>
              Normal wear is expected for used books. Buyer Protection covers
              non-delivery and items that are not as described.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyersProtectionDialog;
