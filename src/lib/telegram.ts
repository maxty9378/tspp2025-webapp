export function initializeTelegramApp() {
  const tg = window.Telegram?.WebApp;
  
  if (!tg) {
    console.warn('Not running in Telegram WebApp environment');
    return;
  }

  try {
    // Inform Telegram that the Mini App is ready
    if (!tg.ready) {
      tg.ready();
    }
    
    // Handle content safe areas (new in 8.0)
    const handleContentSafeArea = () => {
      if (tg.contentSafeArea) {
        const { top, right, bottom, left } = tg.contentSafeArea;
        document.documentElement.style.setProperty('--content-safe-area-top', `${top}px`);
        document.documentElement.style.setProperty('--content-safe-area-right', `${right}px`);
        document.documentElement.style.setProperty('--content-safe-area-bottom', `${bottom}px`);
        document.documentElement.style.setProperty('--content-safe-area-left', `${left}px`);
      }
    };
    
    handleContentSafeArea();
    tg.onEvent('contentSafeAreaChanged', handleContentSafeArea);

    // Force fullscreen and prevent closing
    if (tg.platform === 'android' || tg.platform === 'ios') {
      if (tg.requestFullscreen && !tg.isFullscreen) {
        tg.requestFullscreen();
      }

      if (tg.expand) {
        tg.expand();
      }

      // Disable closing confirmation
      if (tg.disableClosingConfirmation) {
        tg.disableClosingConfirmation();
      }

      // Lock orientation to portrait
      if (tg.lockOrientation) {
        tg.lockOrientation('portrait');
      }
    }

    const initApp = () => {
      try {
        // Set viewport settings
        if (tg.setViewportSettings) {
          tg.setViewportSettings({
            rotate_supported: false,
            can_minimize: true,
            is_expanded: true
          });
        }

        // Force fullscreen on Android
        if (tg.platform === 'android') {
          if (tg.requestFullscreen && !tg.isFullscreen) {
            tg.requestFullscreen();
          }
          if (tg.expand) {
            tg.expand();
          }
        }

        // Force dark theme
        document.documentElement.classList.add('dark');
        
        const setViewportHeight = () => {
          const vh = window.innerHeight * 0.01;
          const height = `${window.innerHeight}px`;
          document.documentElement.style.setProperty('--vh', vh + 'px');
          document.documentElement.style.setProperty('--tg-viewport-height', height);
          document.documentElement.style.setProperty('--tg-viewport-stable-height', height);
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', () => {
          setTimeout(setViewportHeight, 100);
        });

        // Initialize viewport settings
        if (tg.setViewportSettings) {
          tg.setViewportSettings({
            rotate_supported: false,
            can_minimize: false,
            is_expanded: true
          });
        }

        // Configure theme colors
        if (tg.setHeaderColor) {
          tg.setHeaderColor('#0f172a');
        }
        
        if (tg.setBackgroundColor) {
          tg.setBackgroundColor('#0f172a');
        }
        if (tg.setBottomBarColor) {
          tg.setBottomBarColor('#0f172a');
        }
        
        // Force dark theme colors
        document.documentElement.style.setProperty('--tg-theme-bg-color', '#0f172a');
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', 'rgba(15, 23, 42, 0.9)');
        document.documentElement.style.setProperty('--tg-theme-text-color', '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-button-color', '#20a376');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', '#ffffff');
        if (tg.setBottomBarColor) {
          tg.setBottomBarColor('#0f172a');
        }

        // Disable closing confirmation and vertical swipes
        if (tg.disableClosingConfirmation) {
          tg.disableClosingConfirmation();
        }
        if (tg.disableVerticalSwipes) {
          tg.disableVerticalSwipes();
        }

        // Update CSS variables with theme colors
        const themeParams = tg.themeParams;
        if (themeParams) {
          Object.entries(themeParams).forEach(([key, value]) => {
            if (value && typeof value === 'string') {
              document.documentElement.style.setProperty(
                `--tg-theme-${key.replace(/_/g, '-')}`,
                value
              );
            }
          });
        }

        // Expand to full height
        if (tg.expand) {
          tg.expand();
        }

        // Set viewport heights
        if (tg.viewportHeight) {
          document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
        }
        if (tg.viewportStableHeight) {
          document.documentElement.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight}px`);
        }

        // Handle safe areas
        if (tg.safeArea) {
          const { top, right, bottom, left } = tg.safeArea;
          document.documentElement.style.setProperty('--safe-area-top', `${top}px`);
          document.documentElement.style.setProperty('--safe-area-right', `${right}px`);
          document.documentElement.style.setProperty('--safe-area-bottom', `${bottom}px`);
          document.documentElement.style.setProperty('--safe-area-left', `${left}px`);
        }

        // Handle content safe areas (new in 8.0)
        if (tg.contentSafeArea) {
          const { top, right, bottom, left } = tg.contentSafeArea;
          document.documentElement.style.setProperty('--content-safe-area-top', `${top}px`);
          document.documentElement.style.setProperty('--content-safe-area-right', `${right}px`);
          document.documentElement.style.setProperty('--content-safe-area-bottom', `${bottom}px`);
          document.documentElement.style.setProperty('--content-safe-area-left', `${left}px`);
        }

        // Enable haptic feedback
        if (tg.HapticFeedback) {
          tg.HapticFeedback.impactOccurred('medium');
        }

        // Event listeners for 8.0
        const handleViewportChange = () => {
          if (tg.viewportHeight) {
            document.documentElement.style.setProperty(
              '--tg-viewport-height',
              `${tg.viewportHeight}px`
            );
          }
          if (tg.viewportStableHeight) {
            document.documentElement.style.setProperty(
              '--tg-viewport-stable-height',
              `${tg.viewportStableHeight}px`
            );
          }
        };

        tg.onEvent('viewportChanged', handleViewportChange);
        
        // Initial viewport setup
        handleViewportChange();

        tg.onEvent('safeAreaChanged', () => {
          if (tg.safeArea) {
            const { top, right, bottom, left } = tg.safeArea;
            document.documentElement.style.setProperty('--safe-area-top', `${top}px`);
            document.documentElement.style.setProperty('--safe-area-right', `${right}px`);
            document.documentElement.style.setProperty('--safe-area-bottom', `${bottom}px`);
            document.documentElement.style.setProperty('--safe-area-left', `${left}px`);
          }
        });

        tg.onEvent('contentSafeAreaChanged', () => {
          if (tg.contentSafeArea) {
            const { top, right, bottom, left } = tg.contentSafeArea;
            document.documentElement.style.setProperty('--content-safe-area-top', `${top}px`);
            document.documentElement.style.setProperty('--content-safe-area-right', `${right}px`);
            document.documentElement.style.setProperty('--content-safe-area-bottom', `${bottom}px`);
            document.documentElement.style.setProperty('--content-safe-area-left', `${left}px`);
          }
        });

        tg.onEvent('fullscreenChanged', () => {
          if (!tg.isFullscreen && tg.requestFullscreen) {
            tg.requestFullscreen();
            if (tg.expand) {
              tg.expand();
            }
          }
        });

        // Handle theme changes
        tg.onEvent('themeChanged', () => {
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
        });

        // Handle main button visibility changes
        tg.onEvent('mainButtonStateChanged', () => {
          document.documentElement.style.setProperty(
            '--tg-main-button-height',
            `${tg.MainButton.isVisible ? 48 : 0}px`
          );
        });

      } catch (error) {
        console.error('Error during WebApp initialization:', error);
      }
    };

    // Check if ready or wait for ready event
    if (tg.ready) {
      initApp();
    } else {
      tg.onEvent('ready', initApp);
    }

  } catch (error) {
    console.error('Error initializing Telegram WebApp:', error);
  }
}