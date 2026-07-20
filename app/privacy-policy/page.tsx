"use client";

import React from "react";

const sections = [
  {
    title: "1. About the App",
    content: (
      <>
        <p>
          The <strong>Viju Customer Portal</strong> is a mobile application
          developed by Viju Industries Nigeria Limited to provide registered
          distributors with secure access to their distributor accounts,
          financial information, stock records, invoices, loading requests,
          customer support, and communication with assigned account officers.
        </p>

        <p className="mt-3">
          The application securely integrates with Viju's Enterprise Resource
          Planning (ERP) system to display distributor information in real time.
        </p>
      </>
    ),
  },
  {
    title: "2. Information We Collect",
    content: (
      <>
        <h4 className="font-semibold mt-4">Personal Information</h4>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Full Name</li>
          <li>Phone Number</li>
          <li>Email Address</li>
          <li>Distributor Account Number</li>
          <li>Assigned Region</li>
          <li>Profile Photo</li>
          <li>Encrypted Login Credentials</li>
          <li>Securely Stored Password</li>
        </ul>

        <h4 className="font-semibold mt-6">Account Information</h4>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Wallet Balance</li>
          <li>Stock Balance</li>
          <li>Purchase Orders</li>
          <li>Invoice History</li>
          <li>Payment History</li>
          <li>Waybill Records</li>
          <li>Loading Requests</li>
          <li>Distributor Status</li>
        </ul>

        <h4 className="font-semibold mt-6">Communications</h4>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Chat Messages</li>
          <li>Images Shared During Chat</li>
          <li>Support Tickets</li>
          <li>Support Responses</li>
        </ul>

        <h4 className="font-semibold mt-6">Device Information</h4>
        <ul className="list-disc pl-6 space-y-1 mt-2">
          <li>Device Model</li>
          <li>Operating System Version</li>
          <li>Unique Device Identifier</li>
          <li>Application Version</li>
          <li>Crash Reports</li>
          <li>Performance Logs</li>
        </ul>

        <h4 className="font-semibold mt-6">Push Notification Tokens</h4>
        <p className="mt-2">
          We collect notification tokens to deliver updates regarding chat
          replies, support tickets, invoices, loading requests, waybill status,
          and company announcements.
        </p>
      </>
    ),
  },
  {
    title: "3. How We Use Your Information",
    content: (
      <ul className="list-disc pl-6 space-y-2">
        <li>Authenticate your account.</li>
        <li>Verify your phone number using One-Time Password (OTP).</li>
        <li>Display distributor account information.</li>
        <li>Synchronize information from the ERP system.</li>
        <li>Enable communication with your Account Officer.</li>
        <li>Process loading requests.</li>
        <li>Generate account and stock statements.</li>
        <li>Respond to customer support requests.</li>
        <li>Improve application performance.</li>
        <li>Prevent fraud and unauthorized access.</li>
        <li>Send important account notifications.</li>
      </ul>
    ),
  },
  {
    title: "4. ERP Integration",
    content: (
      <>
        <p>
          The Viju Customer Portal securely connects with Viju's Enterprise
          Resource Planning (ERP) platform.
        </p>

        <p className="mt-3">
          Information such as orders, invoices, wallet balances, stock balances,
          payment history, and distributor information is retrieved from the ERP
          system.
        </p>

        <p className="mt-3">
          The application does not modify ERP financial or order records except
          through authorized backend services.
        </p>
      </>
    ),
  },
  {
    title: "5. Account Registration",
    content: (
      <p>
        Registration is available only to existing Viju distributors. Users must
        register using the phone number already associated with their
        distributor account. Identity verification is completed using a secure
        SMS One-Time Password (OTP).
      </p>
    ),
  },
  {
    title: "6. Profile Photos",
    content: (
      <p>
        If you upload a profile picture, the application will request access to
        your device's photo library. Your profile picture is used solely for
        account identification within the application.
      </p>
    ),
  },
  {
    title: "7. PDF Statements",
    content: (
      <>
        <p>The application allows you to generate:</p>

        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Account Statements</li>
          <li>Stock Statements</li>
        </ul>

        <p className="mt-3">
          These documents are generated upon request and may be downloaded,
          printed, or shared using your device's standard sharing features.
        </p>
      </>
    ),
  },
  {
    title: "8. Notifications",
    content: (
      <>
        <p>You may receive notifications about:</p>

        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Chat Messages</li>
          <li>Support Ticket Updates</li>
          <li>Invoice Updates</li>
          <li>Waybill Status</li>
          <li>Broadcast Announcements</li>
          <li>Loading Request Updates</li>
        </ul>

        <p className="mt-3">
          Notifications can be disabled through your device settings.
        </p>
      </>
    ),
  },
  {
    title: "9. Data Sharing",
    content: (
      <>
        <p>We do not sell your personal information.</p>

        <p className="mt-3">Information may be shared only with:</p>

        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Authorized Viju personnel</li>
          <li>Your assigned Account Officer</li>
          <li>Regional Administrators</li>
          <li>System Administrators</li>
          <li>
            Trusted service providers for hosting, notifications, analytics, and
            authentication
          </li>
          <li>Government or regulatory agencies when required by law</li>
        </ul>
      </>
    ),
  },
  {
    title: "10. Data Security",
    content: (
      <p>
        We use industry-standard administrative, technical, and organizational
        safeguards to protect your information against unauthorized access,
        disclosure, alteration, or destruction. While we strive to protect your
        information, no system can guarantee absolute security.
      </p>
    ),
  },
  {
    title: "11. Data Retention",
    content: (
      <>
        <p>Your information is retained only as long as necessary to:</p>

        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Provide our services</li>
          <li>Meet legal obligations</li>
          <li>Resolve disputes</li>
          <li>Maintain business records</li>
        </ul>

        <p className="mt-3">
          Support tickets, chats, and transaction history may be retained in
          accordance with company operational policies.
        </p>
      </>
    ),
  },
  {
    title: "12. Your Rights",
    content: (
      <>
        <p>You may have the right to:</p>

        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Access your personal information.</li>
          <li>Correct inaccurate information.</li>
          <li>Request account deletion.</li>
          <li>Change your password.</li>
          <li>Withdraw certain permissions.</li>
        </ul>

        <p className="mt-3">
          Certain records may be retained where required by law or regulatory
          obligations.
        </p>
      </>
    ),
  },
  {
    title: "13. Children's Privacy",
    content: (
      <p>
        The Viju Customer Portal is intended only for registered distributors
        and business users aged 18 years and above. We do not knowingly collect
        information from children.
      </p>
    ),
  },
  {
    title: "14. Third-Party Services",
    content: (
      <ul className="list-disc pl-6 space-y-2">
        <li>Firebase Cloud Messaging</li>
        <li>Google Play Services</li>
        <li>Apple Push Notification Service</li>
        <li>Analytics Services</li>
        <li>Crash Reporting Services</li>
      </ul>
    ),
  },
  {
    title: "15. Changes to this Privacy Policy",
    content: (
      <p>
        We may update this Privacy Policy from time to time. When significant
        changes are made, we will update the Last Updated date and may notify
        users within the application.
      </p>
    ),
  },
  {
    title: "16. Contact Us",
    content: (
      <>
        <p className="font-semibold">Viju Industries Nigeria Limited</p>

        <div className="mt-4 space-y-2">
          <p>
            <strong>Email:</strong> support@vijucustomerportal.com
          </p>

          <p>
            <strong>Website:</strong> https://www.vijucustomerportal.com
          </p>

          <p>
            <strong>Phone:</strong> +234 (0) 700 884 856
          </p>

          <p>
            <strong>Address:</strong> Plot 7B, Acme Road, Ogba Industrial
            Estate, Ikeja, Lagos, Nigeria.
          </p>
        </div>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="p-5 min-h-70 bg-gradient-to-r flex justify-center items-center from-primary via-orange to-primary w-full">
        <h1 className="text-[80px] font-bold text-white text-center">
          VIJU PRIVACY POLICY
        </h1>
      </div>
      <div className="max-w-5xl mx-auto bg-white shadow rounded-xl p-8 md:p-12">
        <header className="border-b pb-8">
          <h2 className="text-4xl font-bold text-gray-900">Privacy Policy</h2>

          <p className="mt-4 text-gray-600">
            Effective Date: <strong>July 17, 2026</strong>
          </p>

          <p className="text-gray-600">
            Last Updated: <strong>July 17, 2026</strong>
          </p>

          <p className="mt-6 text-gray-700 leading-8">
            Viju Industries Nigeria Limited ("Viju", "we", "our", or "us") is
            committed to protecting your privacy and ensuring that your personal
            information is handled securely and responsibly. This Privacy Policy
            explains how the Viju Customer Portal mobile application collects,
            uses, stores, and protects your information.
          </p>

          <p className="mt-4 text-gray-700 leading-8">
            By using the application, you agree to the collection and use of
            your information in accordance with this Privacy Policy.
          </p>
        </header>

        <div className="mt-10 space-y-12">
          {sections.map((section) => (
            <section key={section.title} className="mt-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {section.title}
              </h2>

              <div className="space-y-4 text-gray-700 leading-8">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
