"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/providers/ThemeProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import toast from "react-hot-toast";

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export default function WasaaChatHomepage() {
  const [openIndex, setOpenIndex] = useState<number | null>(7);
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: "KE",
    name: "Kenya",
    flag: "🇰🇪",
    dialCode: "+254",
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { signIn, verifyOtp, userId, user } = useAuthStore();
  const { isDarkMode } = useTheme();
  const router = useRouter();

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

  useEffect(() => {
    const img = new Image();
    img.src = isDarkMode ? "/hero-dark.svg" : "/hero.svg";
    img.onload = () => setBgLoaded(true);
  }, [isDarkMode]);

  // Auto-focus first OTP input when OTP is sent
  useEffect(() => {
    if (otpSent && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [otpSent]);

  const handleSubmit = async () => {
    const fullPhoneNumber = `${selectedCountry.dialCode}${phoneNumber}`;
    setLoading(true);
    try {
      await signIn({
        phoneNumber: fullPhoneNumber,
        countryCode: selectedCountry.dialCode,
        country: selectedCountry.name,
        fcmToken: "sample_fcm_token",
      });
      setOtpSent(true);
      setLoading(false);
      toast.success("OTP sent successfully!");
    } catch (err) {
      console.error("Failed to send OTP", err);
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const otpArray = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      otpArray.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + otpArray.length, 5);
      if (otpRefs.current[nextIndex]) {
        otpRefs.current[nextIndex]?.focus();
      }
    } else {
      // Single digit input
      if (!/^\d*$/.test(value)) return;
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5 && otpRefs.current[index + 1]) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpClear = () => {
    setOtp(["", "", "", "", "", ""]);
    if (otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  };

  const handleOtpSubmit = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    if (!userId) {
      toast.error("User ID not found. Please try signing in again.");
      setOtpSent(false);
      return;
    }

    setLoading(true);
    try {
      const nextStep = await verifyOtp({
        userId,
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
    } finally {
      setLoading(false);
    }
  };

  const testimonials = [
    {
      name: "Dan",
      role: "Graphic designer",
      location: "Nairobi",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
      rating: 5.0,
      text: "I used to juggle payments and DMs. Now I get orders, chat with customers, and get paid in one app.",
      tilt: -4,
    },
    {
      name: "Grace",
      role: "Online Seller",
      location: "Nakuru",
      image:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=64&h=64&fit=crop&crop=face",
      rating: 5.0,
      text: "I replaced WhatsApp, M-Pesa, and Instagram with WasaaChat—and now I earn KES 5,000 a week from group chats.",
      tilt: 0,
      isCenter: true,
    },
    {
      name: "James",
      role: "Community leader",
      location: "Mombasa",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
      rating: 5.0,
      text: "My youth group was all over WhatsApp and email. WasaaChat keeps us organized and engaged in one place.",
      tilt: 4,
    },
    {
      name: "Amina",
      role: "Small business owner",
      location: "Dar es Salaam",
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=64&h=64&fit=crop&crop=face",
      rating: 5.0,
      text: "WasaaChat helped me connect with customers across East Africa. My sales have doubled since I started using it.",
      tilt: -4,
    },
    {
      name: "Kwame",
      role: "Content creator",
      location: "Accra",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&fit=crop&crop=face",
      rating: 5.0,
      text: "The content sharing features are amazing. I can monetize my posts while building a real community.",
      tilt: 0,
      isCenter: true,
    },
    {
      name: "Fatima",
      role: "Entrepreneur",
      location: "Lagos",
      image:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=64&h=64&fit=crop&crop=face",
      rating: 5.0,
      text: "From idea to income in weeks. WasaaChat's business tools made it possible to scale my startup quickly.",
      tilt: 4,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex + 3 >= testimonials.length ? 0 : prevIndex + 3
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex - 3 < 0 ? Math.max(0, testimonials.length - 3) : prevIndex - 3
    );
  };

  const currentTestimonials = testimonials.slice(
    currentIndex,
    currentIndex + 3
  );

  const faqs = [
    {
      question: "How do I get started?",
      answer:
        "Simply download the WasaaChat app from the App Store or Google Play, create your profile with your phone number, and start connecting with other Africans. You can immediately begin chatting, sharing content, and exploring earning opportunities.",
    },
    {
      question: "Is WasaaChat free?",
      answer:
        "Yes! WasaaChat is completely free to download and use. You can chat, share content, and access basic features at no cost. Premium features and business tools may have optional paid upgrades.",
    },
    {
      question: "Typical timelines?",
      answer:
        "Account setup takes just 2-3 minutes. Building your network and starting to earn can begin immediately, with most users seeing their first earnings within their first week of active participation.",
    },
    {
      question: "How is WasaaChat different from WhatsApp?",
      answer:
        "WasaaChat is built specifically for Africa with features like integrated earning opportunities, local business tools, community building features, and content that resonates with African culture and lifestyle. It's not just messaging - it's a platform to grow your hustle.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Absolutely. We use end-to-end encryption for all messages and follow strict data protection standards. Your personal information is never shared without your consent, and we comply with international privacy regulations.",
    },
    {
      question: "Do I need tech skills?",
      answer:
        "Nope! Set up your profile, shop, or ads in minutes with simple, guided steps. WasaaChat is designed to be intuitive for users of all technical backgrounds.",
    },
  ];

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)]">
      <div
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: isDarkMode
            ? bgLoaded
              ? "url('/hero-dark.svg')"
              : "none"
            : bgLoaded
            ? "url('/hero.svg')"
            : "none",
        }}
      >
        <div className="absolute inset-0 bg-white/10"></div>
        <Header />
        {!bgLoaded && (
          <div className="absolute inset-0 z-50 flex items-center justify-center h-full">
            <div className="flex flex-col items-center">
              <Loader className="w-8 h-8 text-[#2A8FEA] animate-spin" />
            </div>
          </div>
        )}

        <section className="relative z-10 flex flex-col md:flex-row items-center justify-between px-10 md:px-50 pt-40 pb-20 overflow-hidden">
          <div className="w-full md:w-1/2">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-4">
              Chat. Share. Earn. <br /> One App for Africa.
            </h1>
            <p className="mb-6 text-lg">
              Grow your tribe. Boost your hustle. Only on WasaaChat, built for
              your vibe.
            </p>

            {/* Only show input fields if user is not logged in */}
            {!user && (
              <>
                {!otpSent ? (
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex items-center border border-gray-300 rounded-full px-4 py-2 w-full md:w-1/2">
                      <span className="mr-2">{selectedCountry.flag}</span>
                      <select
                        className="bg-transparent text-sm w-full focus:outline-none text-[var(--foreground)]"
                        value={selectedCountry.code}
                        onChange={(e) =>
                          setSelectedCountry(
                            countries.find((c) => c.code === e.target.value) ||
                              countries[0]
                          )
                        }
                      >
                        {countries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center border border-gray-300 rounded-full px-4 py-2 w-full md:w-1/2">
                      <span className="mr-2 text-[var(--foreground)]">
                        {selectedCountry.dialCode}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        placeholder="Your Phone number"
                        className="bg-transparent w-full text-sm focus:outline-none text-[var(--foreground)]"
                        value={phoneNumber}
                        onChange={(e) =>
                          setPhoneNumber(e.target.value.replace(/\D/g, ""))
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 mb-4">
                    <div className="flex justify-center space-x-3">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleOtpKeyDown(e, index)}
                          className="w-12 h-12 text-center text-[var(--foreground)] text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-[#2A8FEA] focus:outline-none transition-colors"
                          disabled={loading}
                        />
                      ))}
                    </div>
                    <div className="flex">
                      <button
                        onClick={handleOtpSubmit}
                        disabled={loading || otp.join("").length !== 6}
                        className={`bg-[#2A8FEA] text-white px-6 py-2 rounded-full cursor-pointer text-sm hover:bg-blue-700 flex items-center justify-center gap-2 w-full ${
                          loading || otp.join("").length !== 6
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {loading ? "Verifying OTP..." : "Submit OTP"}
                      </button>
                    </div>
                  </div>
                )}
                {!otpSent && phoneNumber.length === 9 && (
                  <div className="transition-opacity duration-300 ease-in-out opacity-100 animate-fade-in">
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-[#2A8FEA] w-full cursor-pointer text-white px-6 py-2 rounded-full text-sm hover:bg-[#2A8FEA] mb-4 flex items-center justify-center gap-2"
                    >
                      {loading ? "Sending OTP..." : "Get OTP"}
                    </button>
                  </div>
                )}
                <label className="flex items-center text-sm mb-6">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                  />
                  Keep me signed in
                </label>
              </>
            )}

            <p className="text-sm mb-6">
              Join <span className="font-semibold">50,000+</span> Africans
              already earning and connecting.
            </p>
            <div className="flex space-x-4">
              <button className="bg-white text-black px-5 py-2 rounded-full border border-black flex items-center space-x-2">
                <img className="w-4 h-4" src="/apple-1.svg" alt="Apple icon" />
                <span className="text-xs">App Store</span>
              </button>
              <button className="bg-white text-black px-5 py-2 rounded-full border border-black flex items-center space-x-2">
                <img
                  className="w-4 h-4"
                  src="/android-1.svg"
                  alt="Google icon"
                />
                <span className="text-xs">Google Play</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="bg-[var(--background)] text-center px-6 py-20">
        <h2 className="text-3xl md:text-6xl font-semibold mb-4">
          Why WasaaChat Fits <br /> Your Life
        </h2>
        <p className="text-lg mb-12 max-w-xl mx-auto">
          WasaaChat brings your chats, payments, and <br /> hustle into one app,
          no juggling, just results.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="flex gap-4 items-start bg-teal-100 hover:bg-gray-100 cursor-pointer p-6 rounded-xl text-left">
            <img
              src="/01.svg"
              alt="Chat avatar of woman"
              className="rounded-full w-10"
            />
            <div>
              <h3 className="text-lg text-gray-700 font-semibold mb-2">
                Earn from Chats
              </h3>
              <p className="text-sm text-gray-700">
                Sell your beadwork, collect tips from fans, or get paid
                instantly in any conversation.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start bg-blue-100 hover:bg-gray-100 cursor-pointer p-6 rounded-xl text-left">
            <img
              src="/02.svg"
              alt="Chat avatar of woman"
              className="rounded-full w-10"
            />
            <div>
              <h3 className="text-lg text-gray-700 font-semibold mb-2">
                Amplify Your Voice
              </h3>
              <p className="text-sm text-gray-700">
                Share posts, promote your music or crafts, and connect with
                engaged audiences.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start bg-yellow-100 hover:bg-gray-100 cursor-pointer p-6 rounded-xl text-left">
            <img
              src="/03.svg"
              alt="Chat avatar of woman"
              className="rounded-full w-10"
            />
            <div>
              <h3 className="text-lg text-gray-700 font-semibold mb-2">
                Unite Your Network
              </h3>
              <p className="text-sm text-gray-700">
                Chat 1-on-1 in chama groups, or for business—all in one place.{" "}
                <br />
                <a href="#" className="">
                  [See How It Works]
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col md:flex-row justify-between items-center px-6 md:px-50 py-20 bg-[var(--background)]">
        <div className="w-full md:w-1/2 mb-10 md:mb-0">
          <h2 className="text-3xl md:text-6xl font-semibold mb-4">
            What You Can Do <br /> with WasaaChat
          </h2>
          <p className="text-lg mb-6 max-w-md">
            One app, endless possibilities. Here’s how WasaaChat powers your
            day:
          </p>
          <button className="bg-[#CBE7FF] text-[#2A8FEA] px-6 py-2 rounded-full text-sm hover:bg-blue-600">
            Start Earning Today
          </button>
        </div>
        <div className="w-full md:w-1/2 space-y-6">
          <div className="flex items-start space-x-4">
            <img src="/04.svg" alt="Connect icon" className="w-12 h-12" />
            <div>
              <h3 className="font-semibold">Connect Seamlessly</h3>
              <p className="text-sm">
                Chat 1-on-1, in groups, or via voice/video calls. Share photos,
                files, or market updates with ease.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <img src="/05.svg" alt="Earn icon" className="w-12 h-12" />
            <div>
              <h3 className="font-semibold">Earn Effortlessly</h3>
              <p className="text-sm">
                Send or receive cash in chats. Set up your shop in under 5
                minutes to sell anything from clothes to digital art.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <img src="/07.svg" alt="Growth icon" className="w-12 h-12" />
            <div>
              <h3 className="font-semibold">Grow Your Reach</h3>
              <p className="text-sm">
                Post to your feed, boost content to reach 3X more viewers, or
                run targeted ads for your business.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <img src="/08.svg" alt="Community icon" className="w-12 h-12" />
            <div>
              <h3 className="font-semibold">Build Your Community:</h3>
              <p className="text-sm">
                Host chama meetings, lead discussions, or schedule events — all
                from one app.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--bacground)] py-20 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Real Stories, Real Results
        </h2>
        <p className="text-lg mb-12">
          Hear from Africans like you who've made WasaaChat their go-to app:
        </p>

        <div className="flex flex-col md:flex-row gap-8 mt-8 justify-center items-stretch max-w-6xl mx-auto">
          {currentTestimonials.map((testimonial, index) => {
            const isCenter = testimonial.isCenter;
            const isLeft = index === 0;
            const isRight = index === 2;

            return (
              <div
                key={`${testimonial.name}-${currentIndex}-${index}`}
                className={`px-8 py-10 rounded-3xl shadow-lg transform transition-transform duration-300 w-full md:w-[320px] h-[400px] flex flex-col justify-between ${
                  isCenter
                    ? "translate-y-[-20px] hover:scale-105"
                    : isLeft
                    ? "md:-rotate-[4deg] md:hover:-rotate-[2deg]"
                    : isRight
                    ? "md:rotate-[4deg] md:hover:rotate-[2deg]"
                    : ""
                }`}
              >
                <div>
                  <img
                    src={testimonial.image}
                    alt={`${testimonial.name} profile image`}
                    className="mx-auto mb-4 rounded-full w-16 h-16 object-cover"
                  />
                  <h4 className="font-semibold mb-1">-{testimonial.name}</h4>
                  <p className="text-sm mb-2">
                    {testimonial.role}
                    <br />
                    {testimonial.location}
                  </p>
                  <div className="text-yellow-500 text-sm mb-2">
                    ★★★★★ {testimonial.rating}
                  </div>
                </div>
                <p className="text-sm">"{testimonial.text}"</p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center items-center mt-10 space-x-6">
          <button
            onClick={prevSlide}
            className="border border-gray-300 w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
            disabled={currentIndex === 0}
          >
            <span>←</span>
          </button>
          <div className="flex space-x-2">
            {Array.from({ length: Math.ceil(testimonials.length / 3) }).map(
              (_, index) => (
                <div
                  key={index}
                  className={`w-1 h-1 rounded-full ${
                    Math.floor(currentIndex / 3) === index
                      ? "bg-[#2A8FEA]"
                      : "bg-gray-300"
                  }`}
                />
              )
            )}
          </div>
          <button
            onClick={nextSlide}
            className="border border-gray-300 w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
            disabled={currentIndex + 3 >= testimonials.length}
          >
            <span>→</span>
          </button>
        </div>
      </section>

      <section className="bg-[#002649] text-white px-6 py-20 md:px-20 rounded-[32px] mx-4 md:mx-20 mt-10 flex flex-col md:flex-row items-center">
        <div className="w-full md:w-1/2">
          <h2 className="text-2xl font-bold mb-4">Our Story</h2>
          <p className="mb-6 text-sm leading-relaxed">
            We built WasaaChat because Africa deserves better than juggling apps
            to talk, sell, or connect. Our team of Kenyan entrepreneurs and
            developers has created tools for millions across Africa. Our
            mission? Deliver one powerful app for your chats, payments, and
            communities.
          </p>
          <p className="italic text-sm mb-6">
            —designed for how we live and hustle.
          </p>
          <button className="bg-[#2A8FEA] text-white px-6 py-2 cursor-pointer rounded-full text-xs font-semibold hover:bg-[#2A8FEA]">
            Get Started
          </button>
        </div>
        <div className="w-full md:w-1/2 mt-10 md:mt-0 md:pl-10">
          <img
            src="/our-story.svg"
            alt="Smiling African woman in yellow shirt using her phone at a cozy desk"
            className="rounded-xl w-full max-w-md mx-auto"
          />
        </div>
      </section>

      <section className="flex flex-col md:flex-row gap-6 px-10 md:px-40 py-20 bg-[var(--background)]">
        <div className="md:w-1/3 flex flex-col md:flex-row justify-between mb-10">
          <div className="mb-6 md:mb-0">
            <span className="text-xs border border-gray-400 px-2 py-1 rounded-full mb-2 inline-block">
              FAQs
            </span>
            <h2 className="text-3xl font-bold">
              Frequently Asked <br />{" "}
              <span className="text-[#2A8FEA]">Questions</span>
            </h2>
            <p className="mt-2">Got questions? We’ve got answers.</p>
          </div>
        </div>
        <div className="space-y-4 md:w-2/3">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-300 pb-4">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left flex justify-between items-center text-sm md:text-base font-medium hover:text-[#2A8FEA] cursor-pointer"
              >
                {faq.question}
                <span className="text-xl">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              {openIndex === index && faq.answer && (
                <p className="text-sm text-[#2A8FEA] mt-2">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col md:flex-row justify-between items-center px-6 md:px-32 py-14 ">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-semibold mb-6">
            Start Chatting, Earning,
            <br />
            and Growing Today
          </h1>
          <p className="text-lg mb-6">
            Join 50,000+ Africans using WasaaChat to connect smarter, sell
            faster, and build stronger communities.
          </p>
          <div className="flex space-x-4">
            <button className="bg-white text-black px-5 py-2 rounded-full border border-black hover:cursor-pointer flex items-center space-x-2">
              <img className="w-4 h-4" src="/apple-1.svg" alt="Apple icon" />
              <span className="text-xs">App Store</span>
            </button>
            <button className="bg-white text-black px-5 py-2 rounded-full border border-black hover:cursor-pointer flex items-center space-x-2">
              <img className="w-4 h-4" src="/android-1.svg" alt="Google icon" />
              <span className="text-xs">Google Play</span>
            </button>
          </div>
        </div>
        <div className="mt-10 md:mt-0">
          <img
            src={isDarkMode ? "/wasaa-new-logo.svg" : "/wasaa-new-logo.svg"}
            alt="Mobile phone displaying WasaaChat app logo on a white topographic background"
            className="w-60 md:w-90"
          />
        </div>
      </section>

      <section className="px-6 md:px-24 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          We're Here for You
        </h2>
        <p className="text-center mb-12">
          Stuck, curious, or have an idea? We're ready to help with real people,
          not bots.
        </p>
        <div className="flex flex-col md:flex-row justify-between gap-12">
          <div className="flex flex-col space-y-8">
            <div className="flex items-start space-x-4">
              <div className="text-blue-500 text-xl">
                <img className="w-12 h-12" src="/11.svg" alt="Support icon" />
              </div>
              <div>
                <p className="font-semibold">Chat with Support:</p>
                <p>Message us in-app or email </p>
                <a
                  href="mailto:support@wasaachat.com"
                  className="text-[#2A8FEA]"
                >
                  support@wasaachat.com
                </a>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="text-xl">
                <img className="w-12 h-12" src="/12.svg" alt="Support icon" />
              </div>
              <div>
                <p className="font-semibold">Visit the Help Center</p>
                <p>Find step-by-step guides and answers at </p>
                <a href="#" className="text-[#2A8FEA]">
                  Go to Help Center
                </a>
                .
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="text-[#2A8FEA] text-xl">
                <img
                  className="w-12 h-12"
                  src="/bug-1.svg"
                  alt="Support icon"
                />
              </div>
              <div>
                <p className="font-semibold">Found a Bug? Got an Idea?</p>
                <p>
                  Share feedback at{" "}
                  <a href="#" className="text-[#2A8FEA]">
                    Report an Issue
                  </a>{" "}
                  or
                </p>
                <a href="#" className="text-[#2A8FEA]">
                  Suggest a Feature
                </a>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl shadow-md p-8 w-full md:w-1/2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                className="border border-gray-200 rounded-full px-4 py-3 w-full text-[var(--foreground)] bg-[var(--background)]"
                type="text"
                placeholder="Enter your first name"
              />
              <input
                className="border border-gray-200 rounded-full px-4 py-3 w-full text-[var(--foreground)] bg-[var(--background)]"
                type="text"
                placeholder="Last name"
              />
            </div>
            <div className="mb-4">
              <input
                className="border border-gray-200 rounded-full px-4 py-3 w-full text-[var(--foreground)] bg-[var(--background)]"
                type="email"
                placeholder="Enter email address"
              />
            </div>
            <div className="mb-6">
              <input
                className="border border-gray-200 rounded-full px-4 py-3 w-full text-[var(--foreground)] bg-[var(--background)]"
                type="tel"
                placeholder="+254"
              />
            </div>
            <button className="w-full bg-[#2A8FEA] hover:bg-[#2A8FEA] text-white font-semibold py-3 px-6 rounded-full">
              Submit
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
