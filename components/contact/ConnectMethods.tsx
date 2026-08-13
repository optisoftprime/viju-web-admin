import React from "react";
import SectionHeading from "./SectionHeading";
import ContactMethodCard from "./ContactMethodCard";
import { contactMethods } from "./contactData";

/**
 * Connect Methods
 * "Multiple Ways to Connect" - office, phone and email cards.
 */
export default function ConnectMethods() {
  return (
    <section className="bg-[#121a28] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="Multiple Ways to"
          highlight="Connect"
          stacked
          subtitle="Choose your preferred method to reach out. We're committed to providing exceptional support across all channels."
        />

        {/* items-start so a longer address does not stretch its neighbours */}
        <div className="mt-12 grid grid-cols-1 items-start gap-10 md:grid-cols-3">
          {contactMethods.map((method) => (
            <ContactMethodCard key={method.title} {...method} />
          ))}
        </div>
      </div>
    </section>
  );
}
