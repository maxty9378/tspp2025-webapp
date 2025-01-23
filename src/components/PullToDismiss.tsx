import React, { useEffect, useRef } from 'react';

interface PullToDismissProps {
  children: React.ReactNode;
}

export function PullToDismiss({ children }: PullToDismissProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const isTopArea = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startY.current = touch.clientY;
      currentY.current = touch.clientY;
      isDragging.current = true;
      
      // Check if touch started in top area (56px from top)
      isTopArea.current = touch.clientY <= 56;
      
      // Only prevent default if in top area
      if (isTopArea.current) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || !isTopArea.current) return;

      const touch = e.touches[0];
      currentY.current = touch.clientY;
      const delta = currentY.current - startY.current;

      // Only allow pulling down
      if (delta > 0) {
        e.preventDefault();
        container.style.transform = `translateY(${delta * 0.3}px)`;
        container.style.opacity = `${1 - (delta / window.innerHeight) * 2}`;
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging.current || !isTopArea.current) return;

      const delta = currentY.current - startY.current;
      isDragging.current = false;

      // Reset styles
      container.style.transform = '';
      container.style.opacity = '';

      // If pulled down far enough, close the app
      if (delta > 150) {
        const tg = window.Telegram?.WebApp;
        if (tg?.close) {
          if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
          }
          tg.close();
        }
      } else {
        // Bounce back animation
        container.style.transform = 'translateY(0)';
        container.style.opacity = '1';
        container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Clear transition after animation
        setTimeout(() => {
          container.style.transition = '';
        }, 300);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="min-h-screen"
      style={{ touchAction: 'pan-x pan-y' }}
    >
      {children}
    </div>
  );
}