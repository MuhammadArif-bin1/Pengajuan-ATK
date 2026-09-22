"use client";

import React from "react";
import type { RequestStatusType } from "@/types/request";

export interface BadgeProps {
  status?: RequestStatusType | "ACTIVE" | "INACTIVE" | "ADMIN" | "USER" | string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  size = "sm",
  children,
  className = "",
}) => {
  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm font-medium",
  };

  // Determine badge styling based on request status or variant
  let badgeClasses = "inline-flex items-center font-bold rounded-[6px] ";

  if (status === "DIPROSES" || status === "MENUNGGU") {
    badgeClasses += "bg-blue-50 text-blue-700 border border-blue-200/80";
  } else if (status === "SELESAI" || status === "DISETUJUI") {
    badgeClasses += "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
  } else if (status === "DITOLAK") {
    badgeClasses += "bg-rose-50 text-rose-700 border border-rose-200/80";
  } else if (status === "ACTIVE" || status === "Aktif") {
    badgeClasses += "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
  } else if (status === "INACTIVE" || status === "Nonaktif") {
    badgeClasses += "bg-slate-100 text-slate-600 border border-slate-200";
  } else if (status === "ADMIN") {
    badgeClasses += "bg-purple-50 text-purple-700 border border-purple-200/80";
  } else if (status === "USER") {
    badgeClasses += "bg-sky-50 text-sky-700 border border-sky-200/80";
  } else if (variant === "success") {
    badgeClasses += "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
  } else if (variant === "warning") {
    badgeClasses += "bg-amber-50 text-amber-700 border border-amber-200/80";
  } else if (variant === "danger") {
    badgeClasses += "bg-rose-50 text-rose-700 border border-rose-200/80";
  } else if (variant === "info") {
    badgeClasses += "bg-blue-50 text-blue-700 border border-blue-200/80";
  } else {
    badgeClasses += "bg-slate-100 text-slate-700 border border-slate-200";
  }

  // Label lookup
  const getStatusLabel = () => {
    switch (status) {
      case "DIPROSES":
      case "MENUNGGU":
        return "Diproses";
      case "SELESAI":
      case "DISETUJUI":
        return "Selesai";
      case "DITOLAK":
        return "Ditolak";
      case "ACTIVE":
        return "Aktif";
      case "INACTIVE":
        return "Nonaktif";
      case "ADMIN":
        return "Administrator";
      case "USER":
        return "Karyawan";
      default:
        return status;
    }
  };

  const dotColor = () => {
    switch (status) {
      case "DIPROSES":
      case "MENUNGGU":
        return "bg-blue-500";
      case "SELESAI":
      case "DISETUJUI":
        return "bg-emerald-500";
      case "DITOLAK":
        return "bg-rose-500";
      case "ACTIVE":
      case "Aktif":
        return "bg-emerald-500";
      case "INACTIVE":
      case "Nonaktif":
        return "bg-slate-400";
      default:
        return "bg-slate-400";
    }
  };

  return (
    <span className={`${badgeClasses} ${sizeStyles[size]} ${className}`}>
      {status && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${dotColor()}`}
        />
      )}
      {children || getStatusLabel()}
    </span>
  );
};
