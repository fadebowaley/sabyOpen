"use client";

import React, { Component, ReactNode } from "react";
import { Button, Text } from "rizzui";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Auth Error Boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <Text className="text-2xl font-semibold mb-2">
              Authentication Error
            </Text>
            <Text className="text-gray-600 mb-6">
              {this.state.error?.message || "An authentication error occurred"}
            </Text>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/auth/sign-in";
              }}>
              Back to Login
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


