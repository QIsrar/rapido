'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopySchemaButtonProps {
  sqlContent: string;
}

export function CopySchemaButton({ sqlContent }: CopySchemaButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sqlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      const el = document.createElement('textarea');
      el.value = sqlContent;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all tap-scale ${
        copied
          ? 'bg-emerald-600 text-white'
          : 'bg-slate-900 text-white hover:bg-slate-800'
      }`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied to Clipboard!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy Idempotent SQL
        </>
      )}
    </button>
  );
}
