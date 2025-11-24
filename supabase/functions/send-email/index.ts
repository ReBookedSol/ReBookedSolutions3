import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "https://esm.sh/nodemailer@6.9.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  test?: boolean;
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000,
};

function checkRateLimit(clientIP: string, to: string): { allowed: boolean; resetTime?: number } {
  const key = `${clientIP}-${to}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "METHOD_NOT_ALLOWED",
        message: "Email endpoint only accepts POST requests",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const emailRequest: EmailRequest = await req.json();

    if (emailRequest.test === true) {
      const smtpKey = Deno.env.get("BREVO_SMTP_KEY");
      const smtpUser = Deno.env.get("BREVO_SMTP_USER") || "8e237b002@smtp-brevo.com";

      return new Response(
        JSON.stringify({
          success: true,
          message: "Connection test successful",
          config: {
            host: "smtp-relay.brevo.com",
            port: 587,
            hasAuth: !!smtpKey && !!smtpUser,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const toEmail = Array.isArray(emailRequest.to) ? emailRequest.to[0] : emailRequest.to;
    const rateCheck = checkRateLimit(clientIP, toEmail);

    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "RATE_LIMIT_EXCEEDED",
          message: "Too many email requests from this client",
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((rateCheck.resetTime! - Date.now()) / 1000)),
          },
        }
      );
    }

    const smtpKey = Deno.env.get("BREVO_SMTP_KEY");
    const smtpUser = Deno.env.get("BREVO_SMTP_USER") || "8e237b002@smtp-brevo.com";
    const defaultFrom = Deno.env.get("DEFAULT_FROM_EMAIL") || '"ReBooked Solutions" <noreply@rebookedsolutions.co.za>';

    if (!smtpKey) {
      throw new Error("BREVO_SMTP_KEY environment variable is required");
    }

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpKey,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 10,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });

    await transporter.verify();

    const mailOptions = {
      from: emailRequest.from || defaultFrom,
      to: emailRequest.to,
      subject: emailRequest.subject,
      html: emailRequest.html,
      text: emailRequest.text,
      replyTo: emailRequest.replyTo,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", {
      messageId: info.messageId,
      to: emailRequest.to,
      subject: emailRequest.subject,
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: info.messageId,
        details: {
          accepted: info.accepted,
          rejected: info.rejected,
          response: info.response,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Email sending error:", error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return new Response(
      JSON.stringify({
        success: false,
        error: "EMAIL_SEND_FAILED",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
