"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

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

export const ReCaptcha = forwardRef<ReCaptchaRef, ReCaptchaProps>(
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
      const activeSiteKey =
        siteKey ||
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
        "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

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
              callback: (token: string) => {
                onVerify(token);
              },
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

ReCaptcha.displayName = "ReCaptcha";
