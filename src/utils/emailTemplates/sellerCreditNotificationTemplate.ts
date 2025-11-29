import { EMAIL_STYLES, EMAIL_FOOTER } from "@/utils/emailStyles";

export interface SellerCreditNotificationData {
  sellerName: string;
  bookTitle: string;
  bookPrice: number;
  creditAmount: number;
  orderId: string;
  newBalance: number;
}

export const createSellerCreditNotificationEmail = (
  data: SellerCreditNotificationData
): { subject: string; html: string; text: string } => {
  const subject = `💰 Payment Received - Credit Added to Your Account - ReBooked Solutions`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  ${EMAIL_STYLES}
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Payment Received!</h1>
      <p>Your book has been delivered and credit has been added</p>
    </div>
    
    <p>Hello ${data.sellerName},</p>
    
    <p><strong>Great news!</strong> Your book <strong>"${data.bookTitle}"</strong> has been successfully delivered and received by the buyer. Your payment is now available in your wallet!</p>
    
    <div class="info-box-success">
      <h3 style="margin-top: 0; color: #10b981;">✅ Payment Confirmed</h3>
      <p style="margin: 0;"><strong>Credit has been added to your account!</strong></p>
    </div>
    
    <div class="info-box">
      <h3 style="margin-top: 0;">📋 Transaction Details</h3>
      <p><strong>Book Title:</strong> ${data.bookTitle}</p>
      <p><strong>Book Price:</strong> R${data.bookPrice.toFixed(2)}</p>
      <p><strong>Commission Rate:</strong> 10% (You keep 90%)</p>
      <p style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;"><strong>Credit Added:</strong> <span style="font-size: 1.2em; color: #10b981;">R${data.creditAmount.toFixed(2)}</span></p>
      <p><strong>Order ID:</strong> ${data.orderId}</p>
    </div>
    
    <div class="info-box-success">
      <h3 style="margin-top: 0; color: #10b981;">💳 Your New Wallet Balance</h3>
      <p style="margin: 0; font-size: 1.1em; color: #10b981;"><strong>R${data.newBalance.toFixed(2)}</strong></p>
    </div>
    
    <h3>💡 What You Can Do Next:</h3>
    <ul>
      <li><strong>List More Books:</strong> Add more books to your inventory and earn from sales</li>
      <li><strong>Request Payout:</strong> Once you have accumulated funds, you can request a withdrawal to your bank account</li>
      <li><strong>View Transactions:</strong> Check your wallet history anytime in your profile</li>
      <li><strong>Track Orders:</strong> Monitor all your sales and deliveries</li>
    </ul>
    
    <h3>📊 Payment Methods:</h3>
    <p>You have two options to receive your funds:</p>
    <ol>
      <li><strong>Direct Bank Transfer:</strong> If you've set up banking details, payments are sent directly to your account within 1-2 business days</li>
      <li><strong>Wallet Credit:</strong> Funds are held in your wallet and can be used for future purchases or withdrawn anytime</li>
    </ol>
    
    <h3>🚀 Ready to Make More Sales?</h3>
    <p style="text-align: center; margin: 30px 0;">
      <a href="https://rebookedsolutions.co.za/profile?tab=overview" class="btn">
        View Your Wallet & Profile
      </a>
    </p>
    
    <p style="color: #1f4e3d;"><strong>Questions?</strong> Contact us at <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a></p>
    
    <p>Thank you for selling on ReBooked Solutions!</p>
    <p>Best regards,<br><strong>The ReBooked Solutions Team</strong></p>
    
    ${EMAIL_FOOTER}
  </div>
</body>
</html>
  `;

  const text = `
PAYMENT RECEIVED - Credit Added to Your Account

Hello ${data.sellerName},

Great news! Your book "${data.bookTitle}" has been successfully delivered and received by the buyer. Your payment is now available in your wallet!

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
- List More Books: Add more books to your inventory and earn from sales
- Request Payout: Once you have accumulated funds, you can request a withdrawal to your bank account
- View Transactions: Check your wallet history anytime in your profile
- Track Orders: Monitor all your sales and deliveries

PAYMENT METHODS:
You have two options to receive your funds:
1. Direct Bank Transfer: If you've set up banking details, payments are sent directly to your account within 1-2 business days
2. Wallet Credit: Funds are held in your wallet and can be used for future purchases or withdrawn anytime

READY TO MAKE MORE SALES?
Visit your profile: https://rebookedsolutions.co.za/profile?tab=overview

QUESTIONS?
Contact us at support@rebookedsolutions.co.za

Thank you for selling on ReBooked Solutions!

Best regards,
The ReBooked Solutions Team

"Pre-Loved Pages, New Adventures"
  `;

  return { subject, html, text };
};

export const sendSellerCreditNotificationEmail = async (
  emailData: SellerCreditNotificationData,
  emailService: any
): Promise<void> => {
  const template = createSellerCreditNotificationEmail(emailData);

  try {
    await emailService.sendEmail({
      to: emailData.sellerName,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  } catch (error) {
    throw error;
  }
};
