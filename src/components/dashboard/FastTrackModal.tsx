"use client";

import React, { useEffect } from "react";

export interface FastTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * FastTrackModal:
 * Langsung membuka akun Telegram Admin Logistik (https://t.me/DennyXIX) tanpa form permohonan.
 */
export const FastTrackModal: React.FC<FastTrackModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      window.open("https://t.me/DennyXIX", "_blank", "noopener,noreferrer");
      onClose();
    }
  }, [isOpen, onClose]);

  return null;
};

