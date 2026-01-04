'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { XIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon, AlertTriangleIcon } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

const icons = {
  success: CheckCircleIcon,
  error: AlertCircleIcon,
  info: InfoIcon,
  warning: AlertTriangleIcon,
};

const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const Icon = icons[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-md',
          styles[type]
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm flex-1">{message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/5 rounded transition-colors"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
