"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
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
  CreditCard,
  MessageSquare,
  Camera,
  Settings,
  Gavel,
  AlertTriangle,
  HeadphonesIcon,
} from "lucide-react";

const TermsConditionsPage = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const sections = [
    { id: "introduction", title: "1. Introduction", icon: FileText },
    {
      id: "account-registration",
      title: "2. Account Registration and Security",
      icon: Shield,
    },
    { id: "use-of-services", title: "3. Use of Services", icon: MessageSquare },
    {
      id: "wallet-financial",
      title: "4. Wallet & Financial Services",
      icon: CreditCard,
    },
    {
      id: "content-guidelines",
      title: "5. Content Guidelines and Ownership",
      icon: Eye,
    },
    {
      id: "ai-copilot",
      title: "6. AI Copilot & Automated Features",
      icon: Settings,
    },
    { id: "privacy-data", title: "7. Privacy and Data Use", icon: Lock },
    {
      id: "user-conduct",
      title: "8. User Conduct and Community Safety",
      icon: Users,
    },
    {
      id: "platform-availability",
      title: "9. Platform Availability and Technical Use",
      icon: Globe,
    },
    {
      id: "legal-compliance",
      title: "10. Legal and Regulatory Compliance",
      icon: Gavel,
    },
    {
      id: "dispute-resolution",
      title: "11. Dispute Resolution and Governing Law",
      icon: Gavel,
    },
    {
      id: "liability-indemnity",
      title: "12. Limitation of Liability and Indemnity",
      icon: AlertTriangle,
    },
    {
      id: "termination",
      title: "13. Termination and Account Closure",
      icon: FileText,
    },
    {
      id: "contact-support",
      title: "14. Contact and Support",
      icon: HeadphonesIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header toggleDrawer={toggleDrawer} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <PageHeader />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <TableOfContents sections={sections} />
          <MainContent sections={sections} />
        </div>
      </div>
    </div>
  );
};

const Header = ({ toggleDrawer }) => (
  <header className="sticky top-0 z-50 bg-white dark:bg-black">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4">
        {/* Logo */}
        <div className="flex items-center">
          <a
            href="/"
            className="flex items-center transition-transform duration-200 hover:scale-105"
            aria-label="Go to homepage"
          >
            <img
              src="/dark-logo.svg"
              alt="WasaaChat Logo"
              className="w-36 h-10"
            />
          </a>
        </div>

        {/* Action Buttons - Desktop */}
        <div className="hidden md:flex items-center space-x-6">
          <nav className="hidden text-sm dark:text-white md:flex space-x-8">
            <a href="#features" className="hover:text-gray-900 dark:text-white">
              Features
            </a>
            <a href="#faq" className="hover:text-gray-900 dark:text-white">
              FAQ
            </a>
            <a href="#apps" className="hover:text-gray-900 dark:text-white">
              Apps
            </a>
          </nav>

          <a
            href="/login"
            className="bg-[#088EF9] text-xs text-white px-6 py-2 rounded-full font-semibold cursor-pointer transition w-34 text-center"
          >
            Get Started
          </a>
          <a
            href="/download"
            className="bg-black flex items-center gap-1 hover:bg-black border border-white text-xs text-white cursor-pointer px-6 py-2 rounded-full font-semibold w-34 text-center"
          >
            <img src="/contact.svg" className="w-4 h-4" />
            Contact Us
          </a>
        </div>

        {/* Hamburger Menu - Mobile */}
        <button
          onClick={toggleDrawer}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6 text-gray-600 dark:text-white" />
        </button>
      </div>
    </div>
  </header>
);

