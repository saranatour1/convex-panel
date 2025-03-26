import React, { useState } from 'react';
import { ClipboardIcon } from './icons';

interface CopyTextButtonProps {
  text: string;
  className?: string;
}

export function CopyTextButton({ text, className = '' }: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1 text-content-secondary hover:text-content-primary ${className}`}
    >
      <ClipboardIcon className="h-4 w-4" />
      <span>{text}</span>
      {copied && <span className="text-xs text-green-500">(Copied!)</span>}
    </button>
  );
} 