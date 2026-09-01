"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";

export interface ReCaptchaRef {
  reset: () => void;
  getResponse: () => string;
}

interface ReCaptchaProps {
  siteKey?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

// Google's default test keys — these trigger the red warning banner
const GOOGLE_TEST_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

declare global {
  interface Window {
    grecaptcha?: {
      ready?: (cb: () => void) => void;
      render?: (
        container: HTMLElement | string,
        parameters: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark";
          size?: "normal" | "compact";
        }
      ) => number;
      reset?: (widgetId?: number) => void;
      getResponse?: (widgetId?: number) => string;
    };
    onRecaptchaLoaded?: () => void;
  }
}

// ─────────────────────────────────────────────────
// Built-in clean widget (no red text, no iframe)
// ─────────────────────────────────────────────────

type WidgetState = "idle" | "verifying" | "verified" | "expired";

const VERIFY_DELAY_MS = 1200;
const EXPIRE_AFTER_MS = 2 * 60 * 1000; // 2 minutes

function generateClientToken(): string {
  const ts = Date.now().toString(36);
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `captcha_${ts}_${rand}`;
}

const BuiltInWidget = forwardRef<
  ReCaptchaRef,
  Omit<ReCaptchaProps, "siteKey">
>(({ onVerify, onExpire, onError }, ref) => {
  const [state, setState] = useState<WidgetState>("idle");
  const tokenRef = useRef<string>("");
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      cleanup();
      setState("idle");
      tokenRef.current = "";
    },
    getResponse: () => tokenRef.current,
  }));

  const handleCheck = () => {
    if (state !== "idle") return;

    setState("verifying");

    setTimeout(() => {
      try {
        const token = generateClientToken();
        tokenRef.current = token;
        setState("verified");
        onVerify(token);

        expiryTimer.current = setTimeout(() => {
          setState("expired");
          tokenRef.current = "";
          if (onExpire) onExpire();
        }, EXPIRE_AFTER_MS);
      } catch {
        setState("idle");
        tokenRef.current = "";
        if (onError) onError();
      }
    }, VERIFY_DELAY_MS);
  };

  const handleRetry = () => {
    cleanup();
    setState("idle");
    tokenRef.current = "";
    handleCheck();
  };

  return (
    <div className="flex justify-center w-full my-0.5">
      <div
        className="flex items-center justify-between gap-3 bg-[#f9f9f9] border border-[#d3d3d3] rounded-[3px] px-3.5 py-2.5 select-none"
        style={{
          minWidth: 256,
          maxWidth: 304,
          width: "100%",
          boxShadow: "0 0 2px rgba(0,0,0,0.06)",
        }}
      >
        {/* Left side: checkbox + label */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={state === "expired" ? handleRetry : handleCheck}
            disabled={state === "verifying" || state === "verified"}
            aria-label="Saya bukan robot"
            className="relative flex items-center justify-center w-[28px] h-[28px] rounded-sm border-2 border-[#c1c1c1] bg-white cursor-pointer hover:border-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition disabled:cursor-default shrink-0"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {state === "idle" && <span />}

            {state === "verifying" && (
              <svg
                className="animate-spin w-5 h-5 text-blue-500"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}

            {state === "verified" && (
              <svg
                className="w-6 h-6 text-green-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}

            {state === "expired" && (
              <svg
                className="w-5 h-5 text-amber-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>

          <span className="text-[13.5px] text-[#555] font-normal leading-snug">
            {state === "expired" ? (
              <span className="text-amber-600 text-[12.5px]">
                Kedaluwarsa. Klik untuk verifikasi ulang.
              </span>
            ) : (
              "Saya bukan robot"
            )}
          </span>
        </div>

        {/* Right side: reCAPTCHA branding (original Google logo) */}
        <div className="flex flex-col items-center shrink-0">
          <img
            src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
            alt="reCAPTCHA"
            width={32}
            height={32}
            className="pointer-events-none"
            draggable={false}
          />
          <span
            className="text-[9px] text-[#555] font-medium"
            style={{ lineHeight: 1.2 }}
          >
            reCAPTCHA
          </span>
          <span
            className="text-[7px] text-[#999] mt-0.5"
            style={{ lineHeight: 1 }}
          >
            Privacy - Terms
          </span>
        </div>
      </div>
    </div>
  );
});

BuiltInWidget.displayName = "BuiltInCaptchaWidget";

// ─────────────────────────────────────────────────
// Google reCAPTCHA v2 (when real production key is set)
// ─────────────────────────────────────────────────

const GoogleWidget = forwardRef<ReCaptchaRef, ReCaptchaProps>(
  ({ siteKey, onVerify, onExpire, onError }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (
          typeof window !== "undefined" &&
          typeof window.grecaptcha?.reset === "function" &&
          widgetIdRef.current !== null
        ) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
          } catch (e) {
            console.error("Error resetting reCAPTCHA:", e);
          }
        }
      },
      getResponse: () => {
        if (
          typeof window !== "undefined" &&
          typeof window.grecaptcha?.getResponse === "function" &&
          widgetIdRef.current !== null
        ) {
          return window.grecaptcha.getResponse(widgetIdRef.current) || "";
        }
        return "";
      },
    }));

    useEffect(() => {
      const activeSiteKey = siteKey || "";

      const renderRecaptcha = () => {
        if (
          containerRef.current &&
          typeof window !== "undefined" &&
          typeof window.grecaptcha?.render === "function" &&
          widgetIdRef.current === null
        ) {
          try {
            containerRef.current.innerHTML = "";
            const id = window.grecaptcha.render(containerRef.current, {
              sitekey: activeSiteKey,
              callback: (token: string) => onVerify(token),
              "expired-callback": () => {
                if (onExpire) onExpire();
              },
              "error-callback": () => {
                if (onError) onError();
              },
              theme: "light",
            });
            widgetIdRef.current = id;
          } catch (err) {
            console.error("Failed to render reCAPTCHA:", err);
          }
        }
      };

      const scriptId = "google-recaptcha-script";
      const existingScript =
        typeof document !== "undefined"
          ? (document.getElementById(scriptId) as HTMLScriptElement | null)
          : null;

      if (!existingScript && typeof document !== "undefined") {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src =
          "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit&hl=id";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        window.onRecaptchaLoaded = () => {
          renderRecaptcha();
        };
      } else if (
        typeof window !== "undefined" &&
        typeof window.grecaptcha?.render === "function"
      ) {
        renderRecaptcha();
      } else if (typeof window !== "undefined") {
        const prevOnload = window.onRecaptchaLoaded;
        window.onRecaptchaLoaded = () => {
          if (typeof prevOnload === "function") prevOnload();
          renderRecaptcha();
        };
      }

      return () => {
        // cleanup widget on unmount
      };
    }, [siteKey, onVerify, onExpire, onError]);

    return (
      <div className="flex justify-center w-full my-0.5 overflow-hidden">
        <div
          ref={containerRef}
          className="min-h-[78px] flex items-center justify-center"
        />
      </div>
    );
  }
);

GoogleWidget.displayName = "GoogleRecaptchaWidget";

// ─────────────────────────────────────────────────
// Exported ReCaptcha component (auto-detects mode)
// ─────────────────────────────────────────────────

export const ReCaptcha = forwardRef<ReCaptchaRef, ReCaptchaProps>(
  (props, ref) => {
    const activeSiteKey =
      props.siteKey ||
      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
      GOOGLE_TEST_SITE_KEY;

    // Use the clean built-in widget when no real production key is configured
    const useBuiltIn =
      !activeSiteKey ||
      activeSiteKey === GOOGLE_TEST_SITE_KEY;

    if (useBuiltIn) {
      return <BuiltInWidget ref={ref} {...props} />;
    }

    return <GoogleWidget ref={ref} {...props} siteKey={activeSiteKey} />;
  }
);

ReCaptcha.displayName = "ReCaptcha";
