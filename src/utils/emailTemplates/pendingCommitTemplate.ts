import { EMAIL_STYLES, EMAIL_FOOTER } from "@/utils/emailStyles";

export interface PendingCommitEmailData {
  sellerName: string;
  buyerName: string;
  bookTitle: string;
  bookPrice: number;
  orderId: string;
  orderDate: string;
  deadlineDate: string;
}

export const createPendingCommitEmail = (
  data: PendingCommitEmailData
): { subject: string; html: string; text: string } => {
  const subject = `🚨 NEW SALE - Confirm Your Book Sale (48hr deadline) - ReBooked Solutions`;

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
    <div class="header-warning">
      <h1>🚨 New Book Sale - Action Required!</h1>
      <p>You have 48 hours to confirm this order</p>
    </div>
    
    <p>Hello ${data.sellerName},</p>
    
    <p><strong>Great news!</strong> Someone just purchased your book <strong>"${data.bookTitle}"</strong> and is waiting for your confirmation.</p>
    
    <div class="info-box-warning">
      <h3 style="margin-top: 0; color: #f59e0b;">⏰ ACTION REQUIRED WITHIN 48 HOURS</h3>
      <p style="margin: 0;"><strong>You must confirm this sale to proceed with the order.</strong></p>
    </div>
    
    <div class="info-box">
      <h3 style="margin-top: 0;">📋 Sale Details</h3>
      <p><strong>Book:</strong> ${data.bookTitle}</p>
      <p><strong>Price:</strong> R${data.bookPrice.toFixed(2)}</p>
      <p><strong>Buyer:</strong> ${data.buyerName}</p>
      <p><strong>Order ID:</strong> ${data.orderId}</p>
      <p><strong>Order Date:</strong> ${new Date(data.orderDate).toLocaleDateString()}</p>
      <p><strong>Confirm By:</strong> ${new Date(data.deadlineDate).toLocaleDateString()} (48 hours from now)</p>
    </div>
    
    <h3>📝 What Happens Next:</h3>
    <ol>
      <li><strong>Log in</strong> to your ReBooked Solutions account</li>
      <li><strong>Navigate</strong> to your Orders tab</li>
      <li><strong>Click "Commit Sale"</strong> for this order</li>
      <li><strong>We'll arrange pickup</strong> from your location</li>
      <li><strong>You'll get paid</strong> after delivery confirmation</li>
    </ol>
    
    <div class="info-box-error">
      <h3 style="margin-top: 0; color: #dc2626;">⚠️ Important Notice</h3>
      <p>If you don't confirm within 48 hours, the order will be <strong>automatically cancelled</strong> and the buyer will receive a <strong>full refund</strong>. This protects both you and the buyer.</p>
    </div>
    
    <h3>❓ Why We Need This:</h3>
    <ul>
      <li>Confirms you have the book and can fulfill the order</li>
      <li>Ensures reliable service for our buyers</li>
      <li>Protects you from accidental overselling</li>
      <li>Keeps the marketplace trustworthy</li>
    </ul>
    
    <div class="info-box-success">
      <h3 style="margin-top: 0; color: #10b981;">💰 Your Earnings</h3>
      <p><strong>You'll earn:</strong> R${(data.bookPrice * 0.9).toFixed(2)}</p>
      <p style="margin: 0; font-size: 12px; color: #666;">(90% after 10% platform fee)</p>
    </div>
    
    <h3>🚀 Quick Action Link:</h3>
    <p style="text-align: center; margin: 30px 0;">
      <a href="https://rebookedsolutions.co.za/profile?tab=orders" class="btn">
        Go to Orders & Confirm Sale
      </a>
    </p>
    
    <p style="color: #1f4e3d;"><strong>Questions?</strong> Contact us at <a href="mailto:support@rebookedsolutions.co.za" class="link">support@rebookedsolutions.co.za</a></p>
    
    <p>Thank you for being part of the ReBooked Solutions community!</p>
    <p>Best regards,<br><strong>The ReBooked Solutions Team</strong></p>
    
    ${EMAIL_FOOTER}
  </div>
</body>
</html>
  `;

  const text = `
NEW SALE - Confirm Your Book Sale (48hr deadline)

Hello ${data.sellerName},

Great news! Someone just purchased your book "${data.bookTitle}" and is waiting for your confirmation.

ACTION REQUIRED WITHIN 48 HOURS:
You must confirm this sale to proceed with the order.

SALE DETAILS:
- Book: ${data.bookTitle}
- Price: R${data.bookPrice.toFixed(2)}
- Buyer: ${data.buyerName}
- Order ID: ${data.orderId}
- Order Date: ${new Date(data.orderDate).toLocaleDateString()}
- Confirm By: ${new Date(data.deadlineDate).toLocaleDateString()} (48 hours from now)

WHAT HAPPENS NEXT:
1. Log in to your ReBooked Solutions account
2. Navigate to your Orders tab
3. Click "Commit Sale" for this order
4. We'll arrange pickup from your location
5. You'll get paid after delivery confirmation

IMPORTANT NOTICE:
If you don't confirm within 48 hours, the order will be automatically cancelled and the buyer will receive a full refund.

YOUR EARNINGS:
You'll earn: R${(data.bookPrice * 0.9).toFixed(2)} (90% after 10% platform fee)

QUESTIONS?
Contact us at support@rebookedsolutions.co.za

Thank you for being part of the ReBooked Solutions community!

Best regards,
The ReBooked Solutions Team

Visit: https://rebookedsolutions.co.za/profile?tab=orders
  `;

  return { subject, html, text };
};

export const sendPendingCommitEmail = async (
  emailData: PendingCommitEmailData,
  emailService: any
): Promise<void> => {
  const template = createPendingCommitEmail(emailData);

  try {
    await emailService.sendEmail({
      to: emailData.sellerName,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  } catch (error) {
    console.error("Failed to send pending commit email:", error);
    throw error;
  }
};