const PageHeader = () => (
  <div className="text-left mb-12">
    <div className="flex items-left justify-left mb-4">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
        WasaaChat Terms & Conditions
      </h1>
    </div>
    <p className="text-lg text-gray-600 dark:text-white">
      These Terms and Conditions govern your access to and use of the WasaaChat
      mobile application, website, and related services. By using WasaaChat, you
      agree to be legally bound by these Terms.
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

const MainContent = ({ sections }) => (
  <div className="lg:col-span-3">
    <div className="bg-white dark:bg-black rounded-lg shadow-sm">
      <SectionIntroduction />
      <SectionAccountRegistration />
      <SectionUseOfServices />
      <SectionWalletFinancial />
      <SectionContentGuidelines />
      <SectionAICopilot />
      <SectionUserConduct />
      <SectionPlatformAvailability />
      <SectionLegalCompliance />
      <SectionDisputeResolution />
      <SectionLiabilityIndemnity />
      <SectionTermination />
      <SectionContactSupport />
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
        These <strong>Terms and Conditions</strong> ("Terms") govern your access
        to and use of the <strong>WasaaChat mobile application</strong>,
        website, and related services (collectively, the "Platform"), owned and
        operated by <strong>WasaaChat Ltd.</strong>, headquartered in Nairobi,
        Kenya.
      </p>
      <p className="text-gray-700 dark:text-white mb-6">
        By using WasaaChat, you agree to be legally bound by these Terms. If you
        do not agree with any part of these Terms,{" "}
        <strong>please do not use the Platform.</strong>
      </p>
      <div className="p-6 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          1.1 Purpose and Scope
        </h3>
        <p className="text-gray-700 dark:text-white mb-3">
          This agreement applies to <strong>all users</strong>, including:
        </p>
        <ul className="text-gray-700 dark:text-white space-y-2">
          <li>• General users of chat, call, and wallet services</li>
          <li>• Livestream viewers and content consumers</li>
          <li>• Creators and content producers using monetization tools</li>
          <li>
            • Admins or contributors of group wallets (e.g., chamas, events,
            school groups)
          </li>
          <li>• Business and organization accounts</li>
        </ul>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Platform Features
          </h4>
          <ul className="text-sm text-gray-700 dark:text-white space-y-1">
            <li>🔒 End-to-end encrypted messaging</li>
            <li>💰 Integrated wallet services</li>
            <li>📺 Livestreaming and content creation</li>
            <li>🤖 AI Copilot assistance</li>
            <li>👥 Group wallets and community features</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            Eligibility Requirements
          </h4>
          <ul className="text-sm text-gray-700 dark:text-white space-y-1">
            <li>📅 Must be 18+ or legal age in your country</li>
            <li>📱 Valid mobile phone number required</li>
            <li>🆔 Identity verification for wallet features</li>
            <li>⚖️ Not prohibited by local/international law</li>
            <li>👨‍💼 Personal use or authorized representative</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionAccountRegistration = () => (
  <section id="account-registration" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <Shield className="w-6 h-6 mr-3 text-blue-600" />
      2. Account Registration and Security
    </h2>
    <div className="space-y-6">
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          2.1 Phone Number Verification
        </h3>
        <p className="text-gray-700 dark:text-white mb-3">
          To use WasaaChat, you must register an account using a valid and
          accessible mobile phone number.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Verification Process:
            </h4>
            <ul className="text-gray-700 dark:text-white text-sm space-y-1">
              <li>1. Enter your mobile phone number</li>
              <li>2. Receive OTP via SMS or in-app notification</li>
              <li>3. Enter OTP within the allowed time</li>
              <li>4. Complete account setup</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Requirements:</h4>
            <ul className="text-gray-700 dark:text-white text-sm space-y-1">
              <li>• Real, active mobile number under your control</li>
              <li>• No virtual numbers (VoIP) allowed</li>
              <li>• One account per number limit</li>
              <li>• SIM registration compliance</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            2.2 Password, PIN, and Biometric Use
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-2">
            <li>
              🔢 <strong>4-Digit Wallet PIN:</strong> Required for financial
              transactions
            </li>
            <li>
              👆 <strong>Biometric Authentication:</strong> Optional
              fingerprint/Face ID
            </li>
            <li>
              🔒 <strong>PIN Reset:</strong> Requires phone number verification
            </li>
            <li>
              ⚠️ <strong>Security:</strong> Never share your PIN with anyone
            </li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            2.3 Account Suspension or Termination
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-2">
            <li>🚫 Violation of Community Guidelines</li>
            <li>💳 Fraudulent wallet activity</li>
            <li>🎭 Impersonation or fake accounts</li>
            <li>🤖 Bot usage or platform exploitation</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionUseOfServices = () => (
  <section id="use-of-services" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <MessageSquare className="w-6 h-6 mr-3 text-blue-600" />
      3. Use of Services
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            3.1 Messaging & Media Sharing
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>✅ End-to-end encrypted messages</li>
            <li>✅ Voice notes, images, videos, documents</li>
            <li>✅ Group chats and communities</li>
            <li>❌ Spam or unsolicited messages</li>
            <li>❌ Harassment or threats</li>
            <li>❌ Malware or phishing links</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            3.2 Audio and Video Calls
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>📞 One-on-one and group calls (up to 8 participants)</li>
            <li>🎥 Switch between audio and video during calls</li>
            <li>🔒 Not recorded or stored by WasaaChat</li>
            <li>⚠️ No harassment or repeated unwanted calls</li>
          </ul>
        </div>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            3.3 Livestreaming Rules
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>🎯 Available to verified users 18+</li>
            <li>💰 Monetization through tips and subscriptions</li>
            <li>📝 Must label streams accurately</li>
            <li>🚫 No illegal, misleading, or harmful content</li>
            <li>🎵 Respect music and copyright rules</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            3.5 Prohibited Uses
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>🚫 Illegal activity or fraud</li>
            <li>🚫 Hate speech or discrimination</li>
            <li>🚫 Copyright infringement</li>
            <li>🚫 Platform exploitation or hacking</li>
            <li>🚫 Misinformation campaigns</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionWalletFinancial = () => (
  <section id="wallet-financial" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <CreditCard className="w-6 h-6 mr-3 text-blue-600" />
      4. Wallet & Financial Services
    </h2>
    <div className="space-y-6">
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          4.1 Wallet Setup and Activation
        </h3>
        <p className="text-gray-700 dark:text-white mb-3">
          WasaaWallet enables users to send, receive, withdraw, contribute to
          groups, and earn money directly inside the app.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Eligibility Requirements:
            </h4>
            <ul className="text-gray-700 dark:text-white text-sm space-y-1">
              <li>• Must be 18+ or legal age for financial consent</li>
              <li>• Verified phone number on WasaaChat</li>
              <li>• Accept Wallet Terms of Use and KYC requirements</li>
              <li>• Set up a 4-digit PIN for secure access</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Activation Process:
            </h4>
            <ul className="text-gray-700 dark:text-white text-sm space-y-1">
              <li>1. Go to Wallet tab → "Activate Wallet"</li>
              <li>2. Create a 4-digit secure PIN</li>
              <li>3. Enable biometric login (optional)</li>
              <li>4. Read and agree to Wallet Terms</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            4.2 Supported Transactions
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-2">
            <li>
              💳 <strong>Top-up:</strong> Mobile money (M-Pesa, Airtel, MTN)
            </li>
            <li>
              👥 <strong>P2P Transfers:</strong> Send to other users
            </li>
            <li>
              🏦 <strong>Withdrawals:</strong> To mobile money or bank
            </li>
            <li>
              💰 <strong>Group Wallets:</strong> Contribute to community funds
            </li>
            <li>
              🎁 <strong>Creator Tips:</strong> Support content creators
            </li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            4.4 Transaction Limits & Fees
          </h3>
          <div className="text-gray-700 dark:text-white text-sm space-y-2">
            <div>
              <strong>Daily Limits:</strong>
            </div>
            <ul className="ml-4 space-y-1">
              <li>• Basic: KES 70,000 send / KES 100,000 withdraw</li>
              <li>• Verified: KES 150,000 send / KES 250,000 withdraw</li>
            </ul>
            <div>
              <strong>Fees:</strong>
            </div>
            <ul className="ml-4 space-y-1">
              <li>• P2P transfers: Free</li>
              <li>• Withdrawals: 1.5% of amount</li>
              <li>• Creator tips: 10% platform fee</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          4.3 Group Wallet Management
        </h3>
        <p className="text-gray-700 dark:text-white text-sm mb-3">
          Group Wallets help communities manage pooled funds with transparency
          and security.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Admin Role:</h4>
            <ul className="text-gray-700 dark:text-white text-xs space-y-1">
              <li>• Create wallet</li>
              <li>• Approve withdrawals</li>
              <li>• Add/remove members</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Contributor Role:
            </h4>
            <ul className="text-gray-700 dark:text-white text-xs space-y-1">
              <li>• Send funds</li>
              <li>• View balance</li>
              <li>• View history</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Features:</h4>
            <ul className="text-gray-700 dark:text-white text-xs space-y-1">
              <li>• Goal tracking</li>
              <li>• Transparent records</li>
              <li>• Multi-admin approval</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SectionContentGuidelines = () => (
  <section id="content-guidelines" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <Eye className="w-6 h-6 mr-3 text-blue-600" />
      5. Content Guidelines and Ownership
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            5.1 Your Content Rights
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-2">
            <li>
              ✅ <strong>You own</strong> the rights to your original content
            </li>
            <li>
              ✅ <strong>You can edit</strong> or delete your content anytime
            </li>
            <li>
              ✅ <strong>Limited license</strong> to WasaaChat for platform
              functionality
            </li>
            <li>
              ❌ <strong>We don't claim ownership</strong> of your content
            </li>
            <li>
              ❌ <strong>We don't sell</strong> your content to advertisers
            </li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            5.3 Copyright and Fair Use
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>
              📚 <strong>Copyrighted content includes:</strong> Music, videos,
              images, books
            </li>
            <li>
              ✅ <strong>Fair use allowed:</strong> Short excerpts for
              commentary
            </li>
            <li>
              ❌ <strong>Not allowed:</strong> Full-length copyrighted material
            </li>
            <li>
              📩 <strong>Report violations:</strong> ip@wasaachat.africa
            </li>
          </ul>
        </div>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            5.1 Prohibited Content
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>🚫 Violence, nudity, or explicit material</li>
            <li>🚫 Hate speech or discriminatory remarks</li>
            <li>🚫 Threats, harassment, or cyberbullying</li>
            <li>🚫 Misinformation or incitement to harm</li>
            <li>🚫 Copyrighted content without permission</li>
            <li>🚫 Fraudulent or misleading content</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            5.5 Content Moderation
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>
              🤖 <strong>AI Detection:</strong> Automated content scanning
            </li>
            <li>
              👥 <strong>Community Reports:</strong> User-generated flags
            </li>
            <li>
              👨‍💼 <strong>Human Review:</strong> Trained moderation team
            </li>
            <li>
              ⚠️ <strong>Removal:</strong> Violating content deleted without
              notice
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionAICopilot = () => (
  <section id="ai-copilot" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <Settings className="w-6 h-6 mr-3 text-blue-600" />
      6. AI Copilot & Automated Features
    </h2>
    <div className="space-y-6">
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          6.1 Purpose of AI Copilot
        </h3>
        <p className="text-gray-700 dark:text-white mb-3">
          WasaaCopilot is an optional smart assistant designed to help users
          save time, reduce friction, and enhance productivity.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              What Copilot Can Do:
            </h4>
            <ul className="text-gray-700 dark:text-white text-sm space-y-1">
              <li>• Suggest quick replies and translations</li>
              <li>• Provide voice-activated controls</li>
              <li>• Help manage WasaaWallet</li>
              <li>• Create basic templates</li>
              <li>• Summarize group chats</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Limitations:</h4>
            <ul className="text-gray-700 dark:text-white text-sm space-y-1">
              <li>• Not a human or live support agent</li>
              <li>• Not licensed financial/medical advisor</li>
              <li>• May contain errors or outdated suggestions</li>
              <li>• Not a decision-making system</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            6.2 AI Prompts and Consent
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-2">
            <li>
              📝 <strong>Explicit Consent:</strong> Clear opt-in required
            </li>
            <li>
              🔄 <strong>Withdrawable:</strong> Turn off anytime in Settings
            </li>
            <li>
              ⏱️ <strong>Temporary Processing:</strong> Prompts processed in
              real-time
            </li>
            <li>
              🗑️ <strong>Auto-Deletion:</strong> Prompts deleted after short
              period
            </li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            6.4 Language Support
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>
              🌍 <strong>Supported Languages:</strong>
            </li>
            <li>• Swahili, English, Luganda</li>
            <li>• Kinyarwanda, Amharic</li>
            <li>• French (for Francophone users)</li>
            <li>
              ⚠️ <strong>Note:</strong> Accuracy may vary by language
            </li>
          </ul>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          6.5 Opt-Out and Control
        </h3>
        <p className="text-gray-700 dark:text-white text-sm mb-2">
          You have full control over AI features and can opt out at any time.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              To Disable Copilot:
            </h4>
            <ul className="text-gray-700 dark:text-white text-xs space-y-1">
              <li>1. Go to Settings → Copilot Preferences</li>
              <li>2. Toggle off desired features</li>
              <li>3. Confirm your selection</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              After Opt-Out:
            </h4>
            <ul className="text-gray-700 dark:text-white text-xs space-y-1">
              <li>• No AI suggestions triggered</li>
              <li>• Prompt logs cleared</li>
              <li>• Can re-enable anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SectionUserConduct = () => (
  <section id="user-conduct" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <Users className="w-6 h-6 mr-3 text-blue-600" />
      8. User Conduct and Community Safety
    </h2>
    <div className="space-y-6">
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          8.1 Community Expectations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Core Principles:
            </h4>
            <ul className="text-gray-700 dark:text-white text-sm space-y-1">
              <li>🤝 Respect others regardless of background</li>
              <li>💬 Communicate constructively</li>
              <li>📱 Use the platform responsibly</li>
              <li>🔒 Protect privacy of others</li>
              <li>⚖️ Follow local laws</li>
              <li>👨‍💼 Be accountable for your content</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Group Etiquette:
            </h4>
            <ul className="text-gray-700 dark:text-white text-sm space-y-1">
              <li>• Stay on topic</li>
              <li>• Use appropriate language</li>
              <li>• Avoid excessive self-promotion</li>
              <li>• No unsolicited payment requests</li>
              <li>• Report inappropriate behavior</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            8.2 Zero Tolerance Policy
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>🚫 Harassment, stalking, or threats</li>
            <li>🚫 Hate speech or discriminatory language</li>
            <li>🚫 Bullying or coordinated targeting</li>
            <li>🚫 Exploitation or blackmail</li>
            <li>🚫 Extremist ideology promotion</li>
          </ul>
          <p className="text-gray-700 dark:text-white text-xs mt-2 font-medium">
            ⚠️ Violations may lead to immediate suspension or permanent bans
          </p>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            8.3 Reporting and Moderation
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>
              📱 <strong>Report Button:</strong> Tap "Report" on any content
            </li>
            <li>
              👥 <strong>Community Reports:</strong> User-generated flags
            </li>
            <li>
              🤖 <strong>AI Detection:</strong> Automated content scanning
            </li>
            <li>
              👨‍💼 <strong>Human Review:</strong> Trust & Safety team
            </li>
            <li>
              🔒 <strong>Confidential:</strong> Reporter identity protected
            </li>
          </ul>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          8.4 Enforcement Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Temporary Suspension:
            </h4>
            <ul className="text-gray-700 dark:text-white text-xs space-y-1">
              <li>• 24 hours to 30 days</li>
              <li>• First-time violations</li>
              <li>• Limited feature access</li>
              <li>• Can appeal decision</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Feature Restriction:
            </h4>
            <ul className="text-gray-700 dark:text-white text-xs space-y-1">
              <li>• Messaging restrictions</li>
              <li>• Wallet access disabled</li>
              <li>• Livestream blocks</li>
              <li>• Creator tools removed</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Permanent Ban:
            </h4>
            <ul className="text-gray-700 dark:text-white text-xs space-y-1">
              <li>• Account permanently closed</li>
              <li>• All data and access lost</li>
              <li>• Cannot create new account</li>
              <li>• Severe violations only</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SectionPlatformAvailability = () => (
  <section id="platform-availability" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <Globe className="w-6 h-6 mr-3 text-blue-600" />
      9. Platform Availability and Technical Use
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            9.1 Service Availability
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-2">
            <li>
              🎯 <strong>Target Uptime:</strong> 99.5% across all services
            </li>
            <li>
              💬 <strong>Core Services:</strong> Messaging, calls, wallet
            </li>
            <li>
              🔄 <strong>Redundancy:</strong> Multiple servers and backups
            </li>
            <li>
              📈 <strong>Auto-Scaling:</strong> Handle traffic spikes
            </li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            9.1 Scheduled Maintenance
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>⏰ During low-traffic hours</li>
            <li>📢 Communicated in advance</li>
            <li>⏱️ Usually under 60 minutes</li>
            <li>🔄 Resume processing immediately</li>
          </ul>
        </div>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            9.1 Unplanned Downtime
          </h3>
          <p className="text-gray-700 dark:text-white text-sm mb-2">
            Service interruptions may occur due to:
          </p>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>🌐 Regional internet outages</li>
            <li>⚡ Cyberattacks or DDoS events</li>
            <li>🖥️ Server failures or software bugs</li>
            <li>🚨 Emergency security patching</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            9.2 Device Requirements
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>
              📱 <strong>Android:</strong> Version 8.0+, 2GB RAM
            </li>
            <li>
              🍎 <strong>iOS:</strong> iOS 13.0+, 64-bit device
            </li>
            <li>
              🌐 <strong>Web:</strong> Latest Chrome/Safari
            </li>
            <li>
              💾 <strong>Storage:</strong> 100MB minimum
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionLegalCompliance = () => (
  <section id="legal-compliance" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <Gavel className="w-6 h-6 mr-3 text-blue-600" />
      10. Legal and Regulatory Compliance
    </h2>
    <div className="space-y-6">
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          10.1 Compliance with Local Laws
        </h3>
        <p className="text-gray-700 dark:text-white mb-3">
          WasaaChat operates across multiple African countries and complies with
          national regulatory frameworks and international data protection
          standards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            🇰🇪 Kenya Compliance
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>• Central Bank of Kenya (CBK) regulations</li>
            <li>• Data Protection Act, 2019</li>
            <li>• National Payment System Act</li>
            <li>• KYC and AML requirements</li>
            <li>• M-Pesa integration compliance</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            🇺🇬 Uganda Compliance
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>• Uganda Revenue Authority (URA)</li>
            <li>• Bank of Uganda (BoU) regulations</li>
            <li>• Data Protection and Privacy Act, 2019</li>
            <li>• Mobile money taxation</li>
            <li>• TIN requirements for creators</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            10.2 AML and KYC Requirements
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>
              📱 <strong>Level 1:</strong> Phone verification (basic wallet)
            </li>
            <li>
              🆔 <strong>Level 2:</strong> ID + photo (full wallet access)
            </li>
            <li>
              📋 <strong>Level 3:</strong> Address proof + TIN (business)
            </li>
            <li>
              🔍 <strong>Monitoring:</strong> Suspicious activity detection
            </li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            10.3 Law Enforcement Requests
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>⚖️ Valid court orders or subpoenas</li>
            <li>🏛️ Regulatory authority requests</li>
            <li>🚨 Emergency situations (threats, child safety)</li>
            <li>💰 Financial crime investigations</li>
            <li>🔒 User notification when legally permitted</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionDisputeResolution = () => (
  <section id="dispute-resolution" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <Gavel className="w-6 h-6 mr-3 text-blue-600" />
      11. Dispute Resolution and Governing Law
    </h2>
    <div className="space-y-6">
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          11.1 Informal Dispute Process
        </h3>
        <p className="text-gray-700 dark:text-white mb-3">
          Before taking formal legal steps, we encourage users to follow this
          informal resolution process for most issues.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Step 1: Contact Support
            </h4>
            <ul className="text-gray-700 dark:text-white text-xs space-y-1">
              <li>• In-app: Settings → Help & Support</li>
              <li>• Email: support@wasaachat.africa</li>
              <li>• Response: 3-5 business days</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Step 2: Escalation
            </h4>
            <ul className="text-gray-700 dark:text-white text-xs space-y-1">
              <li>• Request supervisor review</li>
              <li>• Specialist unit assignment</li>
              <li>• Review: 7-10 business days</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Step 3: Resolution
            </h4>
            <ul className="text-gray-700 dark:text-white text-xs space-y-1">
              <li>• Adjustment or refund</li>
              <li>• Policy clarification</li>
              <li>• Mediated discussion</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            11.2 Arbitration Procedures
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>
              🤝 <strong>Mediation First:</strong> Good faith mediation
              preferred
            </li>
            <li>
              ⚖️ <strong>Binding Arbitration:</strong> If mediation fails
            </li>
            <li>
              🌍 <strong>Regional Bodies:</strong> Country-specific arbitrators
            </li>
            <li>
              💼 <strong>Exceptions:</strong> Criminal, IP, or urgent matters
            </li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            11.3 Governing Law
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>
              🇰🇪 <strong>Kenya:</strong> Kenyan Law, High Court
            </li>
            <li>
              🇺🇬 <strong>Uganda:</strong> Ugandan Law, Commercial Court
            </li>
            <li>
              🇷🇼 <strong>Rwanda:</strong> Rwandan Law, KIAC
            </li>
            <li>
              🇹🇿 <strong>Tanzania:</strong> Tanzanian Law, High Court
            </li>
            <li>
              📧 <strong>Legal Contact:</strong> legal@wasaachat.africa
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionLiabilityIndemnity = () => (
  <section id="liability-indemnity" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <AlertTriangle className="w-6 h-6 mr-3 text-blue-600" />
      12. Limitation of Liability and Indemnity
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            12.1 No Liability for User Actions
          </h3>
          <p className="text-gray-700 dark:text-white text-sm mb-2">
            WasaaChat cannot be held responsible for:
          </p>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>• Independent actions of other users</li>
            <li>• Content shared by users</li>
            <li>• Private agreements between users</li>
            <li>• Compromised accounts due to shared PINs</li>
            <li>• Third-party payment gateway issues</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            12.2 Force Majeure Events
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>🌪️ Natural disasters</li>
            <li>⚡ Power outages or infrastructure failures</li>
            <li>🔒 Cyberattacks or hacking</li>
            <li>🏛️ Government actions or censorship</li>
            <li>🦠 Pandemics or public health emergencies</li>
          </ul>
        </div>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            12.3 User Responsibility
          </h3>
          <p className="text-gray-700 dark:text-white text-sm mb-2">
            You are personally responsible for:
          </p>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>• All content you post or share</li>
            <li>• Wallet transactions you authorize</li>
            <li>• Abusive behavior or violations</li>
            <li>• Legal consequences of your actions</li>
            <li>• Cooperation with investigations</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            12.4 Indemnification
          </h3>
          <p className="text-gray-700 dark:text-white text-sm mb-2">
            You agree to hold WasaaChat harmless from:
          </p>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>• Claims arising from Terms violations</li>
            <li>• Intellectual property infringement</li>
            <li>• Wallet misuse or fraud</li>
            <li>• Content that harms others</li>
            <li>• Legal fees and court costs</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionTermination = () => (
  <section id="termination" className="p-8 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <FileText className="w-6 h-6 mr-3 text-blue-600" />
      13. Termination and Account Closure
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            13.1 User-Initiated Termination
          </h3>
          <p className="text-gray-700 dark:text-white text-sm mb-2">
            How to delete your account:
          </p>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>1. Settings → Privacy & Security → Delete Account</li>
            <li>2. Confirm with PIN/biometric/SMS OTP</li>
            <li>3. Choose data removal preferences</li>
            <li>4. Email: delete@wasaachat.africa</li>
          </ul>
          <p className="text-gray-700 dark:text-white text-xs mt-2 font-medium">
            ⚠️ Processed within 5-10 business days
          </p>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            13.1 What Happens After Deletion
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>🗑️ All chat access and messages removed</li>
            <li>💰 Wallet disabled, balance reviewed for refund</li>
            <li>🚫 Account becomes irreversible</li>
            <li>👨‍💼 Creator content and earnings lost</li>
            <li>⚖️ Legal obligations remain</li>
          </ul>
        </div>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            13.2 Platform-Initiated Termination
          </h3>
          <p className="text-gray-700 dark:text-white text-sm mb-2">Reasons for termination:</p>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>• Repeated community guideline violations</li>
            <li>• Fraudulent transactions or scams</li>
            <li>• Failed KYC verification</li>
            <li>• Illegal or extremist activity</li>
            <li>• Platform exploitation or hacking</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            13.3 Data Retention Policy
          </h3>
          <ul className="text-gray-700 dark:text-white text-sm space-y-1">
            <li>
              🗂️ <strong>Account Info:</strong> Active + 5 years
            </li>
            <li>
              💳 <strong>Transactions:</strong> 7 years (AML compliance)
            </li>
            <li>
              💬 <strong>Chat Metadata:</strong> 90 days
            </li>
            <li>
              🤖 <strong>AI Prompts:</strong> 24-72 hours
            </li>
            <li>
              🎫 <strong>Support Tickets:</strong> 1 year
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionContactSupport = () => (
  <section id="contact-support" className="p-8">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
      <HeadphonesIcon className="w-6 h-6 mr-3 text-blue-600" />
      14. Contact and Support
    </h2>
    <div className="space-y-6">
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          14.1 How to Reach WasaaChat Support
        </h3>
        <p className="text-gray-700 dark:text-white mb-4">
          Multiple support channels are available to help resolve issues and get
          assistance.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              📲 In-App Support (Recommended)
            </h4>
            <ul className="text-gray-700 dark:text-white text-sm space-y-1">
              <li>• Go to Settings → Help & Support → Contact Us</li>
              <li>• Choose category (Wallet, Account, Groups, etc.)</li>
              <li>• Include screenshots or transaction IDs</li>
              <li>• Response time: 24-72 hours</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              🌐 Web Support Portal
            </h4>
            <ul className="text-gray-700 dark:text-white text-sm space-y-1">
              <li>• Visit: www.wasaachat.africa/help</li>
              <li>• View FAQs and how-to guides</li>
              <li>• Download forms for appeals</li>
              <li>• Track support ticket status</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            General Support
          </h3>
          <div className="space-y-2">
            <div className="flex items-center text-gray-600 dark:text-white text-sm">
              <Mail className="w-4 h-4 mr-2" />
              <span>support@wasaachat.africa</span>
            </div>
            <p className="text-gray-500 dark:text-gray-300 text-xs">
              Login help, general inquiries
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Wallet Support
          </h3>
          <div className="space-y-2">
            <div className="flex items-center text-gray-600 dark:text-white text-sm">
              <Mail className="w-4 h-4 mr-2" />
              <span>walletsupport@wasaachat.africa</span>
            </div>
            <p className="text-gray-500 dark:text-gray-300 text-xs">
              Transaction errors, wallet issues
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Safety & Abuse
          </h3>
          <div className="space-y-2">
            <div className="flex items-center text-gray-600 dark:text-white text-sm">
              <Mail className="w-4 h-4 mr-2" />
              <span>safety@wasaachat.africa</span>
            </div>
            <p className="text-gray-500 dark:text-gray-300 text-xs">
              Report abuse, moderation appeals
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Privacy Rights
          </h3>
          <div className="space-y-2">
            <div className="flex items-center text-gray-600 dark:text-white text-sm">
              <Mail className="w-4 h-4 mr-2" />
              <span>privacy@wasaachat.africa</span>
            </div>
            <p className="text-gray-500 dark:text-gray-300 text-xs">
              Data rights, privacy inquiries
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Legal Matters
          </h3>
          <div className="space-y-2">
            <div className="flex items-center text-gray-600 dark:text-white text-sm">
              <Mail className="w-4 h-4 mr-2" />
              <span>legal@wasaachat.africa</span>
            </div>
            <p className="text-gray-500 dark:text-gray-300 text-xs">
              Terms questions, legal inquiries
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Emergency
          </h3>
          <div className="space-y-2">
            <div className="flex items-center text-gray-600 dark:text-white text-sm">
              <Mail className="w-4 h-4 mr-2" />
              <span>emergency@wasaachat.africa</span>
            </div>
            <p className="text-gray-500 dark:text-gray-300 text-xs">
              Urgent safety violations only
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <Shield className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Questions About These Terms?
          </h3>
          <p className="text-gray-600 dark:text-white mb-4">
            We encourage all users to read, understand, and ask questions about
            our Terms & Conditions. We're committed to transparency, clarity,
            and accountability.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-center">
              <Phone className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-gray-700 dark:text-white">+254 793666000</span>
            </div>
            <div className="flex items-center justify-center">
              <Mail className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-gray-700 dark:text-white">legal@wasaachat.africa</span>
            </div>
            <div className="flex items-center justify-center">
              <Globe className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-gray-700 dark:text-white">wasaachat.africa/legal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default TermsConditionsPage;