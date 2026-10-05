const TRUSTED_DEVICE_KEY = 'saby:trusted-device-id';
const TRUSTED_DEVICE_COOKIE = 'saby_trusted_device_id';

const createDeviceId = () => {
  const randomId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `saby-device-${randomId}`;
};

const readCookieDeviceId = () => {
  if (typeof document === 'undefined') return '';
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${TRUSTED_DEVICE_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : '';
};

const writeCookieDeviceId = (deviceId: string) => {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${TRUSTED_DEVICE_COOKIE}=${encodeURIComponent(
    deviceId
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

export const getTrustedDeviceId = () => {
  if (typeof window === 'undefined') return '';
  const stored = window.localStorage.getItem(TRUSTED_DEVICE_KEY) || readCookieDeviceId();
  const deviceId = stored || createDeviceId();
  window.localStorage.setItem(TRUSTED_DEVICE_KEY, deviceId);
  writeCookieDeviceId(deviceId);
  return deviceId;
};
