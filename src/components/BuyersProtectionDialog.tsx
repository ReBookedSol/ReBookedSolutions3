import React from "react";
import React from "react";
import { ShieldCheck, ShieldAlert, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BuyersProtectionDialogProps {
  triggerClassName?: string;
  triggerVariant?: "link" | "ghost" | "secondary" | "outline" | "default" | "destructive";
  triggerLabel?: string;
  triggerProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

const BuyersProtectionDialog = ({
  triggerClassName,
  triggerVariant = "outline",
  triggerLabel = "Buyer Protection",
  triggerProps,
}: BuyersProtectionDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size="sm"
          className={cn("rounded-md px-3 py-1 gap-2", triggerClassName)}
          {...triggerProps}
        >
          <ShieldCheck className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-xl p-6 sm:p-8 shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            <span>Buyer Protection</span>
          </DialogTitle>
          <DialogDescription className="mt-1">
            Your funds are protected — we only release payment to the seller after you
            confirm receipt of the correct book.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm leading-relaxed text-gray-700 mt-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
            <p>
              Payments are held securely and released after delivery confirmation or
              order completion.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
            <p>
              Didn’t receive the book, or it’s not as described? You may be eligible for a
              full refund after we review your case.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <p>
              Keep photos and tracking info handy — this speeds up our review and resolution.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">Close</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button size="sm">Got it</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyersProtectionDialog;
