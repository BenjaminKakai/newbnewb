"use client";

import React, { useState, useEffect } from "react";
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
  X,
  GlobeIcon,
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";

const PrivacyPolicyPage = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.style.setProperty("--background", "#292929");
      document.documentElement.style.setProperty("--foreground", "#ededed");
    } else {
      document.documentElement.style.setProperty("--background", "#ffffff");
      document.documentElement.style.setProperty("--foreground", "#171717");
    }
  }, [theme]);

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
      id: "information-collected",
      title: "2. What Information We Collect",
      icon: Eye,
    },
    { id: "how-we-use", title: "3. How We Use Your Information", icon: Users },
    { id: "legal-basis", title: "4. Legal Basis for Processing", icon: Shield },
    {
      id: "data-sharing",
      title: "5. Who We Share Information With",
      icon: Globe,
    },
    {
      id: "cookies",
      title: "6. Use of Cookies & Tracking Technologies",
      icon: Lock,
    },
    { id: "data-retention", title: "7. Data Retention", icon: FileText },
    { id: "children-privacy", title: "8. Children's Privacy", icon: Users },
    { id: "your-rights", title: "9. Your Rights", icon: Shield },
    {
      id: "exercise-rights",
      title: "10. How to Exercise Your Rights",
      icon: Users,
    },
    {
      id: "cross-border",
      title: "11. Cross-Border Data Transfers",
      icon: Globe,
    },
    {
      id: "data-protection",
      title: "12. How We Protect Your Data",
      icon: Lock,
    },
    { id: "policy-updates", title: "13. Policy Updates", icon: FileText },
    { id: "contact", title: "14. Contact Information", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-var(--background) text-var(--foreground)">
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        toggleDrawer={toggleDrawer}
      />

      <div className="max-w-5xl mx-auto pt-30 px-4 py-8">
        <PageHeader />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <TableOfContents sections={sections} />
          <MainContent sections={sections} />
        </div>
      </div>
    </div>
  );
};

const Header = ({ toggleDrawer, theme, toggleTheme }) => (
  <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center md:px-48 px-4 py-6 backdrop-blur-sm">
    <div className="absolute flex bottom-4 border-b border-[#D1D7DC] px-48 w-[1030px]"></div>
    <img
      src={theme === "dark" ? "/dark-logo-white.svg" : "/dark-logo-full.svg"}
      className="w-36"
      alt="WasaaChat logo icon"
    />
    <nav className="hidden md:flex space-x-8 text-md">
      <a href="#" className="hover:text-[#2A8FEA]">
        Features
      </a>
      <a href="#" className="hover:text-[#2A8FEA]">
        FAQ
      </a>
      <a href="#" className="hover:text-[#2A8FEA]">
        Apps
      </a>
    </nav>

    <div className="flex items-center space-x-4">
      <button
        onClick={toggleTheme}
        className="p-2 roun/ded-full cursor-pointer"
        aria-label="Toggle Theme"
      >
        {theme === "light" ? (
          <Sun className="w-5 h-5 text-gray-500" />
        ) : (
          <Sun className="w-5 h-5 text-white" />
        )}
      </button>
      <div className="hidden md:block">
        <Link href="/login" className="text-[#2A8FEA] text-sm font-semibold">
          <button className="bg-[#2A8FEA] text-white px-5 py-2 rounded-full text-sm hover:bg-[#2A8FEA]">
            Get Started
          </button>
        </Link>
      </div>
    </div>

    <button
      className="block md:hidden text-black border border-[#2A8FEA] rounded-lg p-1"
      onClick={() => setMenuOpen(true)}
    >
      <Menu className="w-6 h-6" />
    </button>
  </header>

  // {menuOpen && (
  //   <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
  //     <div className="w-64 h-full bg-white shadow-lg p-6 flex flex-col">
  //       <div className="flex justify-between items-center mb-6">
  //         <img
  //           src="/dark-logo-full.svg"
  //           className="w-28"
  //           alt="WasaaChat logo"
  //         />
  //         <button onClick={() => setMenuOpen(false)}>
  //           <X className="w-6 h-6 text-black" />
  //         </button>
  //       </div>
  //       <nav className="flex flex-col space-y-4 text-md">
  //         <a href="#" className="hover:text-[#2A8FEA]">
  //           Features
  //         </a>
  //         <a href="#" className="hover:text-[#2A8FEA]">
  //           FAQ
  //         </a>
  //         <a href="#" className="hover:text-[#2A8FEA]">
  //           Apps
  //         </a>
  //       </nav>
  //       <button className="mt-auto bg-[#2A8FEA] text-white px-4 py-2 rounded-full text-sm hover:bg-blue-700">
  //         Get Started
  //       </button>
  //     </div>
  //   </div>
  // )}
);

