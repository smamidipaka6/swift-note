"use client";

import React, { useState, useEffect, useRef } from "react";
import KeyboardShortcuts from "./KeyboardShortcuts";

import { CircleHelp } from "lucide-react";

// Define interface for NavigatorUAData
interface NavigatorUAData {
  brands: Array<{ brand: string; version: string }>;
  mobile: boolean;
  platform: string;
}

// Extend the Navigator interface to include userAgentData
interface NavigatorUA extends Navigator {
  userAgentData?: NavigatorUAData;
}

const HelpPopup = () => {
  const [isMac, setIsMac] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const detectMacOS = () => {
      // Modern method using userAgentData if available
      if ("userAgentData" in navigator) {
        const nav = navigator as NavigatorUA;
        const platform = nav.userAgentData?.platform;
        return platform === "macOS" || platform === "MacIntel";
      }

      // Fallback to user agent string
      const ua = navigator.userAgent.toLowerCase();
      return (
        ua.includes("mac") ||
        ua.includes("macintosh") ||
        ua.includes("macintel")
      );
    };

    setIsMac(detectMacOS());
  }, []);

  // Set up event listener to handle clicks outside the modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showKeyboardShortcuts &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowKeyboardShortcuts(false);
      }
    }

    // Add event listener when the modal is shown
    if (showKeyboardShortcuts) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showKeyboardShortcuts]);

  const toggleKeyboardShortcuts = () => {
    setShowKeyboardShortcuts(!showKeyboardShortcuts);
  };

  return (
    <>
      <button
        onClick={toggleKeyboardShortcuts}
        className="flex px-2 items-center justify-center rounded-md border border-border hover:bg-secondary transition-colors"
      >
        <CircleHelp className="w-6 h-6" />
      </button>

      {showKeyboardShortcuts && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div ref={modalRef}>
            <KeyboardShortcuts
              isMac={isMac}
              onClose={() => setShowKeyboardShortcuts(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default HelpPopup;
