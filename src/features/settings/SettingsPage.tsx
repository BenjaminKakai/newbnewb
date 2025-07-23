"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  Shield,
  MessageCircle,
  Wallet,
  Bell,
  HelpCircle,
  Settings,
  ChevronRight,
  Eye,
  Globe,
  Info,
  Heart,
  Moon,
  Sun,
  ChevronLeft,
  Edit,
  Camera,
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import SidebarNav from "@/components/SidebarNav";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const SettingsPage = () => {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("account");
  const [activeSubTab, setActiveSubTab] = useState("");
  const [currentView, setCurrentView] = useState("settings"); // "settings" or "profile"
  const [searchTerm, setSearchTerm] = useState("");
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // State to handle auth check

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    about: "...",
  });

  // Toggle states for privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    lastSeen: true,
    online: true,
    about: false,
    status: true,
    blockUnknown: false,
    disableLinkPreviews: true,
  });

  // Toggle states for notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    smsNotifications: true,
    soundNotifications: true,
    vibrationNotifications: true,
  });

  // Toggle states for chat settings
  const [chatSettings, setChatSettings] = useState({
    readReceipts: true,
    typingIndicators: true,
    autoDownloadMedia: false,
    saveToGallery: true,
    enterToSend: false,
  });

  const menuItems = [
    { id: "account", label: "Account", icon: User },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "notification", label: "Notification", icon: Bell },
    { id: "help", label: "Help", icon: HelpCircle },
  ];

  const accountSubMenuItems = [
    { id: "security", label: "Secure notifications", icon: Shield },
    { id: "request-info", label: "Request account info", icon: Info },
    { id: "delete-account", label: "Delete my account", icon: User },
  ];

  // Authentication check
  useEffect(() => {
    const checkAuthStatus = () => {
      setIsCheckingAuth(true);

      if (!isAuthenticated || !user) {
        router.replace("/login"); // Redirect to login if not authenticated
        return;
      }

      setTimeout(() => {
        setIsCheckingAuth(false); // Allow rendering after auth check
      }, 100);
    };

    checkAuthStatus();
  }, [isAuthenticated, user, router]);

  // Update profile form when user data changes
  useEffect(() => {
    if (user && isAuthenticated && !isCheckingAuth) {
      setProfileForm((prev) => ({
        ...prev,
        name: user.name || "",
      }));
    }
  }, [user, isAuthenticated, isCheckingAuth]);

  const handlePrivacyToggle = (setting: keyof typeof privacySettings) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleNotificationToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleChatToggle = (setting: keyof typeof chatSettings) => {
    setChatSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleSaveProfile = () => {
    console.log("Saving profile:", profileForm);
    alert("Profile saved successfully!");
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
        checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  const getUserDisplayName = () => {
    if (!user) return "Guest User";
    if (user.name) return user.name;
    if (user.firstName && user.lastName && user.lastName.trim()) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.username) return user.username;
    if (user.email) return user.email;
    return "User";
  };

  const getUserSubtitle = () => {
    if (!user) return "Not authenticated";
    if (user.username && user.name !== user.username) return `@${user.username}`;
    if (user.email) return user.email;
    if (user.phone) return user.phone;
    return user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Member";
  };

  const getUserInitials = () => {
    if (!user) return "GU";
    if (user.firstName) {
      const first = user.firstName[0];
      const last = user.lastName && user.lastName.trim() ? user.lastName[0] : "";
      return last ? `${first}${last}`.toUpperCase() : `${first}${user.firstName[1] || ""}`.toUpperCase();
    }
    const displayName = user.name || user.username || user.email || "User";
    const names = displayName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  const renderUserAvatar = () => {
    if (user?.avatar) {
      return (
        <img
          src={user.avatar}
          alt="Profile"
          className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setCurrentView("profile")}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextSibling!.style.display = "flex";
          }}
        />
      );
    }

    return (
      <div
        className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors"
        onClick={() => setCurrentView("profile")}
      >
        <span className="text-white font-semibold text-lg">{getUserInitials()}</span>
      </div>
    );
  };

  const renderProfilePage = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentView("settings")}
            className="flex items-center space-x-2 text-[#2A8FEA] dark:text-blue-400 text-xs hover:text-[#2A8FEA] dark:hover:text-blue-300"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Settings</span>
          </button>
          <button
            onClick={handleSaveProfile}
            className="px-4 py-2 bg-[#2A8FEA] hover:bg-[#2A8FEA] text-white text-xs rounded-lg font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>

        <h2 className="text-xl font-semibold">Profile</h2>

        <div className="flex flex-col items-center space-y-4 py-8">
          <div className="relative group">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextSibling!.style.display = "flex";
                }}
              />
            ) : (
              <div className="w-32 h-32 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-4xl">{getUserInitials()}</span>
              </div>
            )}
            <div
              className="w-32 h-32 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center"
              style={{ display: "none" }}
            >
              <span className="text-white font-semibold text-4xl">{getUserInitials()}</span>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
            Change Photo
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Your name
          </label>
          <div className="flex items-center space-x-3 p-4 bg-gray-50  rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
              className="flex-1 bg-transparent border-0 focus:outline-none"
            />
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Edit className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This is not your username or PIN. This name will be visible to your contacts.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            About
          </label>
          <div className="flex items-center space-x-3 p-4 bg-gray-50  rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={profileForm.about}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, about: e.target.value }))}
              className="flex-1 bg-transparent border-0 focus:outline-none"
            />
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Edit className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsContent = () => {
    if (activeTab === "account" && activeSubTab) {
      switch (activeSubTab) {
        case "security":
          return (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Security</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Your chats are secure and calls are private
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                  End-to-end encryption keeps your personal messages and calls between you and the people you choose.
                  No one outside of the chat, not even Wasaa, can read, listen to, or share them. This includes your:
                </p>
                <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-4 h-4" />
                    <span>Text and voice messages</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>Audio and video calls</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Photos, videos and documents</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Location sharing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Heart className="w-4 h-4" />
                    <span>Status updates</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-4 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="font-medium">Show security notifications on this computer</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Get notified when your security codes get changes for a contacts phone. If you have multiple
                      devices, this setting should be enabled on each device where you want to get notifications
                    </p>
                  </div>
                  <Toggle checked={true} onChange={() => {}} />
                </div>
              </div>
            </div>
          );
        case "request-info":
          return (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Request account info</h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Your chats are secure and calls are private
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Create a report of your Wasaa account information and settings, which you can access and port to
                  another app. This report does not include your messages
                </p>
              </div>
              <div className="space-y-4">
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Request Report
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You will receive an email with your account information within 24 hours.
                </p>
              </div>
            </div>
          );
        case "delete-account":
          return (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Delete my account</h2>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
                <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
                  Warning: This action cannot be undone
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                  Deleting your account will permanently remove all your data, including messages, contacts, and settings.
                </p>
                <div className="space-y-3 text-sm text-red-800 dark:text-red-200">
                  <p>• All your messages will be deleted</p>
                  <p>• You will be removed from all group chats</p>
                  <p>• Your account cannot be recovered</p>
                </div>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Type 'DELETE' to confirm"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          );
        default:
          return null;
      }
    }

    if (activeTab === "account" && !activeSubTab) {
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Account Settings</h2>
          <div className="space-y-4">
            <div
              onClick={() => setCurrentView("profile")}
              className="flex items-center justify-between py-3 px-4  darkr:bg-gray-700 "
            >
              <div>
                <h3 className="font-medium">Edit Profile</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your account details</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-medium">Change Password</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your password</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Secure your account with 2FA</p>
              </div>
              <Toggle checked={user?.phoneVerified || false} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-medium text-red-600 dark:text-red-400">Delete Account</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "privacy":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Privacy Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium">Last seen</span>
                </div>
                <Toggle checked={privacySettings.lastSeen} onChange={() => handlePrivacyToggle("lastSeen")} />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium">Online</span>
                </div>
                <Toggle checked={privacySettings.online} onChange={() => handlePrivacyToggle("online")} />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium">About</span>
                </div>
                <Toggle checked={privacySettings.about} onChange={() => handlePrivacyToggle("about")} />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <Heart className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium">Status</span>
                </div>
                <Toggle checked={privacySettings.status} onChange={() => handlePrivacyToggle("status")} />
              </div>
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Block unknown account messages</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      To protect your account and improve device performance, Weesah will block messages from unknown
                      accounts if they exceed a certain volume.
                    </p>
                    <Toggle
                      checked={privacySettings.blockUnknown}
                      onChange={() => handlePrivacyToggle("blockUnknown")}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Disable link previews</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      To help protect your IP address from being inferred by third-party websites, previews for the links
                      you share in chats will no longer be generated.
                    </p>
                    <Toggle
                      checked={privacySettings.disableLinkPreviews}
                      onChange={() => handlePrivacyToggle("disableLinkPreviews")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "chat":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Chat Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium">Read receipts</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Show when messages are read</p>
                </div>
                <Toggle checked={chatSettings.readReceipts} onChange={() => handleChatToggle("readReceipts")} />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium">Typing indicators</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Show when you're typing</p>
                </div>
                <Toggle checked={chatSettings.typingIndicators} onChange={() => handleChatToggle("typingIndicators")} />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium">Auto-download media</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically download photos and videos</p>
                </div>
                <Toggle
                  checked={chatSettings.autoDownloadMedia}
                  onChange={() => handleChatToggle("autoDownloadMedia")}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium">Save to gallery</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Save received media to device gallery</p>
                </div>
                <Toggle checked={chatSettings.saveToGallery} onChange={() => handleChatToggle("saveToGallery")} />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium">Enter to send</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Send messages with Enter key</p>
                </div>
                <Toggle checked={chatSettings.enterToSend} onChange={() => handleChatToggle("enterToSend")} />
              </div>
            </div>
          </div>
        );
      case "wallet":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Wallet Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="font-medium">Payment Methods</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your payment methods</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="font-medium">Transaction History</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">View your transaction history</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="font-medium">Auto-pay</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enable automatic payments</p>
                </div>
                <Toggle checked={false} onChange={() => {}} />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="font-medium">Spending Limits</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Set daily and monthly limits</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>
        );
      case "notification":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Notification Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium">Push notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications</p>
                </div>
                <Toggle
                  checked={notificationSettings.pushNotifications}
                  onChange={() => handleNotificationToggle("pushNotifications")}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium">Email notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive email notifications</p>
                </div>
                <Toggle
                  checked={notificationSettings.emailNotifications}
                  onChange={() => handleNotificationToggle("emailNotifications")}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium">SMS notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive SMS notifications</p>
                </div>
                <Toggle
                  checked={notificationSettings.smsNotifications}
                  onChange={() => handleNotificationToggle("smsNotifications")}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium">Sound notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Play sound for notifications</p>
                </div>
                <Toggle
                  checked={notificationSettings.soundNotifications}
                  onChange={() => handleNotificationToggle("soundNotifications")}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium">Vibration notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Vibrate for notifications</p>
                </div>
                <Toggle
                  checked={notificationSettings.vibrationNotifications}
                  onChange={() => handleNotificationToggle("vibrationNotifications")}
                />
              </div>
            </div>
          </div>
        );
      case "help":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Help & Support</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="font-medium">FAQ</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Frequently asked questions</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="font-medium">Contact Support</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get help from our support team</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="font-medium">Report a Bug</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Report technical issues</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="font-medium">Terms of Service</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Read our terms and conditions</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="font-medium">Privacy Policy</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Read our privacy policy</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-96">
            <Settings className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
            <h2 className="text-xl font-semibold">Settings</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Select a category from the sidebar to manage your settings
            </p>
          </div>
        );
    }
  };

  // Render loading state during auth check
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-[var(--foreground)] text-sm">Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[var(--background)] flex">
      <SidebarNav onClose={() => {}} currentPath={pathname} />
      <div className="flex flex-1 ml-20">
        <div className="w-80 bg-gray-100 dark:bg-[var(--background)] border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search settings"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600"
              />
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-3">
              {renderUserAvatar()}
              <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center" style={{ display: "none" }}>
                <span className="text-white font-semibold text-lg">{getUserInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{getUserDisplayName()}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{getUserSubtitle()}</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-6">
            <ul className="space-y-2">
              {activeTab === "account" ? (
                <>
                  <li>
                    <button
                      onClick={() => {
                        setActiveTab("");
                        setActiveSubTab("");
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors hover:bg-gray-100 "
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span className="font-medium">Back</span>
                    </button>
                  </li>
                  {accountSubMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSubTab === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveSubTab(item.id)}
                          className={`w-full flex items-center cursor-pointer space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                            isActive
                              ? " text-[#2A8FEA] border border-blue-200 dark:border-blue-800"
                              : "hover:bg-gray-100 "
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`}
                          />
                          <span className="font-medium">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </>
              ) : (
                menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setActiveTab(item.id);
                          setActiveSubTab("");
                        }}
                        className={`w-full flex items-center cursor-pointer space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                          isActive
                            ? " text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                            : " hover:bg-gray-100 "
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`}
                        />
                        <span className="font-medium">{item.label}</span>
                        {item.id === "account" && (
                          <ChevronRight className="w-4 h-4 ml-auto text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </nav>
        </div>
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">{currentView === "profile" ? renderProfilePage() : renderSettingsContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;