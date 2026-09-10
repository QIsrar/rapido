'use client';

import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ReceiptViewerProps {
  url: string;
  description?: string;
}

export function ReceiptViewer({ url, description }: ReceiptViewerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger — small thumbnail */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="relative group flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all tap-scale"
        title="View receipt"
      >
        <img
          src={url}
          alt="Receipt"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn className="h-3.5 w-3.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      {/* Fullscreen lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setOpen(false)}
          style={{ touchAction: 'pinch-zoom' }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors tap-scale"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="max-w-full max-h-full animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={url}
              alt={description || 'Receipt image'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              style={{ touchAction: 'pinch-zoom' }}
            />
            {description && (
              <p className="text-center text-sm text-white/70 mt-3 font-medium">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
