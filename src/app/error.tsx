"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log technical error details to console
    console.error("Unhandled client error caught by error boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[16px] border border-[#ebeef2] shadow-[0px_4px_20px_rgba(0,0,0,0.06)] p-6 sm:p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-[#323c4d] tracking-tight">
            Terjadi Kendala Sistem
          </h2>
          <p className="text-xs sm:text-sm text-[#606c80] leading-relaxed">
            Aplikasi mengalami kendala sementara saat merender halaman ini. Data Anda aman dan tidak terhapus.
          </p>
          {error?.digest && (
            <p className="text-[10px] text-slate-400 font-mono bg-slate-50 py-1 px-2 rounded-md inline-block mt-2">
              Kode Error: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#ff8f00] hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Coba Muat Ulang
          </button>

          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] border border-[#ebeef2] bg-white hover:bg-slate-50 text-[#323c4d] text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
