interface NotificationOptions {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export function showNotification({ title, message, type }: NotificationOptions) {
  const tg = window.Telegram?.WebApp;
  
  if (tg?.version && parseFloat(tg.version) >= 6.2) {
    const button = type === 'error' 
      ? { type: 'destructive', text: 'OK', id: 'error_ok' }
      : type === 'warning'
      ? { type: 'default', text: 'OK', id: 'warning_ok' }
      : { type: 'ok', id: 'success_ok' };

    tg.showPopup({
      title,
      message,
      buttons: [button]
    }, (buttonId) => {
      // Handle button clicks if needed
      if (buttonId?.includes('warning_cancel')) {
        hapticFeedback('error');
      } else {
        hapticFeedback(type === 'success' ? 'success' : 'light');
      }
    });
  } else if (tg?.version && parseFloat(tg.version) >= 6.1) {
    tg.HapticFeedback.notificationOccurred('success');
  }
  
  // Always log to console for debugging
  const style = type === 'error' ? 'color: #ef4444' : 
                type === 'success' ? 'color: #22c55e' : 
                'color: #3b82f6';
                
  console.log(`%c${title}: ${message}`, style);
}