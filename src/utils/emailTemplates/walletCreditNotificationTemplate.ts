import { EMAIL_STYLES, EMAIL_FOOTER } from "@/utils/emailStyles";

export interface WalletCreditNotificationData {
  sellerName: string;
  bookTitle: string;
  bookPrice: number;
  creditAmount: number;
  orderId: string;
  newBalance: number;
}

export const createWalletCreditNotificationEmail = (
  data: WalletCreditNotificationData
): { subject: string; html: string; text: string } => {
  const subject = `💰 Payment Received - Credit Added - ReBooked Solutions`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payment Received - Credit Added</title>
</head>
<body style="margin:0; padding:0; background:#f3fef7; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3fef7; padding:20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          <!-- HEADER -->
          <tr>
            <td style="background:#3ab26f; color:#ffffff; text-align:center; padding:20px;">
              <h1 style="margin:0; font-size:24px;">💰 Payment Received!</h1>
              <p style="margin:5px 0 0;">Your book has been delivered and credit has been added</p>
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td style="padding:30px; color:#1f4e3d; font-size:14px; line-height:1.6;">
              <p>Hello ${data.sellerName},</p>
              <p><strong>Great news!</strong> Your book <strong>"${data.bookTitle}"</strong> has been successfully delivered to the buyer. Your payment has now been added to your wallet.</p>
              <!-- SUCCESS BOX -->
              <table width="100%" style="background:#f0fdf4; border:1px solid #10b981; border-radius:5px; padding:15px; margin-top:15px;">
                <tr>
                  <td>
                    <h3 style="margin:0; color:#10b981;">✅ Payment Confirmed</h3>
                    <p style="margin:5px 0 0;"><strong>Credit has been added to your account!</strong></p>
                  </td>
                </tr>
              </table>
              <!-- TRANSACTION DETAILS -->
              <table width="100%" style="background:#f3fef7; border:1px solid #3ab26f; border-radius:5px; padding:15px; margin-top:15px;">
                <tr>
                  <td>
                    <h3 style="margin:0 0 10px;">📋 Transaction Details</h3>
                    <p style="margin:0 0 8px;"><strong>Book Title:</strong> ${data.bookTitle}</p>
                    <p style="margin:0 0 8px;"><strong>Book Price:</strong> R${data.bookPrice.toFixed(2)}</p>
                    <p style="margin:0 0 8px;"><strong>Commission Rate:</strong> 10% (You keep 90%)</p>
                    <p style="margin:10px 0 8px; border-top:1px solid #ddd; padding-top:10px;">
                      <strong>Credit Added:</strong> <span style="font-size:16px; color:#10b981;">R${data.creditAmount.toFixed(2)}</span>
                    </p>
                    <p style="margin:0;"><strong>Order ID:</strong> ${data.orderId}</p>
                  </td>
                </tr>
              </table>
              <!-- BALANCE -->
              <table width="100%" style="background:#f0fdf4; border:1px solid #10b981; border-radius:5px; padding:15px; margin-top:15px;">
                <tr>
                  <td>
                    <h3 style="margin:0; color:#10b981;">💳 Your New Wallet Balance</h3>
                    <p style="margin:5px 0 0; font-size:16px; color:#10b981;"><strong>R${data.newBalance.toFixed(2)}</strong></p>
                  </td>
                </tr>
              </table>
              <h3 style="margin-top:20px;">💡 What You Can Do Next</h3>
              <ul style="padding-left:20px; margin:10px 0;">
                <li>List more books and earn from new sales</li>
                <li>Request a payout to your bank account</li>
                <li>View your wallet transaction history</li>
                <li>Track all your sales and deliveries</li>
              </ul>
              <h3 style="margin-top:20px;">📊 Payment Methods</h3>
              <ol style="padding-left:20px; margin:10px 0;">
                <li><strong>Bank Transfer:</strong> Payout within 1–2 business days</li>
                <li><strong>Wallet Credit:</strong> Use instantly or withdraw anytime</li>
              </ol>
              <!-- BUTTON -->
              <div style="text-align:center; margin:30px 0;">
                <a href="https://rebookedsolutions.co.za/profile?tab=overview" style="background:#3ab26f; color:white; text-decoration:none; padding:12px 20px; font-weight:bold; border-radius:5px; display:inline-block;">
                  View Your Wallet &amp; Profile
                </a>
              </div>
              <p><strong>Questions?</strong> Contact us at <a href="mailto:support@rebookedsolutions.co.za" style="color:#3ab26f;">support@rebookedsolutions.co.za</a></p>
              <p>Thank you for selling on ReBooked Solutions!</p>
              <p>Best regards,<br><strong>The ReBooked Solutions Team</strong></p>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background:#f3fef7; padding:20px; text-align:center; font-size:12px; color:#1f4e3d; border-top:1px solid #e5e7eb;">
              <p style="margin:0;">This is an automated message. Please do not reply.</p>
              <p style="margin:5px 0;">
                Contact: <a href="mailto:support@rebookedsolutions.co.za" style="color:#3ab26f;">support@rebookedsolutions.co.za</a>
              </p>
              <p style="margin:5px 0;">
                Visit us: <a href="https://rebookedsolutions.co.za" style="color:#3ab26f;">https://rebookedsolutions.co.za</a>
              </p>
              <p style="margin-top:10px; font-style:italic;">"Pre-Loved Pages, New Adventures"</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
PAYMENT RECEIVED - Credit Added to Your Account

Hello ${data.sellerName},

Great news! Your book "${data.bookTitle}" has been successfully delivered to the buyer. Your payment has now been added to your wallet.

PAYMENT CONFIRMED
Credit has been added to your account!

TRANSACTION DETAILS:
- Book Title: ${data.bookTitle}
- Book Price: R${data.bookPrice.toFixed(2)}
- Commission Rate: 10% (You keep 90%)
- Credit Added: R${data.creditAmount.toFixed(2)}
- Order ID: ${data.orderId}

YOUR NEW WALLET BALANCE:
R${data.newBalance.toFixed(2)}

WHAT YOU CAN DO NEXT:
- List more books and earn from new sales
- Request a payout to your bank account
- View your wallet transaction history
- Track all your sales and deliveries

PAYMENT METHODS:
- Bank Transfer: Payout within 1–2 business days
- Wallet Credit: Use instantly or withdraw anytime

View Your Wallet & Profile: https://rebookedsolutions.co.za/profile?tab=overview

QUESTIONS?
Contact us at support@rebookedsolutions.co.za

Thank you for selling on ReBooked Solutions!

Best regards,
The ReBooked Solutions Team

"Pre-Loved Pages, New Adventures"
  `;

  return { subject, html, text };
};

export const sendWalletCreditNotificationEmail = async (
  emailData: WalletCreditNotificationData,
  sellerEmail: string,
  emailService: any
): Promise<void> => {
  const template = createWalletCreditNotificationEmail(emailData);

  try {
    await emailService.sendEmail({
      to: sellerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  } catch (error) {
    console.error("Failed to send wallet credit notification email:", error);
    throw error;
  }
};
