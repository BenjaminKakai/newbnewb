"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { Camera, Upload, User, X } from "lucide-react";

const Spinner: React.FC = () => (
  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

interface FormData {
  username: string;
  pin: string;
  profile_picture: File | null;
}

interface FilePreview {
  profile_picture: string | null;
}

export const ProfileCompletePage: React.FC = () => {
  const router = useRouter();
  const { user, accessToken, updateUserProfile, isLoading } = useAuthStore();

  const [formData, setFormData] = useState<FormData>({
    username: user?.username || "",
    pin: "",
    profile_picture: null,
  });

  const [previews, setPreviews] = useState<FilePreview>({
    profile_picture: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const profilePictureRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: keyof FilePreview
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [fileType]: file,
    }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews((prev) => ({
        ...prev,
        [fileType]: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (fileType: keyof FilePreview) => {
    setFormData((prev) => ({
      ...prev,
      [fileType]: null,
    }));
    setPreviews((prev) => ({
      ...prev,
      [fileType]: null,
    }));

    // Clear file input
    if (fileType === "profile_picture" && profilePictureRef.current) {
      profilePictureRef.current.value = "";
    }
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      toast.error("Username is required");
      return false;
    }
    if (!formData.pin.trim()) {
      toast.error("PIN is required");
      return false;
    }
    if (formData.pin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return false;
    }
    if (!/^\d+$/.test(formData.pin)) {
      toast.error("PIN must contain only numbers");
      return false;
    }
    if (!formData.profile_picture) {
      toast.error("Profile picture is required");
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
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("username", formData.username);
      formDataToSend.append("pin", formData.pin);

      if (formData.profile_picture) {
        formDataToSend.append("profile_picture", formData.profile_picture);
      }

      const response = await fetch(
        `http://138.68.190.213:3010/users/${user.id}/complete-signup`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-api-key":
              process.env.NEXT_PUBLIC_API_KEY ||
              "QgR1v+o16jphR9AMSJ9Qf8SnOqmMd4HPziLZvMU1Mt0t7ocaT38q/8AsuOII2YxM60WaXQMkFIYv2bqo+pS/sw==",
          },
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Profile update failed");
      }

      toast.success(data.message || "Profile updated successfully!");

      // Update user in store
      await updateUserProfile({
        username: formData.username,
        // Add any other fields that should be updated in the store
      });

      // Redirect to next step or dashboard
      router.push("/chat"); // Update this to your desired route
    } catch (error) {
      console.error("Profile update error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Profile update failed";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadButton: React.FC<{
    title: string;
    description: string;
    fileType: keyof FilePreview;
    inputRef: React.RefObject<HTMLInputElement>;
    icon: React.ReactNode;
  }> = ({ title, description, fileType, inputRef, icon }) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, fileType)}
        className="hidden"
      />

      {previews[fileType] ? (
        <div className="relative">
          <img
            src={previews[fileType]!}
            alt={title}
            className="w-full h-40 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={() => removeFile(fileType)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X size={16} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600"
          >
            <Camera size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full text-center"
        >
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              {icon}
            </div>
            <h3 className="font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </button>
      )}
    </div>
  );

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

      {/* Right Section - Fixed height with scroll */}
      <div className="w-full lg:w-1/2 h-screen flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 text-center py-6 px-6">
          <div className="flex justify-center mb-3">
            <img
              src="/full-logo.png"
              alt="WasaaChat Logo"
              className="w-28 h-auto"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 text-sm">
            Please provide your username, PIN, and upload a profile picture
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Form */}
          <div className="bg-white rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Profile Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter username"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PIN *
                    </label>
                    <input
                      type="password"
                      name="pin"
                      value={formData.pin}
                      onChange={handleInputChange}
                      className="w-full px-3 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your PIN"
                      maxLength={6}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a secure PIN (minimum 4 digits)
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Picture Upload */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Profile Picture
                </h2>

                <FileUploadButton
                  title="Profile Picture"
                  description="Upload a clear photo of yourself"
                  fileType="profile_picture"
                  inputRef={profilePictureRef}
                  icon={<User className="w-6 h-6 text-gray-400" />}
                />
              </div>

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
                      <span>Updating Profile...</span>
                    </>
                  ) : (
                    <span>Complete Profile</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
