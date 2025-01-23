/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp?: {
      ready: boolean;
      expand: () => void;
      close: () => void;
      requestFullscreen?: () => void;
      exitFullscreen?: () => void;
      isFullscreen?: boolean;
      disableVerticalSwipes?: () => void;
      enableVerticalSwipes?: () => void;
      setBottomBarColor?: (color: string) => void;
      platform: 'android' | 'ios' | 'web' | 'unknown';
      themeParams: {
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        bottom_bar_bg_color?: string;
        header_bg_color?: string;
        bg_color?: string;
      };
      CloudStorage?: {
        setItem: (key: string, value: string) => Promise<void>;
        getItem: (key: string) => Promise<string | null>;
        removeItem: (key: string) => Promise<void>;
        getKeys: () => Promise<string[]>;
      };
      setViewportSettings: (settings: {
        rotate_supported?: boolean;
        can_minimize?: boolean;
        is_expanded?: boolean;
      }) => void;
      setPopupParams: (params: {
        title_color?: string;
        background_color?: string;
      }) => void;
      enableClosingConfirmation: () => void;
      disableClosingConfirmation: () => void;
      version: string;
      initDataUnsafe: {
        user?: any;
        [key: string]: any;
      };
      MainButton: {
        show: () => void;
        hide: () => void;
        setParams: (params: { text?: string; color?: string; [key: string]: any }) => void;
        onClick: (callback: () => void) => void;
        offClick: (callback: () => void) => void;
      };
      BackButton: {
        show: () => void;
        hide: () => void;
        onClick: (callback: () => void) => void;
        offClick: (callback: () => void) => void;
      };
      HapticFeedback: {
        notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        selectionChanged: () => void;
        impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
      };
      showPopup: (params: {
        title?: string;
        message: string;
        buttons?: Array<{
          type?: 'ok' | 'close' | 'cancel' | 'default' | 'destructive';
          text?: string;
          id?: string;
        }>;
      }) => Promise<{ button_id: string }>;
      [key: string]: any;
    };
  };
}