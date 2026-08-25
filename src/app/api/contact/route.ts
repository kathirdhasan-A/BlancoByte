import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { renderBusinessEmail, renderBusinessEmailText, renderConfirmationEmail, renderConfirmationEmailText, businessRecipient } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, message, turnstileToken } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    // Cloudflare Turnstile verification
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      if (!turnstileToken) {
        return NextResponse.json({ error: "Captcha verification required." }, { status: 400 });
      }

      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: turnstileToken,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json({ error: "Captcha verification failed." }, { status: 400 });
      }
    }

    // Send email
    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const recipient = businessRecipient();

    if (smtpEmail && smtpPassword && recipient) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user: smtpEmail, pass: smtpPassword },
      });

      const emailOpts = {
        heading: "New demo request",
        intro: `${name}${company ? ` from ${company}` : ""} requested a demo. Reply to this email to respond directly.`,
        rows: [
          { label: "Name", value: name },
          { label: "Email", value: email, isEmail: true },
          { label: "Company", value: company || "Not provided" },
        ],
        blocks: [{ label: "Message", text: message }],
        footnote: `Replying to this email goes straight to ${name} (${email}).`,
      };

      const info = await transporter.sendMail({
        from: `BlancoByte Website <${smtpEmail}>`,
        to: recipient,
        replyTo: `${name} <${email}>`,
        subject: `New enquiry from ${name}${company ? ` from ${company}` : ""}`,
        html: renderBusinessEmail(emailOpts),
        text: renderBusinessEmailText(emailOpts),
      });

      // Surface delivery problems instead of silently succeeding.
      if (info.rejected && info.rejected.length > 0) {
        console.error("Contact email rejected for:", info.rejected);
        return NextResponse.json({ error: "Message could not be delivered. Please email us directly." }, { status: 502 });
      }

      // Send the sender a confirmation copy (customer-facing wording, not the
      // internal notification). A failure here should not fail the request,
      // since the business has already received the enquiry.
      try {
        const confirmOpts = {
          name,
          heading: "Thanks for requesting a demo",
          body: "We have received your demo request and a member of the team will get back to you shortly. If you need to add anything, just reply to this email.",
          blocks: [{ label: "Your message", text: message }],
        };
        await transporter.sendMail({
          from: `BlancoByte <${smtpEmail}>`,
          to: email,
          replyTo: recipient,
          subject: "We received your message",
          html: renderConfirmationEmail(confirmOpts),
          text: renderConfirmationEmailText(confirmOpts),
        });
      } catch (confirmErr) {
        console.error("Confirmation email to sender failed:", confirmErr);
      }
    } else {
      console.log("=== NEW CONTACT FORM SUBMISSION ===");
      console.log(`Name: ${name}\nEmail: ${email}\nCompany: ${company || "N/A"}\nMessage: ${message}`);
      console.log("Set SMTP_EMAIL and SMTP_PASSWORD (and optionally CONTACT_EMAIL) to receive via email.");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Failed to send." }, { status: 500 });
  }
}
