export const isTelegramWebApp = (): boolean => {
  return Boolean(window.Telegram?.WebApp?.initData);
};

export interface DeviceInfo {
  manufacturer: string;
  model: string;
  androidVersion: string;
  sdkVersion: string;
  performanceClass: 'LOW' | 'AVERAGE' | 'HIGH';
  appVersion: string;
}

export function getDeviceInfo(): DeviceInfo | null {
  const userAgent = navigator.userAgent;
  const tgMatch = userAgent.match(/Telegram-Android\/(\d+\.\d+\.\d+) \((.+) (.+); Android (.+); SDK (.+); (LOW|AVERAGE|HIGH)\)/);
  
  if (!tgMatch) return null;
  
  return {
    appVersion: tgMatch[1],
    manufacturer: tgMatch[2],
    model: tgMatch[3],
    androidVersion: tgMatch[4],
    sdkVersion: tgMatch[5],
    performanceClass: tgMatch[6] as 'LOW' | 'AVERAGE' | 'HIGH'
  };
}

export function shouldReduceAnimations(): boolean {
  const deviceInfo = getDeviceInfo();
  return deviceInfo?.performanceClass === 'LOW';
}

export const isCloudStorageAvailable = (): boolean => {
  return Boolean(window.Telegram?.WebApp?.CloudStorage);
};

export const isDesktop = (): boolean => {
  const isDesktopBrowser = !isTelegramWebApp();
  return isDesktopBrowser;
};

export const isAdmin = (): boolean => {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const adminIds = ['5810535171', '283397879', 'admin'];
  
  return isDesktop() || Boolean(
    tgUser?.username === '@SNS'
  );
};