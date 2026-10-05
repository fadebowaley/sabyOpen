declare module 'papaparse';

declare global {
  interface GrecaptchaV3 {
    ready(callback: () => void): void;
    execute(
      siteKey: string,
      options: {
        action: string;
      }
    ): Promise<string>;
  }

  interface Window {
    grecaptcha?: GrecaptchaV3;
  }
}

export {};
