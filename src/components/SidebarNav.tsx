"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";
import { Sun, Moon } from "lucide-react";

interface SidebarNavProps {
  onClose: () => void;
  currentPath?: string;
  onLogout?: () => void;
  children?: React.ReactNode;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ onLogout, children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || "/chat";
  const [theme, setTheme] = useState("light");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get logout functions from store
  const { user, logout, logoutLocal, isLoading } = useAuthStore();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
  }, []);

  // Update CSS variables when theme changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.style.setProperty("--background", "#292929");
      document.documentElement.style.setProperty("--foreground", "#ededed");
    } else {
      document.documentElement.style.setProperty("--background", "#ffffff");
      document.documentElement.style.setProperty("--foreground", "#171717");
    }
    // Save theme to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Handle logout action
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts

    setIsLoggingOut(true);

    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error("API logout failed, performing local logout:", error);
      try {
        logoutLocal();
        toast.success("Logged out successfully");
        router.push("/login");
        if (onLogout) {
          onLogout();
        }
      } catch (localError) {
        console.error("Local logout failed:", localError);
        toast.error("Failed to logout. Please try again.");
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "GU";
    if (user.firstName) {
      const first = user.firstName[0];
      const last = user.lastName && user.lastName.trim() ? user.lastName[0] : "";
      return last
        ? `${first}${last}`.toUpperCase()
        : `${first}${user.firstName[1] || ""}`.toUpperCase();
    }
    const displayName = user.name || user.username || user.email || "User";
    const names = displayName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  // Get icon based on theme
  const getIcon = (lightIcon: string, darkIcon?: string) => {
    if (theme === "dark" && darkIcon) {
      return darkIcon;
    }
    return lightIcon;
  };

  // Get active icon based on theme
  const getActiveIcon = (lightActiveIcon: string, darkActiveIcon?: string) => {
    if (theme === "dark" && darkActiveIcon) {
      return darkActiveIcon;
    }
    return lightActiveIcon;
  };

  // Navigation links configuration with dark mode icons
  const navLinks = [
    {
      path: "/chat",
      icon: "/chats.svg",
      darkIcon: "/chats-active1.svg",
      activeIcon: "/chat-act.svg",
      darkActiveIcon: "/chat-act.svg",
      label: "Chats",
    },
    {
      path: "/group",
      icon: "/groups.svg",
      darkIcon: "/groups-dark.svg",
      activeIcon: "/groups-act.svg",
      darkActiveIcon: "/groups-act.svg",
      label: "Groups",
    },
    {
      path: "/call",
      icon: "/addres.svg",
      darkIcon: "/contacts-active.svg",
      activeIcon: "/contact-act.svg",
      darkActiveIcon: "/contact-act.svg",
      label: "Contacts",
    },
    {
      path: "/wallet",
      icon: "/wallet-n.svg",
      darkIcon: "/wallet-active.svg",
      activeIcon: "/dollar-inactive.svg",
      darkActiveIcon: "/dollar-inactive.svg",
      label: "Wallet",
    },
    {
      path: "/settings",
      icon: "/set.svg",
      darkIcon: "/settings-active.svg",
      activeIcon: "/set-act.svg",
      darkActiveIcon: "/set-act.svg",
      label: "Settings",
    },
  ];

  // Handle navigation
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div
      className="fixed left-0 w-20 bg-[var(--background)] text-[var(--foreground)] z-40 transition-transform duration-300 ease-in-out flex flex-col"
      style={{
        top: "0",
        height: "100vh",
      }}
    >
      {/* Top blue circular element - Logo */}
      <div className="flex justify-center pt-6 pb-8">
        <button
          onClick={() => handleNavigation("/chat")}
          className="hover:scale-110 transition-transform duration-200"
        >
          <img src="/chat-icon.svg" alt="Logo" className="w-10 h-10" />
        </button>
      </div>

      {/* Main navigation icons */}
      <div className="flex flex-col items-center space-y-3 flex-1 px-2">
        {navLinks.map((link) => {
          const isActive = currentPath === link.path;
          const iconSrc = isActive
            ? getActiveIcon(link.activeIcon, link.darkActiveIcon)
            : getIcon(link.icon, link.darkIcon);

          return (
            <button
              key={link.path}
              onClick={() => handleNavigation(link.path)}
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 group w-full ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 scale-105"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105"
              }`}
              title={link.label}
            >
              <div className="mb-1">
                <img
                  src={iconSrc}
                  alt={link.label}
                  className="w-5 h-5 transition-transform duration-200"
                />
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-[var(--foreground)]"
                }`}
              >
                {link.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom section with dark mode toggle, profile, and logout */}
      <div className="flex flex-col items-center space-y-4 pb-6 px-2">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center p-2 cursor-pointer rounded-lg transition-all duration-200 group w-full text-gray-600 dark:text-gray-300  hover:scale-105"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <div className="mb-1">
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-gray-300" />
            ) : (
              <Sun className="w-5 h-5 text-gray-600" />
            )}
          </div>
          <span className="text-xs font-medium transition-colors duration-200">
            {theme === "dark" ? "Light" : "Dark"}
          </span>
        </button>

        {/* Profile */}
        <button
          className="flex flex-col items-center p-2 cursor-pointer rounded-lg transition-all duration-200 group w-full hover:scale-105"
          title="Profile Settings"
        >
          <div className="mb-1 relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600"
              >
                <span className="text-white font-semibold text-xs">
                  {getUserInitials()}
                </span>
              </div>
            )}
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut || isLoading}
          className={`flex flex-col items-center p-2 cursor-pointer rounded-lg transition-all duration-200 group w-full ${
            isLoggingOut || isLoading
              ? "opacity-50 cursor-not-allowed"
              : "text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:scale-105"
          }`}
          title={isLoggingOut ? "Logging out..." : "Logout"}
        >
          <div className="mb-1">
            {isLoggingOut || isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin" />
            ) : (
              <img
                src={theme === "dark" ? "/logout.svg" : "/logout.svg"}
                alt="Logout"
                className="w-5 h-5 transition-transform duration-200"
              />
            )}
          </div>
          <span className="text-xs font-medium transition-colors duration-200">
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>

      {/* Optional children */}
      {children}
    </div>
  );
};

export default SidebarNav;