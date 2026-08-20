"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { ArrowRight, Send } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { ContactInput, ContactTextarea } from "./ContactField";
import { contactService } from "@/services/contact.service";
import { getErrorMessage } from "@/utils/apiError";

// Validation schema
const contactValidationSchema = yup.object({
  fullName: yup
    .string()
    .trim()
    .required("Full name is required")
    .min(2, "Full name must be at least 2 characters"),
  email: yup
    .string()
    .trim()
    .required("Email address is required")
    .email("Enter a valid email address"),
  phone: yup
    .string()
    .trim()
    .required("Phone number is required")
    .matches(
      /^\+?[0-9\s()-]{7,20}$/,
      "Enter a valid phone number, digits only",
    ),
  message: yup
    .string()
    .trim()
    .required("Message is required")
    .min(10, "Message must be at least 10 characters"),
});

export type ContactFormInputs = yup.InferType<typeof contactValidationSchema>;

interface ContactFormProps {
  /**
   * Overrides the default POST /contact call. The public endpoint shipped in
   * the backend handoff (CC-05), so the default path is the real one.
   */
  onSubmit?: (values: ContactFormInputs) => Promise<void>;
}

/**
 * Contact Form
 * "Send Us a Message" - React Hook Form + Yup, submitted only by clicking
 * the button.
 */
export default function ContactForm({ onSubmit }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInputs>({
    resolver: yupResolver(contactValidationSchema),
    mode: "onBlur",
  });

  const submitEnquiry = async (values: ContactFormInputs) => {
    try {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        // CC-05 - public route, rate limited to 5 submissions per IP per hour
        await contactService.submit(values);
      }

      toast.success(
        "Thanks for reaching out. We'll get back to you within 24 hours.",
      );
      reset();
    } catch (error) {
      // 400 returns a `message` ARRAY on validation failure, 429 a string -
      // getErrorMessage handles the string case, so normalise the array here.
      const raw = (error as any)?.response?.data?.message;
      const message = Array.isArray(raw)
        ? raw.filter(Boolean).join(" ")
        : getErrorMessage(error);

      toast.error(message || "Could not send your message. Please try again.");
    }
  };

  /**
   * Enter must not submit. It still needs to insert newlines in the message
   * box, so only that control is allowed to keep the keypress.
   */
  const blockEnterSubmit = (event: React.KeyboardEvent<HTMLFormElement>) => {
    const isTextarea =
      (event.target as HTMLElement).tagName?.toLowerCase() === "textarea";

    if (event.key === "Enter" && !isTextarea) {
      event.preventDefault();
    }
  };

  return (
    <section className="bg-[#121a28] px-4 pb-20 pt-4 sm:px-6 sm:pb-24">
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          title="Send Us a"
          highlight="Message"
          subtitle="Fill out the form below and we'll get back to you within 24 hours."
        />

        <div className="mt-10 rounded-2xl border border-white/6 bg-[#1b2536] p-6 sm:p-8">
          <form
            noValidate
            onKeyDown={blockEnterSubmit}
            onSubmit={handleSubmit(submitEnquiry)}
          >
            {/* Name + email sit side by side from tablet up */}
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              <ContactInput
                label="Full Name"
                required
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                disabled={isSubmitting}
                error={errors.fullName?.message}
                {...register("fullName")}
              />

              <ContactInput
                label="Email Address"
                required
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
                disabled={isSubmitting}
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <ContactInput
              label="Phone Number"
              required
              type="tel"
              placeholder="Enter your phone number"
              autoComplete="tel"
              disabled={isSubmitting}
              error={errors.phone?.message}
              {...register("phone")}
            />

            <ContactTextarea
              label="Your Message"
              required
              rows={7}
              placeholder="Tell us about your inquiry, partnership opportunities, or any questions you have..."
              disabled={isSubmitting}
              error={errors.message?.message}
              {...register("message")}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-lg bg-linear-to-r from-[#f04444] to-[#d92b2b] px-6 py-4 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4.5 w-4.5" strokeWidth={2} />
              {isSubmitting ? "Sending..." : "Send Message"}
              {!isSubmitting && (
                <ArrowRight className="h-4.5 w-4.5" strokeWidth={2} />
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
