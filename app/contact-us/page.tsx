import type { Metadata } from "next";
import ContactHero from "@/components/contact/ContactHero";
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
      <ContactHero />
      <ConnectMethods />
      <ContactForm />
    </main>
  );
}
