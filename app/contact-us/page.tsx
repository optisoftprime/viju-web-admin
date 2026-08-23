import type { Metadata } from "next";
import ContactHero from "@/components/contact/ContactHero";
import ArrowBack from "@/components/common/ArrowBack";
import ConnectMethods from "@/components/contact/ConnectMethods";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us - Viju Industries",
  description:
    "Get in touch with Viju Industries (Nigeria) Limited. Visit our Lagos office, call us, send an email, or message us directly.",
};

/**
 * Contact Us Page
 * Public marketing page: hero with metrics, the ways to reach us, and the
 * enquiry form.
 */
export default function ContactUsPage() {
  return (
    <main className="min-h-screen bg-[#121a28]">
      {/* ArrowBack carries its own "use client", so it drops into this server
          component unchanged. Light text: the page sits on a dark ground. */}
      <div className="px-5 pt-5 [&_span]:text-white">
        <ArrowBack />
      </div>
      <ContactHero />
      <ConnectMethods />
      <ContactForm />
    </main>
  );
}
