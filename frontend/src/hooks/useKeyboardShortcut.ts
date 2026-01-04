import { useEffect, useCallback } from 'react';

type KeyboardModifiers = {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
};

type KeyboardShortcut = {
  key: string;
  modifiers?: KeyboardModifiers;
  callback: () => void;
  preventDefault?: boolean;
};

export function useKeyboardShortcut(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const { key, modifiers = {}, callback, preventDefault = true } = shortcut;
        
        const matchesKey = event.key.toLowerCase() === key.toLowerCase();
        const matchesModifiers =
          (modifiers.ctrl === undefined || modifiers.ctrl === event.ctrlKey) &&
          (modifiers.alt === undefined || modifiers.alt === event.altKey) &&
          (modifiers.shift === undefined || modifiers.shift === event.shiftKey) &&
          (modifiers.meta === undefined || modifiers.meta === event.metaKey);

        if (matchesKey && matchesModifiers) {
          if (preventDefault) {
            event.preventDefault();
          }
          callback();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// 快捷键帮助
export const commonShortcuts = {
  search: { key: 'k', modifiers: { meta: true } },
  newNote: { key: 'n', modifiers: { meta: true } },
  save: { key: 's', modifiers: { meta: true } },
  escape: { key: 'Escape' },
  delete: { key: 'Backspace', modifiers: { meta: true } },
};
