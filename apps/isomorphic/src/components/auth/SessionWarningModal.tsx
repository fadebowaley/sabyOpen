"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Text } from "rizzui";
import { useSession } from "next-auth/react";
import { sessionManager } from "@/lib/services/session.service";
import sessionConfig from "@/config/session.config.json";

export function SessionWarningModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(
    sessionConfig.sessionTimeout.warningTime
  );
  const { data: session } = useSession();

  useEffect(() => {
    if (!session || !sessionConfig.sessionTimeout.enabled) return;

    const warningCallback = () => {
      setIsOpen(true);
      setCountdown(sessionConfig.sessionTimeout.warningTime);
    };

    sessionManager.startSessionMonitoring(warningCallback);

    return () => {
      sessionManager.stopSessionMonitoring();
    };
  }, [session]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          sessionManager.forceLogout("Session expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleContinue = () => {
    sessionManager.updateActivity();
    setIsOpen(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleContinue}>
      <div className="m-auto px-7 pt-6 pb-8">
        <div className="mb-7 flex items-center justify-center">
          <div className="text-4xl">⏰</div>
        </div>
        <div className="mb-4 text-center">
          <Text className="text-lg font-semibold mb-2">
            Session Expiring Soon
          </Text>
          <Text className="text-gray-600">
            Your session will expire in{" "}
            <span className="font-semibold text-red-600">
              {formatTime(countdown)}
            </span>{" "}
            due to inactivity.
          </Text>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleContinue} className="flex-1" color="primary">
            Continue Session
          </Button>
          <Button
            onClick={() => sessionManager.forceLogout("User logged out")}
            className="flex-1"
            variant="outline">
            Logout
          </Button>
        </div>
      </div>
    </Modal>
  );
}


