import React, { useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function ImageWithFallback({ src, alt, className, fallback }: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (error && fallback) {
    return <>{fallback}</>;
  }

  return (
    <LazyLoadImage
      src={src}
      alt={alt}
      className={className}
      effect="blur"
      onError={() => setError(true)}
      threshold={300}
    />
  );
}