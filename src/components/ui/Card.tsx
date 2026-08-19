"use client";

import React from "react";

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  noPadding = false,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-150 ${className}`}
      {...props}
    >
      {(title || action || subtitle) && (
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900 leading-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
};

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  color?: "indigo" | "amber" | "emerald" | "rose" | "blue" | "purple" | "orange";
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  color = "indigo",
  onClick,
}) => {
  const colorStyles = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-[#FF5500] border-orange-100",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between transition-all duration-150 ${
        onClick ? "cursor-pointer hover:border-slate-300 hover:shadow-sm" : ""
      }`}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </p>
        {description && (
          <p className="text-xs text-slate-500">{description}</p>
        )}
      </div>
      {icon && (
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${colorStyles[color]}`}
        >
          {icon}
        </div>
      )}
    </div>
  );
};
