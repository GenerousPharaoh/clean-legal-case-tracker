import { useEffect, useCallback, useState, useRef } from 'react';

type KeyPredicate = (e: KeyboardEvent) => boolean;

type KeyMapItem = {
  key: string | string[] | KeyPredicate;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  callback: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
  description?: string;
  id?: string;
  disabled?: boolean;
};

type KeyCombo = {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
};

interface KeyboardShortcutOptions {
  targetKey: string | string[] | KeyPredicate;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  preventDefault?: boolean;
  disabled?: boolean;
  description?: string;
  id?: string;
}

/**
 * useKeyboardShortcut - A hook for registering and managing keyboard shortcuts
 * 
 * Provides a way to register multiple keyboard shortcuts with modifiers
 * and get a list of all registered shortcuts for display.
 * 
 * @returns Keyboard shortcut utilities and information
 * 
 * @example
 * // Register a global shortcut
 * const { registerShortcut } = useKeyboardShortcut();
 * 
 * useEffect(() => {
 *   const unregister = registerShortcut({
 *     targetKey: 's',
 *     ctrl: true,
 *     callback: () => handleSave(),
 *     preventDefault: true,
 *     description: 'Save document'
 *   });
 *   
 *   return unregister;
 * }, []);
 */
export const useKeyboardShortcut = () => {
  // Ref to keep track of all registered shortcuts
  const shortcutsRef = useRef<Map<string, KeyMapItem>>(new Map());
  
  // State to keep track of registered shortcuts for UI display
  const [shortcuts, setShortcuts] = useState<KeyMapItem[]>([]);

  // Generate a unique ID for the shortcut
  const generateShortcutId = useCallback((combo: KeyCombo, id?: string): string => {
    if (id) return id;
    
    const keyPart = Array.isArray(combo.key) 
      ? combo.key.join('+') 
      : typeof combo.key === 'function' 
        ? 'custom' 
        : combo.key;
        
    return [
      combo.ctrl && 'ctrl',
      combo.alt && 'alt',
      combo.shift && 'shift',
      combo.meta && 'meta',
      keyPart
    ].filter(Boolean).join('+');
  }, []);

  // Format a shortcut for display
  const formatShortcut = useCallback((combo: KeyCombo): string => {
    const parts = [];
    
    if (combo.meta) parts.push('⌘');
    if (combo.ctrl) parts.push('Ctrl');
    if (combo.alt) parts.push('Alt');
    if (combo.shift) parts.push('Shift');
    
    if (Array.isArray(combo.key)) {
      parts.push(combo.key.map(k => k.toUpperCase()).join(' or '));
    } else if (typeof combo.key === 'string') {
      parts.push(combo.key.length === 1 ? combo.key.toUpperCase() : combo.key);
    } else {
      parts.push('Custom');
    }
    
    return parts.join(' + ');
  }, []);

  // Check if a key event matches a shortcut
  const matchesKeyCombo = useCallback((e: KeyboardEvent, item: KeyMapItem): boolean => {
    // Check modifiers first
    if (!!item.ctrl !== e.ctrlKey) return false;
    if (!!item.alt !== e.altKey) return false;
    if (!!item.shift !== e.shiftKey) return false;
    if (!!item.meta !== e.metaKey) return false;
    
    // Check key
    if (typeof item.key === 'function') {
      return item.key(e);
    } else if (Array.isArray(item.key)) {
      return item.key.includes(e.key.toLowerCase());
    } else {
      return item.key.toLowerCase() === e.key.toLowerCase();
    }
  }, []);

  // Event handler for keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if target is an input, textarea, or has contentEditable
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }
    
    // Check if the key combo matches any registered shortcut
    for (const item of shortcutsRef.current.values()) {
      if (item.disabled) continue;
      
      if (matchesKeyCombo(e, item)) {
        if (item.preventDefault) {
          e.preventDefault();
        }
        item.callback(e);
        break; // Only execute the first matching shortcut
      }
    }
  }, [matchesKeyCombo]);

  // Register global event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Register a new keyboard shortcut
  const registerShortcut = useCallback(({
    targetKey,
    ctrl = false,
    alt = false,
    shift = false,
    meta = false,
    preventDefault = false,
    disabled = false,
    description,
    id,
    callback
  }: KeyboardShortcutOptions & { callback: (e: KeyboardEvent) => void }): () => void => {
    const shortcutItem: KeyMapItem = {
      key: targetKey,
      ctrl,
      alt,
      shift,
      meta,
      callback,
      preventDefault,
      disabled,
      description
    };
    
    // Generate an ID for this shortcut
    const shortcutId = generateShortcutId({
      key: targetKey,
      ctrl,
      alt,
      shift,
      meta
    }, id);
    
    shortcutItem.id = shortcutId;
    
    // Add the shortcut to our registry
    shortcutsRef.current.set(shortcutId, shortcutItem);
    
    // Update the shortcuts list
    setShortcuts(Array.from(shortcutsRef.current.values()));
    
    // Return a function to unregister this shortcut
    return () => {
      shortcutsRef.current.delete(shortcutId);
      setShortcuts(Array.from(shortcutsRef.current.values()));
    };
  }, [generateShortcutId]);

  // Enable/disable a specific shortcut
  const toggleShortcut = useCallback((id: string, disabled: boolean) => {
    const shortcut = shortcutsRef.current.get(id);
    
    if (shortcut) {
      shortcut.disabled = disabled;
      shortcutsRef.current.set(id, shortcut);
      setShortcuts(Array.from(shortcutsRef.current.values()));
    }
  }, []);

  // Format all shortcuts for display
  const formattedShortcuts = useCallback(() => {
    return Array.from(shortcutsRef.current.values()).map(item => ({
      id: item.id,
      keys: formatShortcut({
        key: item.key,
        ctrl: !!item.ctrl,
        alt: !!item.alt,
        shift: !!item.shift,
        meta: !!item.meta
      }),
      description: item.description || '',
      disabled: !!item.disabled
    }));
  }, [formatShortcut]);

  return {
    registerShortcut,
    toggleShortcut,
    shortcuts: formattedShortcuts(),
    formatShortcut
  };
};

export default useKeyboardShortcut;
