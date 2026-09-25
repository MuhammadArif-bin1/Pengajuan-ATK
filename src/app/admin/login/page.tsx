"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReCaptcha, ReCaptchaRef } from "@/components/ui/ReCaptcha";

export default function AdminLoginPage() {
  const router = useRouter();
  const recaptchaRef = useRef<ReCaptchaRef>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Google reCAPTCHA Token State
  const [recaptchaToken, setRecaptchaToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!recaptchaToken) {
      setError("Silakan centang verifikasi 'Saya bukan robot' pada reCAPTCHA terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          recaptchaToken,
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Terjadi gangguan respons dari server (Status: " + res.status + ")");
      }

      if (!res.ok) {
        // Reset reCAPTCHA on error
        recaptchaRef.current?.reset();
        setRecaptchaToken("");
        throw new Error(data.error || "Gagal masuk ke sistem");
      }

      if (data.user?.role !== "ADMIN") {
        throw new Error("Akses ditolak: Akun ini bukan akun Administrator.");
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col justify-center items-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8 relative font-sans bg-cover bg-center sm:bg-[center_top] bg-no-repeat overflow-x-hidden"
      style={{
        backgroundImage: "url('/Image/profil/gambar%20background%20hasamitra.png')",
      }}
    >
      {/* Responsive & Subtle Backdrop Blur Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/50 to-slate-950/75 backdrop-blur-[2px]" />

      <div className="w-full max-w-md relative z-10 space-y-5 sm:space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-xl border border-white/40">
            <img
              src="/Image/logo/logo-bulat.png"
              alt="Logo HasamitraJabar"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <h1 className="mt-3 sm:mt-4 text-xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
            Halaman Admin ATK
          </h1>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md py-6 px-4 sm:py-8 sm:px-10 shadow-2xl rounded-2xl sm:rounded-3xl border border-white/60">
          {error && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-700 font-medium flex items-start gap-2.5 animate-in fade-in duration-150">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-3.5 sm:space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 sm:mb-1.5">
                Email Administrator
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/25 focus:border-[#FF5500] hover:border-slate-400 text-xs sm:text-sm font-medium transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 sm:mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/25 focus:border-[#FF5500] hover:border-slate-400 text-xs sm:text-sm font-medium transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer focus:outline-none transition"
                  title={showPassword ? "Sembunyikan Sandi" : "Lihat Sandi"}
                  aria-label={showPassword ? "Sembunyikan Sandi" : "Lihat Sandi"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ─── GOOGLE RECAPTCHA V2 (Checkbox) ─── */}
            <div className="flex justify-center py-1">
              <ReCaptcha
                ref={recaptchaRef}
                onVerify={(token) => {
                  setRecaptchaToken(token);
                  if (error) setError("");
                }}
                onExpire={() => {
                  setRecaptchaToken("");
                }}
                onError={() => {
                  setRecaptchaToken("");
                }}
              />
            </div>

            <div className="pt-1.5 sm:pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] active:scale-[0.99] text-white text-xs sm:text-sm font-bold transition shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <span>Masuk ke Halaman Admin</span>
                )}
              </button>
            </div>
          </form>

          {/* Link Back to Employee Portal */}
          <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="text-xs font-medium text-slate-500 hover:text-[#FF5500] transition inline-flex items-center justify-center gap-1.5"
            >
              <span>← Kembali ke Portal Pengajuan Karyawan</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
