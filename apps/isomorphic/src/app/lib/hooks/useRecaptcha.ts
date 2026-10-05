'use client';

import { useEffect, useState } from 'react';

type RecaptchaExecuteResult = {
  token: string;
};

const RECAPTCHA_SCRIPT_BASE = 'https://www.google.com/recaptcha/api.js?render=';

const getCaptchaScriptSrc = (siteKey: string) =>
  `${RECAPTCHA_SCRIPT_BASE}${encodeURIComponent(siteKey)}`;

export function useRecaptcha() {
  const isAuthCaptchaEnabled =
    process.env.NEXT_PUBLIC_AUTH_USE_RECAPTCHA === 'true';
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() || '';
  const isEnabled = isAuthCaptchaEnabled && Boolean(siteKey);
  const [isReady, setIsReady] = useState(!isEnabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      setIsReady(true);
      setError(null);
      return;
    }

    let cancelled = false;
    const scriptSrc = getCaptchaScriptSrc(siteKey);
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);

    const markReady = () => {
      if (cancelled) return;
      setIsReady(true);
    };

    const readyCaptcha = () => {
      if (!window.grecaptcha) {
        setError('Google reCAPTCHA failed to initialize.');
        return;
      }
      window.grecaptcha.ready(markReady);
    };

    setIsReady(false);
    setError(null);

    if (existingScript) {
      if (window.grecaptcha) {
        readyCaptcha();
        return;
      }
      existingScript.addEventListener('load', readyCaptcha);
      existingScript.addEventListener('error', () => {
        if (cancelled) return;
        setError('Unable to load Google reCAPTCHA.');
      });

      return () => {
        cancelled = true;
        existingScript.removeEventListener('load', readyCaptcha);
      };
    }

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.defer = true;
    script.onload = readyCaptcha;
    script.onerror = () => {
      if (cancelled) return;
      setError('Unable to load Google reCAPTCHA.');
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.onload = null;
      script.onerror = null;
    };
  }, [isEnabled, siteKey]);

  const execute = async (action: string): Promise<RecaptchaExecuteResult> => {
    if (!isEnabled) {
      return { token: '' };
    }

    if (!window.grecaptcha) {
      throw new Error('Google reCAPTCHA is not ready.');
    }

    await new Promise<void>((resolve) => {
      window.grecaptcha?.ready(() => resolve());
    });

    const token = await window.grecaptcha.execute(siteKey, { action });
    if (!token) {
      throw new Error('Failed to verify Google reCAPTCHA.');
    }

    return { token };
  };

  return {
    isEnabled,
    isReady,
    error,
    execute,
  };
}
