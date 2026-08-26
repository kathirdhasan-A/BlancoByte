"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Turnstile } from "@marsidev/react-turnstile";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Honeypot check
    if (honeypot) return;

    if (!form?.email?.match("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")) {
     
      return
    }

    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          turnstileToken,
        }),
      });

      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", company: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="glass-card p-10 text-center" style={{ borderColor: "var(--color-accent-border)", animation: "fadeIn 0.4s var(--ease)" }}>
        <div style={{ animation: "popIn 0.5s var(--ease)" }}>
          <Icon name="checkbox-circle-fill" size={48} className="mx-auto text-success" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-text-primary">Thank you!</h3>
        <p className="mt-2 text-text-secondary">
          We received your request and will get back to you within 1 business day.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 font-semibold text-accent underline underline-offset-4"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-8 md:p-10" style={{ borderColor: "var(--color-accent-border)" }}>
      <h3 className="text-xl font-bold text-text-primary">Book a Demo</h3>
      <p className="mt-2 text-text-secondary">
        Tell us about your data setup and we will reply within one business day.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-text-secondary">
            Name <span className="text-danger">*</span>
          </label>
          <input id="name" type="text" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-3 text-text-primary outline-none transition-all duration-200 focus:border-accent focus:shadow-[0_0_0_3px_rgba(46, 107, 245,0.15)]"
            placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-text-secondary">
            Work email <span className="text-danger">*</span>
          </label>

            <input id="email"  type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-3 text-text-primary outline-none transition-all duration-200 focus:border-accent focus:shadow-[0_0_0_3px_rgba(46, 107, 245,0.15)]"
            placeholder="you@company.com" />
    
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="company" className="mb-1.5 block text-sm font-semibold text-text-secondary">Company</label>
        <input id="company" type="text" value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-3 text-text-primary outline-none transition-all duration-200 focus:border-accent focus:shadow-[0_0_0_3px_rgba(46, 107, 245,0.15)]"
          placeholder="Company name" />
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-text-secondary">
          Message <span className="text-danger">*</span>
        </label>
        <textarea id="message" required rows={4} minLength={30} maxLength={2000} value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full resize-none rounded-lg border border-border-default bg-bg-elevated px-4 py-3 text-text-primary outline-none transition-all duration-200 focus:border-accent focus:shadow-[0_0_0_3px_rgba(46, 107, 245,0.15)]"
          placeholder="Tell us about your data setup and what you need help with." />
        <p className="mt-1.5 text-xs text-text-muted">{form.message.length}/2000 characters (minimum 30)</p>
      </div>

      {/* Honeypot - hidden from humans */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off"
          value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      {/* Cloudflare Turnstile */}
      {turnstileKey && (
        <div className="mt-5">
          <Turnstile
            siteKey={turnstileKey}
            onSuccess={setTurnstileToken}
            options={{ theme: "dark", size: "normal" }}
          />
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 flex items-center gap-2 text-danger" style={{ animation: "fadeIn 0.3s var(--ease)" }}>
          <Icon name="error-warning-line" size={16} /> Something went wrong. Please try again or email us directly.
        </div>
      )}

      <p className="mt-5 text-sm text-text-muted">A copy of your message will be sent to your email address.</p>

      <button type="submit" disabled={status === "sending" || (!!turnstileKey && !turnstileToken) || !form?.email?.match("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")}
        className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl bg-cta px-7 py-3.5 font-semibold text-[#0A1735] transition hover:bg-cta-hover glow-amber disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ boxShadow: "0 4px 16px var(--color-accent-glow)" }}>
        {status === "sending" ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Sending...
          </>
        ) : (
          <>
            <Icon name="send-plane-fill" size={16} />
            Send Request
          </>
        )}
      </button>
    </form>
  );
}
