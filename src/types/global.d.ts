/**
 * Global type definitions for custom window properties
 */

// TinyMCE initialization interface
interface TinymceInit {
  setupTinyMCE?: () => void;
}

// Safe access utility function types
interface SafeAccessUtils {
  safeAccess: <T, K extends keyof T>(obj: T | undefined | null, key: K, defaultValue?: T[K]) => T[K] | undefined;
  isDefined: <T>(value: T | null | undefined) => value is T;
  safeCall: <T, A extends any[]>(
    fn: ((...args: A) => T) | undefined | null,
    args: A,
    defaultValue?: T
  ) => T | undefined;
}

declare global {
  interface Window extends SafeAccessUtils {
    tinymce?: any;
    tinymceInit?: TinymceInit;
  }
}

export {}; 