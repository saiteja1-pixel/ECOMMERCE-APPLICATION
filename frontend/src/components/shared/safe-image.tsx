"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

interface SafeImageProps extends Omit<React.ComponentProps<typeof Image>, "src"> {
  src?: string | null;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
}

export function SafeImage({ 
  src, 
  alt, 
  fallbackIcon: Icon = ImageOff, 
  className,
  ...props 
}: SafeImageProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (!src || error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/80 dark:bg-slate-900/50 text-slate-400 dark:text-slate-600 gap-1.5 p-2 select-none animate-in fade-in duration-200">
        <Icon className="h-8 w-8 text-slate-350 dark:text-slate-600 shrink-0" />
        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 text-center">
          No Image Available
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={className}
      {...props}
    />
  );
}
