"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { Shield, CheckCircle } from "lucide-react";

const Spinner: React.FC = () => (
  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

interface VerificationForm {
  identityNumber: string;
  dob: string;
  fullNames: string;
  motherName: string;
  gender: string;
}

export const IDVerificationPage: React.FC = () => {
  const router = useRouter();
  const { user, accessToken, updateUserProfile, isLoading } = useAuthStore();

  const [formData, setFormData] = useState<VerificationForm>({
    identityNumber: user?.identityNumber || "",
    dob: "",
    fullNames: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    motherName: "",
    gender:
      user?.gender === "male" ? "M" : user?.gender === "female" ? "F" : "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "failed"
  >("pending");

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user || !accessToken) {
      router.push("/login");
    }
  }, [user, accessToken, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.identityNumber.trim()) {
      toast.error("Identity number is required");
      return false;
    }
    if (!formData.dob) {
      toast.error("Date of birth is required");
      return false;
    }
    if (!formData.fullNames.trim()) {
      toast.error("Full names are required");
      return false;
    }
    if (!formData.motherName.trim()) {
      toast.error("Mother's name is required");
      return false;
    }
    if (!formData.gender) {
      toast.error("Gender is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!user?.id || !accessToken) {
      toast.error("Authentication required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `http://138.68.190.213:3010/users/${user.id}/verify-id-number`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "x-api-key":
              process.env.NEXT_PUBLIC_API_KEY ||
              "QgR1v+o16jphR9AMSJ9Qf8SnOqmMd4HPziLZvMU1Mt0t7ocaT38q/8AsuOII2YxM60WaXQMkFIYv2bqo+pS/sw==",
          },
          body: JSON.stringify({
            identity_number: formData.identityNumber,
            dob: formData.dob,
            full_names: formData.fullNames,
            mother_name: formData.motherName,
            gender: formData.gender,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ID verification failed");
      }

      toast.success(data.message || "ID verified successfully!");
      setVerificationStatus("success");

      // Update user in store
      await updateUserProfile({
        idNumberVerified: true,
        verificationStatus: "verified",
      });

      // Show success message and redirect after delay
      setTimeout(() => {
        toast.success(
          "Welcome to WasaaChat! Your account is now fully verified."
        );
        router.push("/chat");
      }, 2000);
    } catch (error) {
      console.error("ID verification error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "ID verification failed";
      toast.error(errorMessage);
      setVerificationStatus("failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Allow user to skip this step and go to chat (optional)
    if (
      confirm(
        "Are you sure you want to skip ID verification? Some features may be limited."
      )
    ) {
      router.push("/chat");
    }
  };

  if (!user || !accessToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your identity has been verified successfully. You will be
              redirected to the chat shortly.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex"
      style={{
        background: "linear-gradient(to top right, #CFE0F7, #FFFFFF)",
      }}
    >
      <div className="hidden rounded-lg lg:flex lg:w-1/2 relative overflow-hidden bg-[#2A8FEA]">
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

      {/* Phone mockup - positioned to extend outside */}
      <div className="hidden lg:block absolute bottom-0 left-[400px] z-30">
        <div className="relative">
          {/* Phone frame */}
          <img src="/wasaa-phone.svg" className="w-full h-auto" />
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/full-logo.png"
              alt="WasaaChat Logo"
              className="w-32 h-auto"
            />
          </div>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Identity
          </h1>
          <p className="text-gray-600">
            Please provide the following information to verify your identity
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identity Number *
              </label>
              <input
                type="text"
                name="identityNumber"
                value={formData.identityNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your ID number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Names (as on ID) *
              </label>
              <input
                type="text"
                name="fullNames"
                value={formData.fullNames}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full names as they appear on your ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mother's Name *
              </label>
              <input
                type="text"
                name="motherName"
                value={formData.motherName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your mother's full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>

            {/* Error status */}
            {verificationStatus === "failed" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 text-center">
                  Verification failed. Please check your information and try
                  again.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isSubmitting || isLoading
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-[#2A8FEA] text-white hover:bg-blue-600 hover:shadow-lg transform hover:scale-105"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Spinner />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Verify Identity</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Skip Option */}
          <div className="mt-4 text-center">
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Secure Verification
              </h3>
              <p className="text-sm text-blue-700">
                Your information is encrypted and used solely for identity
                verification. We comply with all data protection regulations.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/profile/complete")}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to profile
          </button>
        </div>
      </div>
    </div>
  );
};
