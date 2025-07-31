"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { useTheme } from "@/providers/ThemeProvider";

const Spinner: React.FC = () => (
  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

export const OTPVerificationPage: React.FC = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { isDarkMode } = useTheme();

  const router = useRouter();
  const { userId, user, isLoading, error, verifyOtp, resendOtp, clearError } =
    useAuthStore();

  // Redirect if no userId (user didn't come from login)
  useEffect(() => {
    if (!userId) {
      router.push("/login");
      return;
    }
  }, [userId, router]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push("/chat");
    }
  }, [user, router]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeRemaining]);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const otpArray = value.slice(0, 6).split("");
      const newOtp = [...otp];
      otpArray.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + otpArray.length, 5);
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex]?.focus();
      }
    } else {
      // Single digit input
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    clearError();

    try {
      const nextStep = await verifyOtp({
        userId: userId!,
        otp: otpCode,
        source: "web",
      });
      toast.success("OTP verified successfully!");
      router.push(nextStep || "/chat");
    } catch (err) {
      console.error("Failed to verify OTP:", err);
      toast.error(
        err instanceof Error ? err.message : "OTP verification failed"
      );
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || !userId) return;

    try {
      await resendOtp({
        userId,
        source: "web",
        userType: "standard",
        fcmToken: "sample_fcm_token",
      });
      setTimeRemaining(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
      toast.success("OTP sent successfully!");
    } catch (err) {
      console.error("Failed to resend OTP:", err);
      toast.error("Failed to resend OTP. Please try again.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-[var(--background)]/50 text-[var(--foreground)] flex">
      <div
        className={`hidden rounded-lg lg:flex lg:w-1/2 relative overflow-hidden p-4 ${
          isDarkMode ? "bg-[var(--background)]" : "bg-[#2A8FEA]"
        }`}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url("/pattern.svg")` }}
        ></div>
        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
              <img src="/favicon-3.svg" className="w-32" />
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-4 leading-tight">
                Stay close to your
                <br />
                people anytime,
                <br />
                anywhere.
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed max-w-md">
                Chat, voice, and send money – in one
                <br />
                Afro-inspired app.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-0 left-[400px] z-30">
        <div className="relative">
          <img src="/wasaa-phone-new.svg" className="w-60 h-auto" />
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/full-logo.png"
                alt="WasaaChat Logo"
                className="w-32 h-auto"
              />
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Verify your phone
            </h2>
            <p className="text-[var(--foreground)] text-sm">
              Enter the 6-digit code sent to your phone number
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-[var(--foreground)] text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-[#2A8FEA] focus:outline-none transition-colors"
                  disabled={isLoading}
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || otp.join("").length !== 6}
              className={`w-full py-3 px-6 rounded-full font-bold cursor-pointer transition-all duration-200 flex items-center justify-center space-x-2 ${
                isLoading || otp.join("").length !== 6
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-[#2A8FEA] text-white hover:bg-[#2A8FEA] hover:shadow-lg transform hover:scale-105"
              }`}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify Code</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {!canResend ? (
              <p className="text-sm text-gray-600">
                Resend code in{" "}
                <span className="font-mono text-[#2A8FEA]">
                  {formatTime(timeRemaining)}
                </span>
              </p>
            ) : (
              <button
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-sm text-[#2A8FEA] hover:text-blue-600 font-medium transition-colors disabled:opacity-50"
              >
                Resend verification code
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
