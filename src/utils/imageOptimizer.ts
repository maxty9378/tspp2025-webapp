import { logger } from './logger';

export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || 'unknown';

    logger.info('Starting image compression', userId, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        logger.error('Canvas context creation failed', userId, new Error('Failed to get canvas context'), {
          fileName: file.name
        });
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      const maxSize = 1200;

      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressionTime = Date.now() - startTime;
            logger.info('Image compression completed', userId, {
              fileName: file.name,
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio: (blob.size / file.size * 100).toFixed(2) + '%',
              width,
              height,
              processingTime: compressionTime
            });
            resolve(blob);
          } else {
            logger.error('Blob creation failed', userId, new Error('Failed to compress image'), {
              fileName: file.name
            });
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = (error) => {
      logger.error('Image loading failed', userId, new Error('Failed to load image'), {
        fileName: file.name,
        error
      });
      reject(new Error('Failed to load image'));
    };
  });
}

export function optimizeImageUrl(url: string, width = 400, height = 400): string {
  if (!url) return '';
  
  try {
    // Add cache-busting parameter
    const separator = url.includes('?') ? '&' : '?';
    const timestamp = Date.now();
    return `${url}${separator}t=${timestamp}`;
    
  } catch (error) {
    console.error('Error optimizing image:', error);
    return url;
  }
}