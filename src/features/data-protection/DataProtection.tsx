"use client";

import React, { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  Lock,
  Eye,
  FileText,
  Users,
  Globe,
  Menu,
  Download,
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit,
  Search as SearchIcon,
} from "lucide-react";
import { Header } from "@/components/Header";

const DataProtectionPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    email: "",
    requestType: "delete",
    reason: "",
    verification: "otp",
    additionalInfo: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted:", formData);
    setFormSubmitted(true);
  };

  const sections = [
    { id: "introduction", title: "1. Introduction", icon: FileText },
    { id: "data-collection", title: "2. What Data We Collect", icon: Eye },
    { id: "user-rights", title: "3. Your Rights", icon: Shield },
    { id: "data-deletion", title: "4. Data Deletion Request", icon: Trash2 },
    { id: "data-security", title: "5. Data Security", icon: Lock },
    { id: "contact", title: "6. Contact Information", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <PageHeader />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <TableOfContents sections={sections} />
          <MainContent
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            formSubmitted={formSubmitted}
          />
        </div>
      </div>
    </div>
  );
};


const PageHeader = () => (
  <div className="text-left mb-12">
    <div className="flex items-left justify-left mb-4">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
        WasaaChat Data Protection & User Rights
      </h1>
    </div>
    <p className="text-lg text-gray-600 dark:text-white">
      Your privacy isn't just a policy — it's a promise. This section outlines
      how we collect, use, protect, and give you control over your personal data
      across our platform.
    </p>
    <div className="mt-6 inline-flex items-center px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600">
      <span className="text-sm text-gray-700 dark:text-white">Last Updated: July 2025</span>
    </div>
  </div>
);

const TableOfContents = ({ sections }) => (
  <div className="lg:col-span-1">
    <div className="sticky top-24 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Table of Contents
      </h3>
      <nav className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center text-sm text-gray-600 dark:text-white hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{section.title}</span>
            </a>
          );
        })}
      </nav>
    </div>
  </div>
);

const MainContent = ({
  formData,
  handleInputChange,
  handleSubmit,
  formSubmitted,
}) => (
  <div className="lg:col-span-3">
    <div className="bg-white dark:bg-black rounded-lg dark:border-gray-700">
      <SectionIntroduction />
      <SectionDataCollection />
      <SectionUserRights />
      <SectionDataDeletion
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        formSubmitted={formSubmitted}
      />
      <SectionDataSecurity />
      <SectionContact />
    </div>
  </div>
);

