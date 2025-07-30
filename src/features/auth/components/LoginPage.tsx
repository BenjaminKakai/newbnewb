"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useQRCodeAuth } from "@/services/qrCodeSocketService";
import qrCodeSocketService from "@/services/qrCodeSocketService";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import { Fingerprint, Key, Eye, EyeOff, Lock } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const countries: Country[] = [
  { code: "KE", name: "Kenya", flag: "🇰🇪", dialCode: "+254" },
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dialCode: "+234" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", dialCode: "+27" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", dialCode: "+233" },
  { code: "UG", name: "Uganda", flag: "🇺🇬", dialCode: "+256" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", dialCode: "+255" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼", dialCode: "+250" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹", dialCode: "+251" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", dialCode: "+20" },
  { code: "MA", name: "Morocco", flag: "🇲🇦", dialCode: "+212" },
];

const Spinner: React.FC = () => (
  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

// Mock ReCAPTCHA Component
const MockReCaptcha: React.FC<{ onVerify: (verified: boolean) => void }> = ({
  onVerify,
}) => {
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = () => {
    setIsVerified(true);
    onVerify(true);
  };

  return (
    <div className="flex items-center justify-center">
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 w-full max-w-sm">
        <div className="flex items-center space-x-3">
          <div
            className={`w-6 h-6 border-2 rounded cursor-pointer flex items-center justify-center transition-colors ${
              isVerified
                ? "bg-blue-500 border-blue-500"
                : "border-gray-400 hover:border-gray-500"
            }`}
            onClick={handleVerify}
          >
            {isVerified && (
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          <span className="text-sm text-gray-700">I'm not a robot</span>
          <div className="ml-auto">
            <div className="text-xs text-gray-500">
              <div className="font-bold">reCAPTCHA</div>
              <div className="flex space-x-1 text-xs">
                <span>Privacy</span>
                <span>-</span>
                <span>Terms</span>
              </div>
            </div>
          </div>
          <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QRCodeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [qrError, setQrError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "waiting" | "error"
  >("connecting");

  // Use ref to prevent double execution in React Strict Mode
  const initializationRef = useRef(false);
  const isMountedRef = useRef(true);

  const router = useRouter();
  const { generateQRCode, loginWithQRCode } = useAuthStore();

  // Function to validate QR code value
  const isValidQRValue = (value: any): value is string => {
    return typeof value === "string" && value.trim().length > 0;
  };

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    isMountedRef.current = true;

    const initializeQRCode = async () => {
      try {
        console.log("🔄 Starting QR code initialization...");
        setIsGenerating(true);
        setConnectionStatus("connecting");
        setQrError(null);

        // Generate QR code from API FIRST - only once
        console.log("📡 Calling generateQRCode...");
        const generatedQRCode = await generateQRCode();

        if (!isMountedRef.current) return;

        console.log("✅ QR code generated:", generatedQRCode);
        console.log("📏 QR code length:", generatedQRCode?.length);
        console.log("🔍 QR code type:", typeof generatedQRCode);

        // Validate the QR code value
        if (!isValidQRValue(generatedQRCode)) {
          console.error("❌ Invalid QR code received:", generatedQRCode);
          throw new Error(
            `Invalid QR code received from server. Expected string, got ${typeof generatedQRCode}`
          );
        }

        // Additional validation for common QR code formats
        const trimmedQRCode = generatedQRCode.trim();
        if (trimmedQRCode.length < 10) {
          // Minimum reasonable length
          throw new Error("QR code value too short to be valid");
        }

        // CRITICAL: Set the QR code for display immediately
        console.log(
          "✅ Setting QR code for display:",
          trimmedQRCode.substring(0, 50) + "..."
        );
        setQrCode(trimmedQRCode);
        setIsGenerating(false);

        // Set up auth success listener AFTER QR code is generated
        qrCodeSocketService.onAuthSuccess(async (data) => {
          if (!isMountedRef.current) return;

          console.log("🎉 QR Authentication successful:", data);
          try {
            await loginWithQRCode({
              accessToken: data.tokens.access_token,
              refreshToken: data.tokens.refresh_token,
              user: data.user,
            });

            // toast.success("Login successful!");

            // Check KYC status and redirect accordingly
            if (!data.user.kyc_status) {
              toast.info("Please complete your profile to continue");
              router.push("/profile/complete");
            } else if (!data.user.id_number_verified) {
              toast.info("Please verify your ID number to continue");
              router.push("/profile/verify-id");
            } else {
              router.push("/chat");
            }

            onClose();
          } catch (error) {
            console.error("❌ Failed to process QR login:", error);
            toast.error("Login failed. Please try again.");
          }
        });

        // Set up error listener
        qrCodeSocketService.onError((error) => {
          if (!isMountedRef.current) return;
          console.error("❌ Socket error:", error);
          setConnectionStatus("error");
          toast.error(error);
        });

        // Set up disconnect listener
        qrCodeSocketService.onDisconnect(() => {
          if (!isMountedRef.current) return;
          console.log("🔌 QR Auth disconnected");
          setConnectionStatus("error");
        });

        // Connect to websocket with the QR code
        console.log("🔌 Connecting to websocket...");
        await qrCodeSocketService.connect(trimmedQRCode);

        if (!isMountedRef.current) return;

        setConnectionStatus("waiting");
        console.log("⏳ Waiting for QR code scan...");
      } catch (error) {
        if (!isMountedRef.current) return;

        console.error("❌ QR code initialization failed:", error);
        setConnectionStatus("error");
        setIsGenerating(false);
        setQrError(
          error instanceof Error ? error.message : "Failed to generate QR code"
        );
        toast.error("Failed to generate QR code. Please try again.");
      }
    };

    initializeQRCode();

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up QR code modal...");
      isMountedRef.current = false;
      qrCodeSocketService.disconnect();
    };
  }, []); // Empty dependency array - should only run once

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connecting":
        return isGenerating ? "Generating QR Code..." : "Connecting...";
      case "connected":
        return "Connected! Setting up...";
      case "waiting":
        return "Waiting for scan...";
      case "error":
        return qrError || "Connection failed";
      default:
        return "Initializing...";
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "waiting":
        return "bg-green-500";
      case "connected":
        return "bg-blue-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const handleClose = () => {
    console.log("🚪 Closing QR code modal...");
    isMountedRef.current = false;
    qrCodeSocketService.disconnect();
    onClose();
  };

  const handleRetry = () => {
    console.log("🔄 Retrying QR code generation...");
    // Reset initialization flag and state
    initializationRef.current = false;
    setQrCode(null);
    setIsGenerating(true);
    setQrError(null);
    setConnectionStatus("connecting");

    // Force re-initialization by updating a key state
    setTimeout(() => {
      // This will trigger the useEffect again
      window.location.reload();
    }, 100);
  };

  // Render QR Code with better error handling
  const renderQRCode = () => {
    if (!qrCode || qrError) {
      return (
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-sm text-red-600 text-center">
            {qrError || "Failed to generate QR code"}
          </span>
        </div>
      );
    }

    try {
      return (
        <div className="p-4 w-full h-full flex items-center justify-center">
          <QRCodeSVG
            value={qrCode}
            size={180} // Reduced size to avoid container issues
            level="M" // Changed from H to M for better compatibility
            includeMargin={true}
            fgColor="#000000"
            bgColor="#FFFFFF"
            // Removed imageSettings temporarily to avoid logo issues
            // imageSettings={{
            //   src: "/logo.png",
            //   height: 24,
            //   width: 24,
            //   excavate: true,
            // }}
          />
          {/* Debug info in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
              {qrCode.substring(0, 20)}...
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error("❌ QR Code rendering error:", error);
      return (
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-sm text-red-600">QR code rendering failed</span>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-white/50 dark:bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-black p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            Sign in with QR Code
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="text-center">
          {/* QR Code Display */}
          <div className="w-64 h-64 bg-white border-4 border-gray-200 rounded-lg flex items-center justify-center relative mx-auto">
            {isGenerating && !qrCode ? (
              <div className="flex flex-col items-center space-y-3">
                <Spinner />
                <span className="text-sm text-gray-600">
                  Generating QR Code...
                </span>
              </div>
            ) : (
              renderQRCode()
            )}
          </div>

          <div className="mt-6 space-y-3">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
              Scan with your phone
            </h4>

            {/* Connection Status */}
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mt-4">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${getStatusColor()}`}
              ></div>
              <span>{getStatusText()}</span>
            </div>

            {/* Error Display */}
            {(connectionStatus === "error" || qrError) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  {qrError || "Failed to connect. Please try again."}
                </p>
              </div>
            )}

            {/* Success State */}
            {connectionStatus === "waiting" && qrCode && !qrError && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">
                  ✅ QR Code ready! Scan with your mobile app.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            {connectionStatus === "error" || qrError ? (
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            ) : null}

            <button
              onClick={handleClose}
              className="block mx-auto px-6 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CountryCodePicker: React.FC<{
  selectedCountry: Country;
  onSelectCountry: (country: Country) => void;
}> = ({ selectedCountry, onSelectCountry }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm)
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 h-full bg-transaparent rounded-2xl focus:outline-none"
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <span className="text-sm font-medium text-gray-700">
          {selectedCountry.dialCode}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-80 z-10 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onSelectCountry(country);
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-left"
              >
                <span className="text-lg">{country.flag}</span>
                <span className="text-sm font-medium text-gray-700">
                  {country.dialCode}
                </span>
                <span className="text-sm text-gray-600 truncate">
                  {country.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const LoginPageWithPhone: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [isFocused, setIsFocused] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const router = useRouter();

  // Zustand store
  const { user, isLoading, error, signIn, clearError, setUserId } =
    useAuthStore();

  useEffect(() => {
    const checkAuthStatus = () => {
      setIsCheckingAuth(true);

      if (user) {
        const previousRoute =
          typeof window !== "undefined" && window.location.pathname !== "/login"
            ? window.location.pathname
            : "/";
        router.push(previousRoute);
        return;
      }

      setTimeout(() => {
        setIsCheckingAuth(false);
      }, 100);
    };

    checkAuthStatus();
  }, [user, router]);

  if (isCheckingAuth || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A8FEA]"></div>
          <span className="text-gray-600 dark:text-white text-sm">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      return;
    }

    clearError();

    try {
      const userId = await signIn({
        phoneNumber,
        countryCode: selectedCountry.dialCode,
        country: selectedCountry.name,
        fcmToken: "sample_fcm_token",
      });

      // Navigate to OTP verification page
      router.push("/otp");
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to login to app";
      toast.error(`Login failed: ${errorMessage}`);
    }
  };

  return (
    <div
      className="min-h-screen p-4 bg-[var(--background)]/50 text-[var(--foreground)] flex"
      // style={{
      //   background: "linear-gradient(to top right, #CFE0F7, #FFFFFF)",
      // }}
    >
      <div className="hidden rounded-lg lg:flex lg:w-1/2 relative overflow-hidden p-4 bg-[var(--background)]">
        {/* Background pattern */}
        <div className="">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("/pattern.svg")`,
            }}
          ></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo section in the center */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              {/* WasaaChat Logo */}
              <div className="flex items-center justify-center mb-4">
                <img src="/logo-bg.svg" className="" />
              </div>
            </div>
          </div>

          {/* Bottom content */}
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4 leading-tight">
                Stay close to your
                <br />
                people anytime,
                <br />
                anywhere.
              </h2>
              <p className="text-[var(--foreground)] text-sm leading-relaxed max-w-md">
                Chat, voice, and send money – in one
                <br />
                Afro-inspired app.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Phone mockup - positioned to extend outside */}
      <div className="hidden lg:block absolute bottom-0 left-[400px] z-30">
        <div className="relative">
          {/* Phone frame */}
          <img src="/wasaa-phone-new.svg" className="w-60 h-auto" />
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              Sign In to WasaaChat
            </h1>
            {/* <p className="text-gray-500 text-xs">Access to Wasaa</p> */}
          </div>

          <div className="text-black">
            {!showPhoneForm && !showQRCode ? (
              <div className="space-y-4">
                {/* Phone Sign Up Button */}
                <button
                  onClick={() => setShowPhoneForm(true)}
                  className="w-full bg-[#2A8FEA] text-[var(--foreground)] py-2 px-6 mt-8 rounded-2xl font-medium hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>Sign in with phone number</span>
                </button>

                {/* QR Code Sign In Button */}
                <button
                  onClick={() => setShowQRCode(true)}
                  className="w-full bg-white dark:bg-black text-[#2A8FEA] py-2 px-6 border-2 border-[#2A8FEA] rounded-2xl font-medium hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M16 12h4.01M12 8h4.01M8 16h.01M8 12h.01M8 8h.01M4 16h.01M4 12h.01M4 8h.01"
                    />
                  </svg>
                  <span>Sign in with QR code</span>
                </button>

                {/* Terms */}
                <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                  By signing in you agree to the{" "}
                  <a
                    href="/terms-and-conditions"
                    className="text-blue-400 hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy-policy"
                    className="text-blue-400 hover:underline"
                  >
                    Privacy Policy
                  </a>
                  , including{" "}
                  <a
                    href="/data-protection"
                    className="text-blue-400 hover:underline"
                  >
                    Cookie Use
                  </a>
                  .
                </p>
              </div>
            ) : showPhoneForm ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-6 mt-6">
                  {/* <button
                    onClick={() => {
                      setShowPhoneForm(false);
                      setShowQRCode(false);
                      clearError();
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button> */}
                  {/* <h2 className="text-lg font-semibold text-gray-800">
                    Sign in with phone
                  </h2> */}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    {/* Unified Phone Input Field */}
                    <div
                      className={`relative flex items-center bg-transparent border-1 rounded-lg transition-all duration-200 ${
                        isFocused
                          ? "border-gray-500 ring-0 ring-gray-500 shadow-sm"
                          : "border-gray-400 hover:border-gray-400"
                      }`}
                    >
                      {/* Country Code Picker */}
                      <div className="flex-shrink-">
                        <CountryCodePicker
                          selectedCountry={selectedCountry}
                          onSelectCountry={setSelectedCountry}
                        />
                      </div>

                      {/* Phone Number Input */}
                      <input
                        className="flex-1 px-4 bg-transparent text-[var(--foreground)] placeholder-gray-400 focus:outline-none "
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Enter your phone number"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex justify-end mt-2">
                      <a
                        href="#"
                        className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        Forgot?
                      </a>
                    </div>
                  </div>
                  {/* Remember Device and Auth Icons */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberDevice}
                        onChange={(e) => setRememberDevice(e.target.checked)}
                        className="w-3 h-3 text-blue-500 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-xs text-gray-600">
                        Remember this device
                      </span>
                    </label>

                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                        title="Use Fingerprint"
                      >
                        <Fingerprint className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        type="button"
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                        title="Use Security Key"
                      >
                        <Key className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`w-full px-4 py-2 rounded-full text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
                      isLoading
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-[#2A8FEA] text-white hover:bg-bg-gray-600 hover:shadow-lg transform hover:scale-105"
                    }`}
                    disabled={isLoading || !phoneNumber.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Spinner />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </form>

                {/* reCAPTCHA */}
                {/* <div className="mt-8">
                  <MockReCaptcha onVerify={setIsRecaptchaVerified} />
                </div> */}

                {/* End-to-end Encrypted */}
                <div className="flex items-center justify-center mt-8 space-x-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    End-to-end encrypted
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && <QRCodeModal onClose={() => setShowQRCode(false)} />}
    </div>
  );
};
