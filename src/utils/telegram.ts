export function initializeTelegramApp() {
  const tg = window.Telegram?.WebApp;
  
  if (!tg) {
    console.warn('Not running in Telegram WebApp environment');
    return;
  }

  try {
    // Calculate platform-specific insets
    const calculateInsets = (platform: string) => ({
      bottom: platform === 'android' ? 16 : 0,
      system: platform === 'android' ? 48 : 0
    });

    // Handle content safe areas with ResizeObserver
    const handleContentSafeArea = () => {
      if (tg.contentSafeArea) {
        const { top, right, bottom, left } = tg.contentSafeArea;
        const insets = calculateInsets(tg.platform);
        
        document.documentElement.style.setProperty('--content-safe-area-top', `${top}px`);
        document.documentElement.style.setProperty('--content-safe-area-right', `${right}px`);
        document.documentElement.style.setProperty('--content-safe-area-bottom', `${Math.max(bottom, insets.bottom)}px`);
        document.documentElement.style.setProperty('--content-safe-area-left', `${left}px`);
        document.documentElement.style.setProperty('--system-padding-bottom', `${insets.system}px`);
      }
    };

    // Initialize viewport observer
    const resizeObserver = new ResizeObserver(() => {
      const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        const height = `${window.innerHeight}px`;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        document.documentElement.style.setProperty('--tg-viewport-height', height);
        document.documentElement.style.setProperty('--tg-viewport-stable-height', height);
      };
      setViewportHeight();
    });

    resizeObserver.observe(document.documentElement);
    
    // Force app ready state
    if (!tg.ready) {
      tg.ready();
    }

    // Initialize app settings
    const initApp = () => {
      try {
        // Always force fullscreen and expanded state
        if (tg.requestFullscreen && !tg.isFullscreen) {
          tg.requestFullscreen();
        }
        if (tg.expand) {
          tg.expand();
        }

        // Configure viewport
        if (tg.setViewportSettings) {
          tg.setViewportSettings({
            rotate_supported: false,
            can_minimize: false,
            is_expanded: true
          });
        }

        // Force dark theme
        document.documentElement.classList.add('dark');

        // Configure theme colors
        const themeColors = {
          '--tg-theme-bg-color': '#0f172a',
          '--tg-theme-secondary-bg-color': 'rgba(15, 23, 42, 0.9)',
          '--tg-theme-text-color': '#ffffff',
          '--tg-theme-button-color': '#20a376',
          '--tg-theme-button-text-color': '#ffffff'
        };

        Object.entries(themeColors).forEach(([key, value]) => {
          document.documentElement.style.setProperty(key, value);
        });

        // Set header and bottom bar colors
        if (tg.setHeaderColor) tg.setHeaderColor('#0f172a');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#0f172a');
        if (tg.setBottomBarColor) tg.setBottomBarColor('#0f172a');

        // Disable app closing confirmation
        if (tg.disableClosingConfirmation) {
          tg.disableClosingConfirmation();
        }

        // Lock orientation on mobile
        if (tg.platform === 'android' || tg.platform === 'ios') {
          if (tg.lockOrientation) {
            tg.lockOrientation('portrait');
          }
        }

        // Add event listeners
        const events = {
          viewportChanged: () => {
            if (tg.viewportHeight) {
              document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
            }
            if (tg.viewportStableHeight) {
              document.documentElement.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight}px`);
            }
          },
          fullscreenChanged: () => {
            if (!tg.isFullscreen && tg.requestFullscreen) {
              tg.requestFullscreen();
              if (tg.expand) tg.expand();
            }
          },
          themeChanged: () => {
            if (tg.themeParams) {
              Object.entries(tg.themeParams).forEach(([key, value]) => {
                if (value && typeof value === 'string') {
                  document.documentElement.style.setProperty(
                    `--tg-theme-${key.replace(/_/g, '-')}`,
                    value
                  );
                }
              });
            }
          }
        };

        Object.entries(events).forEach(([event, handler]) => {
          tg.onEvent(event, handler);
        });

        // Initial setup
        handleContentSafeArea();
        events.viewportChanged();
        events.themeChanged();

        // Add haptic feedback
        if (tg.HapticFeedback) {
          tg.HapticFeedback.impactOccurred('medium');
        }

      } catch (error) {
        console.error('Error during WebApp initialization:', error);
      }
    };

    // Initialize when ready
    if (tg.ready) {
      initApp();
    } else {
      tg.onEvent('ready', initApp);
    }

  } catch (error) {
    console.error('Error initializing Telegram WebApp:', error);
  }

  // Cleanup on unmount
  return () => {
    try {
      const resizeObserver = new ResizeObserver(() => {});
      resizeObserver.disconnect();
    } catch (error) {
      console.error('Error cleaning up:', error);
    }
  };
}

export function hapticFeedback(style: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') {
  const tg = window.Telegram?.WebApp;
  if (!tg?.HapticFeedback) return;

  if (style === 'success' || style === 'error' || style === 'warning') {
    tg.HapticFeedback.notificationOccurred(style);
  } else {
    tg.HapticFeedback.impactOccurred(style);
  }
}