const SectionIntroduction = () => (
  <section id="introduction" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <FileText className="w-6 h-6 mr-3 text-blue-600" />
      1. Introduction
    </h2>
    <div className="prose max-w-none">
      <p className="text-gray-700 dark:text-white mb-4">
        At <strong>WasaaChat</strong>, your privacy isn't just a policy — it's a
        promise. This section outlines
        <strong>
          {" "}
          how we collect, use, protect, and give you control over your personal
          data
        </strong>{" "}
        across our platform, including chat, wallet, livestream, and AI Copilot
        features.
      </p>
      <p className="text-gray-700 dark:text-white mb-6">
        WasaaChat operates across multiple East African countries and complies
        with both <strong>local laws</strong>
        (such as Kenya's Data Protection Act and Uganda's Privacy Law) and{" "}
        <strong>global standards</strong>
        (such as the EU's GDPR). We believe that{" "}
        <strong>transparency, security, and user choice</strong> are core to a
        trustworthy platform.
      </p>

      <div className="p-6 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          1.1 Purpose of this Section
        </h3>
        <ul className="text-gray-700 dark:text-white space-y-2">
          <li>✅ Explain what personal data we collect and why</li>
          <li>
            ✅ Inform you of your legal rights under national and international
            privacy laws
          </li>
          <li>
            ✅ Describe how you can access, update, or delete your information
          </li>
          <li>
            ✅ Clarify how we store, secure, and share your data responsibly
          </li>
          <li>
            ✅ Help you make informed decisions about features like AI Copilot,
            wallet usage, and consent
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Covered Countries
          </h4>
          <ul className="text-sm text-gray-700 dark:text-white space-y-1">
            <li>🇰🇪 Kenya</li>
            <li>🇺🇬 Uganda</li>
            <li>🇹🇿 Tanzania</li>
            <li>🇷🇼 Rwanda</li>
            <li>🇪🇹 Ethiopia</li>
            <li>🌍 Diaspora users (EU, UK, US, Canada)</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Applicable Laws</h4>
          <ul className="text-sm text-gray-700 dark:text-white space-y-1">
            <li>🇰🇪 Kenya's Data Protection Act (2019)</li>
            <li>🇺🇬 Uganda's Data Protection and Privacy Act (2019)</li>
            <li>🇹🇿 Tanzania's Personal Data Protection Act (2022)</li>
            <li>🇷🇼 Rwanda's ICT Law</li>
            <li>🇪🇺 GDPR (where applicable)</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionDataCollection = () => (
  <section id="data-collection" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <Eye className="w-6 h-6 mr-3 text-blue-600" />
      2. What Data We Collect
    </h2>
    <div className="space-y-6">
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          2.1 Personal Identification Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="text-gray-700 dark:text-white space-y-2">
            <li>
              • Phone number (used for login, verification, and wallet linking)
            </li>
            <li>• Profile name or display name (optional)</li>
            <li>• Profile photo or avatar (optional)</li>
            <li>• Country and SIM registration info (for wallet compliance)</li>
          </ul>
          <ul className="text-gray-700 dark:text-white space-y-2">
            <li>• Device ID or unique session token (for fraud prevention)</li>
            <li>
              • We <strong>do not collect</strong> national ID numbers or
              physical addresses
            </li>
            <li>
              • We <strong>do not access</strong> your contact list, SMS, or
              call logs
            </li>
          </ul>
        </div>
      </div>

      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          2.2 Usage & Behavioral Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="text-gray-700 dark:text-white space-y-2">
            <li>• App usage patterns (buttons tapped, screens visited)</li>
            <li>• Session activity (time spent per session, frequency)</li>
            <li>• Interaction metadata (message timestamps, not content)</li>
          </ul>
          <ul className="text-gray-700 dark:text-white space-y-2">
            <li>• Notification response logs</li>
            <li>• Feature usage flags (livestream, group wallets, Copilot)</li>
            <li>• Error/crash logs for technical troubleshooting</li>
          </ul>
        </div>
        <p className="text-gray-700 dark:text-white mt-3 font-medium">
          ⚠️ We do not track what you type or send in messages. All messages are
          end-to-end encrypted.
        </p>
      </div>

      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          2.3 Wallet & Transaction Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="text-gray-700 dark:text-white space-y-2">
            <li>• Wallet balance & account status</li>
            <li>• Transaction history (timestamps, amounts, direction)</li>
            <li>• Top-up & withdrawal records</li>
          </ul>
          <ul className="text-gray-700 dark:text-white space-y-2">
            <li>• Group wallet activity and contributions</li>
            <li>• Creator payouts and tips</li>
            <li>• KYC metadata (not full ID details)</li>
          </ul>
        </div>
        <p className="text-gray-700 dark:text-white mt-3 font-medium">
          📌 We do not store your mobile money PINs or access your full
          bank/mobile wallet outside our secure API integrations.
        </p>
      </div>

      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          2.4 Optional Data (AI Copilot, Voice Commands)
        </h3>
        <ul className="text-gray-700 dark:text-white space-y-2">
          <li>
            • AI Copilot text queries and voice prompts (processed, then
            discarded)
          </li>
          <li>• Language personalization preferences</li>
          <li>
            • Productivity tools usage (polls, reminders, calendar requests)
          </li>
          <li>• Voice command audio clips (not stored permanently)</li>
        </ul>
        <p className="text-gray-700 dark:text-white mt-3 font-medium">
          🔇 We do not listen to your background audio or record ongoing
          conversations.
        </p>
      </div>
    </div>
  </section>
);

const SectionUserRights = () => (
  <section id="user-rights" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <Shield className="w-6 h-6 mr-3 text-blue-600" />
      3. Your Rights
    </h2>
    <div className="p-6 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
      <p className="text-gray-700 dark:text-white">
        WasaaChat believes in <strong>digital dignity and user control</strong>.
        We give you tools to manage your personal data and fully support your
        right to privacy under local and international laws.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-2">
          <SearchIcon className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Right to Access</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Request a copy of your personal data and understand how we process it.
        </p>
      </div>
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-2">
          <Edit className="w-5 h-5 mr-2 text-green-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Right to Correction</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Edit your profile and request corrections to inaccurate information.
        </p>
      </div>
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-2">
          <Trash2 className="w-5 h-5 mr-2 text-red-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Right to Deletion</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Request deletion of your account and personal data (honored within 30
          days).
        </p>
      </div>
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-2">
          <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Right to Object</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Withdraw consent for personalization, analytics, or marketing
          notifications.
        </p>
      </div>
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-2">
          <Download className="w-5 h-5 mr-2 text-purple-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Right to Portability</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Export your data in machine-readable format or transfer to another
          service.
        </p>
      </div>
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-2">
          <FileText className="w-5 h-5 mr-2 text-gray-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Right to Complain</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Lodge formal complaints with our DPO or national data authorities.
        </p>
      </div>
    </div>
  </section>
);

const SectionDataDeletion = ({
  formData,
  handleInputChange,
  handleSubmit,
  formSubmitted,
}) => (
  <section id="data-deletion" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <Trash2 className="w-6 h-6 mr-3 text-red-600" />
      4. Data Deletion Request
    </h2>

    <div className="p-6 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Important: What Happens When You Delete Your Account
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            ✅ What Gets Deleted:
          </h4>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>• Account info (name, number, profile)</li>
            <li>• Copilot usage history</li>
            <li>• Device session logs</li>
            <li>• Group memberships</li>
            <li>• Support chats (non-regulatory)</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            ⚠️ What May Be Retained:
          </h4>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>
              • Wallet transaction logs (up to 7 years - legal requirement)
            </li>
            <li>• Suspicious account flags (case-by-case)</li>
            <li>• Regulatory filings (as defined by authority)</li>
          </ul>
        </div>
      </div>
    </div>

    {formSubmitted ? (
      <div className="p-6 rounded-lg border border-green-600">
        <div className="flex items-center mb-3">
          <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Request Submitted Successfully
          </h3>
        </div>
        <p className="text-gray-700 dark:text-white mb-4">
          Your data deletion request has been received and will be processed
          within <strong>72 hours</strong>. You will receive a confirmation
          SMS/email once the process is complete.
        </p>
        <div className="p-4 rounded border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-white">
            <strong>Next Steps:</strong>
            <br />
            1. We will verify your identity using OTP
            <br />
            2. You must withdraw any remaining wallet funds
            <br />
            3. Your account will be permanently deleted
            <br />
            4. You'll receive final confirmation
          </p>
        </div>
      </div>
    ) : (
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Submit a Data Deletion Request
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 dark:text-white mb-1"
            >
              Phone Number *
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+254 7XX XXX XXX"
              required
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-white mb-1"
            >
              Email (Optional)
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@example.com"
            />
          </div>
        </div>

        <div className="mb-4">
          <label
            htmlFor="requestType"
            className="block text-sm font-medium text-gray-700 dark:text-white mb-1"
          >
            Request Type *
          </label>
          <select
            id="requestType"
            name="requestType"
            value={formData.requestType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="delete">Delete My Account & Data</option>
            <option value="access">Access My Data</option>
            <option value="correct">Correct My Data</option>
            <option value="export">Export My Data</option>
            <option value="object">Object to Processing</option>
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700 dark:text-white mb-1"
          >
            Reason for Request *
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Please explain why you're making this request..."
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="verification"
            className="block text-sm font-medium text-gray-700 dark:text-white mb-1"
          >
            Preferred Verification Method *
          </label>
          <select
            id="verification"
            name="verification"
            value={formData.verification}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="otp">SMS OTP</option>
            <option value="email">Email Verification</option>
            <option value="manual">Manual Verification (Support)</option>
          </select>
        </div>

        <div className="mb-6">
          <label
            htmlFor="additionalInfo"
            className="block text-sm font-medium text-gray-700 dark:text-white mb-1"
          >
            Additional Information
          </label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional details or special circumstances..."
          />
        </div>

        <div className="p-4 rounded border border-yellow-500 mb-4">
          <p className="text-sm text-gray-700 dark:text-white">
            <strong>⚠️ Important:</strong> Deletion is permanent and cannot be
            undone. You must withdraw any remaining wallet funds before
            proceeding. Response time: within 72 hours.
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Submit Data Request
        </button>
      </form>
    )}

    <div className="mt-6 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
        Alternative Contact Methods
      </h4>
      <div className="text-sm text-gray-700 dark:text-white space-y-1">
        <p>
          📧 Email:{" "}
          <a href="mailto:privacy@wasaachat.africa" className="hover:underline">
            privacy@wasaachat.africa
          </a>
        </p>
        <p>📱 In-app: Settings → Privacy → Manage My Data</p>
        <p>💬 WhatsApp: +254 793666000 (Kenya) | +256 7XX XXX XXX (Uganda)</p>
      </div>
    </div>
  </section>
);

const SectionDataSecurity = () => (
  <section id="data-security" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <Lock className="w-6 h-6 mr-3 text-blue-600" />
      5. How We Protect Your Data
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🔒 Encryption</h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>• End-to-end encrypted messages and calls</li>
            <li>• AES-256 encryption for wallet data</li>
            <li>• TLS 1.3 for all server communication</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            🛡️ Access Controls
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>• 4-digit PIN for wallet security</li>
            <li>• Biometric login (fingerprint/Face ID)</li>
            <li>• Multi-factor authentication for admin access</li>
          </ul>
        </div>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            💳 Payment Security
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>• AI-based fraud detection</li>
            <li>• PCI-compliant payment processors</li>
            <li>• Transaction velocity monitoring</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            🔍 Internal Controls
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>• Role-based access permissions</li>
            <li>• All access logged and audited</li>
            <li>• Regular penetration testing</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionContact = () => (
  <section id="contact" className="p-8">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <Mail className="w-6 h-6 mr-3 text-blue-600" />
      6. Contact Information
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Data Protection Officer (DPO)
        </h3>
        <div className="space-y-3">
          <div className="flex items-center text-gray-700 dark:text-white">
            <Mail className="w-4 h-4 mr-2" />
            <a
              href="mailto:privacy@wasaachat.africa"
              className="hover:underline"
            >
              privacy@wasaachat.africa
            </a>
          </div>
          <div className="flex items-center text-gray-700 dark:text-white">
            <Phone className="w-4 h-4 mr-2" />
            <span>+254 793666000</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Response time: Within 7 business days
          </p>
        </div>
      </div>
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Regional Offices
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start">
            <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
            <div>
              <strong className="text-gray-900 dark:text-white">Kenya (HQ):</strong>
              <br />
              <span className="text-gray-600 dark:text-gray-300">
                Delta Corner, Ring Road, Westlands, Nairobi
              </span>
            </div>
          </div>
          <div className="flex items-start">
            <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
            <div>
              <strong className="text-gray-900 dark:text-white">Uganda:</strong>
              <br />
              <span className="text-gray-600 dark:text-gray-300">
                Acacia Mall Annex, Kira Road, Kampala
              </span>
            </div>
          </div>
          <div className="flex items-start">
            <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
            <div>
              <strong className="text-gray-900 dark:text-white">Rwanda:</strong>
              <br />
              <span className="text-gray-600 dark:text-gray-300">
                Kigali Heights, KG 7 Ave, Kigali
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-8 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="text-center">
        <Shield className="w-8 h-8 text-blue-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Your trust is our top priority
        </h3>
        <p className="text-gray-600 dark:text-white">
          We're committed to transparency, accountability, and protecting your
          digital dignity. If you have any questions or concerns about how we
          handle your data, please don't hesitate to reach out.
        </p>
      </div>
    </div>
  </section>
);

export default DataProtectionPage;