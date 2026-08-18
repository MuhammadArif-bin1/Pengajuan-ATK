"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Math Captcha State
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const fetchCaptcha = async () => {
    try {
      setLoadingCaptcha(true);
      const res = await fetch("/api/auth/captcha?t=" + Date.now());
      if (res.ok) {
        const data = await res.json();
        setCaptchaQuestion(data.question);
        setCaptchaToken(data.token);
        setCaptchaAnswer("");
      }
    } catch (err) {
      console.error("Gagal memuat captcha:", err);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!captchaAnswer.trim()) {
      setError("Silakan jawab perhitungan matematika pada captcha keamanan.");
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
          captchaToken,
          captchaAnswer: captchaAnswer.trim(),
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
        // Refresh captcha on any error
        fetchCaptcha();
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
      className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative font-sans bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/Image/profil/gambar%20background%20hasamitra.png')",
      }}
    >
      {/* Dark & Subtle Backdrop Blur Overlay */}
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white p-1.5 shadow-xl border border-white/40">
            <img
              src="/Image/logo/logo-bulat.png"
              alt="Logo Hasamitra"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
            Halaman Admin
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-200 font-medium drop-shadow-sm">
            Masuk untuk mengelola persetujuan, inventaris, dan laporan ATK
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-white/60">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-700 font-medium flex items-start gap-2.5 animate-in fade-in duration-150">
              <svg
                className="w-5 h-5 text-rose-500 shrink-0 mt-0.5"
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/25 focus:border-[#FF5500] hover:border-slate-400 text-xs sm:text-sm font-medium transition"
              />
            </div>

            {/* ─── MATH CAPTCHA SECURITY BOX ─── */}
            <div className="p-3.5 bg-orange-50/70 border border-orange-200/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-950">
                  <svg className="w-4 h-4 text-[#FF5500]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Keamanan Audit (Captcha Matematika)</span>
                </div>

                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={loadingCaptcha}
                  title="Ganti Soal Matematika"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF5500] hover:text-[#E04B00] hover:underline cursor-pointer disabled:opacity-50"
                >
                  <svg className={`w-3.5 h-3.5 ${loadingCaptcha ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Ganti Soal</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-white border border-orange-300 rounded-lg text-slate-900 font-extrabold text-sm tracking-wider select-none shrink-0 shadow-2xs">
                  {loadingCaptcha ? "..." : captchaQuestion || "12 + 8 = ?"}
                </div>

                <input
                  type="number"
                  required
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Hasil hitungan..."
                  className="w-full px-3.5 py-2 bg-white border border-orange-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/30 focus:border-[#FF5500] text-xs sm:text-sm font-semibold transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] active:scale-[0.99] text-white text-xs sm:text-sm font-bold transition shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
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