const PageHeader = () => (
  <div className="text-left mb-12">
    <div className="flex items-left justify-left mb-4">
      <h1 className="text-4xl font-bold">
        WasaaChat Privacy Policy
      </h1>
    </div>
    <p className="text-lg ">
      Your privacy and data security matter to us. This Privacy Policy explains
      how we collect, use, store, and protect your personal information when you
      use our app and related services.
    </p>
    <div className="mt-6 inline-flex items-center px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600">
      <span className="text-sm ">
        Last Updated: July 2025
      </span>
    </div>
  </div>
);

const TableOfContents = ({ sections }) => (
  <div className="lg:col-span-1">
    <div className="sticky top-24 border-r border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4">
        Table of Contents
      </h3>
      <nav className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center text-sm  hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
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
    <div className=" dark:border-gray-700">
      <SectionIntroduction />
      <SectionInformationCollected />
      <SectionHowWeUse />
      <SectionLegalBasis />
      <SectionYourRights />
      <SectionDataProtection />
      <SectionContact />
    </div>
  </div>
);

const SectionIntroduction = () => (
  <section
    id="introduction"
    className="p-8 border-b border-gray-200 dark:border-gray-700"
  >
    <h2 className="text-2xl font-bold mb-6 flex items-center">
      <FileText className="w-6 h-6 mr-3 text-blue-600" />
      1. Introduction
    </h2>
    <div className="prose max-w-none">
      <p className="mb-4">
        At <strong>WasaaChat</strong>, your privacy and data security matter to
        us. This Privacy Policy explains how we collect, use, store, and protect
        your personal information when you use our app and related services. We
        believe in <strong>transparency</strong>, <strong>user control</strong>,
        and{" "}
        <strong>
          data practices that reflect African values, legal standards, and
          digital rights
        </strong>
        .
      </p>
      <p className="mb-6">
        WasaaChat is committed to safeguarding your personal information in a
        way that's simple to understand, respectful of your rights, and
        compliant with applicable privacy laws across East Africa and beyond.
      </p>
      <div className="p-6 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3">
          1.1 Purpose of the Policy
        </h3>
        <ul className="space-y-2">
          <li>• Clearly explain what data we collect and why</li>
          <li>• Show how we use, store, and share your information</li>
          <li>• Inform you of your privacy rights under local laws</li>
          <li>
            • Help you understand your options for managing or deleting your
            data
          </li>
        </ul>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-2">
            Applicable Laws
          </h4>
          <ul className="text-sm  space-y-1">
            <li>🇰🇪 Kenya's Data Protection Act (2019)</li>
            <li>🇺🇬 Uganda's Data Protection and Privacy Act (2019)</li>
            <li>🇹🇿 Tanzania's Personal Data Protection Act (2022)</li>
            <li>🇷🇼 Rwanda's ICT Law</li>
            <li>🇪🇺 GDPR (where applicable)</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-2">
            Regional Operations
          </h4>
          <ul className="text-sm  space-y-1">
            <li>🇰🇪 Kenya (Head Office, Engineering)</li>
            <li>🇺🇬 Uganda (Creator Success & Community)</li>
            <li>🇹🇿 Tanzania (Content & Livestream Ops)</li>
            <li>🇷🇼 Rwanda (Compliance & Regulatory)</li>
            <li>🇪🇹 Ethiopia (Localization & Language UX)</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionInformationCollected = () => (
  <section
    id="information-collected"
    className="p-8 border-b border-gray-200 dark:border-gray-700"
  >
    <h2 className="text-2xl font-bold mb-6 flex items-center">
      <Eye className="w-6 h-6 mr-3 text-blue-600" />
      2. What Information We Collect
    </h2>
    <div className="space-y-6">
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3">
          2.1 Information You Provide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className=" space-y-2">
            <li>• Your phone number (required for account creation)</li>
            <li>• Your profile name, photo, or bio</li>
            <li>• PIN code for wallet access (encrypted)</li>
            <li>• Feedback or support messages</li>
          </ul>
          <ul className=" space-y-2">
            <li>• Messages you write (end-to-end encrypted)</li>
            <li>• Group names and membership</li>
            <li>• Content uploads and livestream data</li>
            <li>• Subscription and payout details</li>
          </ul>
        </div>
      </div>
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3">
          2.2 Information We Collect Automatically
        </h3>
        <ul className=" space-y-2">
          <li>• App usage data (features used, crash logs)</li>
          <li>• Interaction data (tap, scroll, click behavior)</li>
          <li>• Session logs (login/logout times, app version)</li>
          <li>• Notifications and AI Copilot usage</li>
        </ul>
        <p className=" mt-3 font-medium">
          ⚠️ We never read or access the content of your private messages.
        </p>
      </div>
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3">
          2.3 Wallet & Transaction Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className=" space-y-2">
            <li>• Mobile wallet provider (M-Pesa, Airtel Money)</li>
            <li>• Top-up and withdrawal amounts</li>
            <li>• P2P transfers and group contributions</li>
          </ul>
          <ul className=" space-y-2">
            <li>• Timestamps and transaction reference IDs</li>
            <li>• Recipient info and payment requests</li>
            <li>• Your wallet balance (visible only to you)</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionHowWeUse = () => (
  <section
    id="how-we-use"
    className="p-8 border-b border-gray-200 dark:border-gray-700"
  >
    <h2 className="text-2xl font-bold mb-6 flex items-center">
      <Users className="w-6 h-6 mr-3 text-blue-600" />
      3. How We Use Your Information
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2">
            3.1 To Deliver WasaaChat Services
          </h3>
          <ul className=" text-sm space-y-1">
            <li>• Register and manage your account</li>
            <li>• Enable real-time messaging and calling</li>
            <li>• Personalize content with AI Copilot</li>
            <li>• Sync conversations across devices</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2">
            3.2 To Process Payments
          </h3>
          <ul className=" text-sm space-y-1">
            <li>• Allow top-ups and withdrawals</li>
            <li>• Process creator tips and subscriptions</li>
            <li>• Track group wallet contributions</li>
            <li>• Prevent fraud and unusual behavior</li>
          </ul>
        </div>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold  mb-2">
            3.3 For Safety & Security
          </h3>
          <ul className=" text-sm space-y-1">
            <li>• Verify user identity and device access</li>
            <li>• Enforce community guidelines</li>
            <li>• Detect bots, spam, and fraud</li>
            <li>• Support account recovery</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold  mb-2">
            3.4 For Analytics & Improvement
          </h3>
          <ul className=" text-sm space-y-1">
            <li>• Understand feature usage patterns</li>
            <li>• Measure app performance and fix bugs</li>
            <li>• Train AI for local languages</li>
            <li>• Conduct user satisfaction surveys</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const SectionLegalBasis = () => (
  <section
    id="legal-basis"
    className="p-8 border-b border-gray-200 dark:border-gray-700"
  >
    <h2 className="text-2xl font-bold  mb-6 flex items-center">
      <Shield className="w-6 h-6 mr-3 text-blue-600" />
      4. Legal Basis for Processing
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3">
          4.1 Consent
        </h3>
        <p className=" mb-3">
          We rely on your clear, informed consent when:
        </p>
        <ul className=" text-sm space-y-1">
          <li>• You opt in to Copilot personalization</li>
          <li>• You agree to receive notifications</li>
          <li>• You allow camera/microphone access</li>
          <li>• You accept cookies on our website</li>
        </ul>
      </div>
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-3">
          4.2 Contractual Necessity
        </h3>
        <p className=" mb-3">
          We process data necessary to fulfill our agreement:
        </p>
        <ul className=" text-sm space-y-1">
          <li>• Create and maintain your account</li>
          <li>• Deliver messaging and livestreaming</li>
          <li>• Process wallet transactions</li>
          <li>• Provide technical support</li>
        </ul>
      </div>
    </div>
  </section>
);

const SectionYourRights = () => (
  <section
    id="your-rights"
    className="p-8 border-b border-gray-200 dark:border-gray-700"
  >
    <h2 className="text-2xl font-bold mb-6 flex items-center">
      <Shield className="w-6 h-6 mr-3 text-blue-600" />
      9. Your Rights
    </h2>
    <div className="p-6 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
      <p className="">
        WasaaChat believes in <strong>digital dignity and user control</strong>.
        We give you tools to manage your personal data and fully support your
        right to privacy.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-2">
          Right to Access
        </h3>
        <p className=" text-sm">
          Request a copy of your personal data and understand how we process it.
        </p>
      </div>
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-2">
          Right to Correction
        </h3>
        <p className=" text-sm">
          Edit your profile and request corrections to inaccurate information.
        </p>
      </div>
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-2">
          Right to Deletion
        </h3>
        <p className=" text-sm">
          Request deletion of your account and personal data (honored within 30
          days).
        </p>
      </div>
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-2">
          Right to Object
        </h3>
        <p className=" text-sm">
          Withdraw consent for personalization, analytics, or marketing
          notifications.
        </p>
      </div>
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-2">
          Right to Portability
        </h3>
        <p className=" text-sm">
          Export your data in machine-readable format or transfer to another
          service.
        </p>
      </div>
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-2">
          Right to Complain
        </h3>
        <p className=" text-sm">
          Lodge formal complaints with our DPO or national data authorities.
        </p>
      </div>
    </div>
  </section>
);

const SectionDataProtection = () => (
  <section
    id="data-protection"
    className="p-8 border-b border-gray-200 dark:border-gray-700"
  >
    <h2 className="text-2xl font-bold mb-6 flex items-center">
      <Lock className="w-6 h-6 mr-3 text-blue-600" />
      12. How We Protect Your Data
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2">
            🔒 Encryption
          </h3>
          <ul className=" text-sm space-y-1">
            <li>• End-to-end encrypted messages and calls</li>
            <li>• AES-256 encryption for wallet data</li>
            <li>• TLS 1.3 for all server communication</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2">
            🛡️ Access Controls
          </h3>
          <ul className=" text-sm space-y-1">
            <li>• 4-digit PIN for wallet security</li>
            <li>• Biometric login (fingerprint/Face ID)</li>
            <li>• Multi-factor authentication for admin access</li>
          </ul>
        </div>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2">
            💳 Payment Security
          </h3>
          <ul className=" text-sm space-y-1">
            <li>• AI-based fraud detection</li>
            <li>• PCI-compliant payment processors</li>
            <li>• Transaction velocity monitoring</li>
          </ul>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-2">
            🔍 Internal Controls
          </h3>
          <ul className=" text-sm space-y-1">
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
    <h2 className="text-2xl font-bold  mb-6 flex items-center">
      <Mail className="w-6 h-6 mr-3 text-blue-600" />
      14. Contact Information
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold  mb-4">
          Data Protection Officer (DPO)
        </h3>
        <div className="space-y-3">
          <div className="flex items-center ">
            <Mail className="w-4 h-4 mr-2" />
            <a href="mailto:privacy@wasaachat.com" className="hover:underline">
              privacy@wasaachat.com
            </a>
          </div>
          <div className="flex items-center ">
            <Phone className="w-4 h-4 mr-2" />
            <span>+254 793666000</span>
          </div>
          <p className=" text-sm">
            Response time: Within 7 business days
          </p>
        </div>
      </div>
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold  mb-4">
          Regional Offices
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start">
            <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
            <div>
              <strong className="">
                Kenya (HQ):
              </strong>
              <br />
              <span className="">
                Delta Corner, Ring Road, Westlands, Nairobi
              </span>
            </div>
          </div>
          <div className="flex items-start">
            <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
            <div>
              <strong className="">Uganda:</strong>
              <br />
              <span className="">
                Acacia Mall Annex, Kira Road, Kampala
              </span>
            </div>
          </div>
          <div className="flex items-start">
            <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-500" />
            <div>
              <strong className="">Rwanda:</strong>
              <br />
              <span className="">
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
        <h3 className="text-lg font-semibold  mb-2">
          Your trust is our top priority
        </h3>
        <p className="">
          We're committed to transparency, accountability, and protecting your
          digital dignity. If you have any questions or concerns about how we
          handle your data, please don't hesitate to reach out.
        </p>
      </div>
    </div>
  </section>
);

export default PrivacyPolicyPage;
