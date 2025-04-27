/**
 * Safe access utilities to prevent undefined errors
 * 
 * This module provides utilities for safely accessing properties
 * of potentially undefined objects, avoiding common runtime errors.
 */

// Safe getter for nested properties
export function get<T>(obj: any, path: string, defaultValue: T = undefined as any): T {
  try {
    if (!obj) return defaultValue;
    if (!path) return obj || defaultValue;

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return defaultValue;
      }
      current = current[key];
    }

    return (current === undefined) ? defaultValue : current;
  } catch (err) {
    console.warn(`[SafeAccess] Error accessing path "${path}":`, err);
    return defaultValue;
  }
}

// Add safe access methods to primitive types
// This helps prevent common runtime errors

// Safe string methods
declare global {
  interface String {
    safeSubstring(start: number, end?: number): string;
    safeSlice(start: number, end?: number): string;
    safeToLowerCase(): string;
    safeToUpperCase(): string;
    safeTrim(): string;
  }

  interface Array<T> {
    safeAt(index: number): T | undefined;
    safeJoin(separator?: string): string;
    safeFind(predicate: (value: T, index: number, obj: T[]) => boolean): T | undefined;
    safeFilter(predicate: (value: T, index: number, obj: T[]) => boolean): T[];
    safeMap<U>(callbackfn: (value: T, index: number, array: T[]) => U): U[];
  }

  interface Object {
    safeHasOwnProperty(prop: string): boolean;
    safeGetOwnPropertyNames(): string[];
  }
}

// String methods
String.prototype.safeSubstring = function(start: number, end?: number): string {
  try {
    return this.substring(start, end);
  } catch {
    return String(this);
  }
};

String.prototype.safeSlice = function(start: number, end?: number): string {
  try {
    return this.slice(start, end);
  } catch {
    return String(this);
  }
};

String.prototype.safeToLowerCase = function(): string {
  try {
    return this.toLowerCase();
  } catch {
    return String(this);
  }
};

String.prototype.safeToUpperCase = function(): string {
  try {
    return this.toUpperCase();
  } catch {
    return String(this);
  }
};

String.prototype.safeTrim = function(): string {
  try {
    return this.trim();
  } catch {
    return String(this);
  }
};

// Array methods
Array.prototype.safeAt = function<T>(index: number): T | undefined {
  try {
    if (typeof this.at === 'function') {
      return this.at(index);
    }
    // Fallback for older browsers
    if (index >= 0) {
      return this[index];
    } else {
      return this[this.length + index];
    }
  } catch {
    return undefined;
  }
};

Array.prototype.safeJoin = function(separator?: string): string {
  try {
    return this.join(separator);
  } catch {
    return '';
  }
};

Array.prototype.safeFind = function<T>(
  predicate: (value: T, index: number, obj: T[]) => boolean
): T | undefined {
  try {
    return this.find(predicate);
  } catch {
    return undefined;
  }
};

Array.prototype.safeFilter = function<T>(
  predicate: (value: T, index: number, obj: T[]) => boolean
): T[] {
  try {
    return this.filter(predicate);
  } catch {
    return [];
  }
};

Array.prototype.safeMap = function<T, U>(
  callbackfn: (value: T, index: number, array: T[]) => U
): U[] {
  try {
    return this.map(callbackfn);
  } catch {
    return [];
  }
};

// Object methods
Object.prototype.safeHasOwnProperty = function(prop: string): boolean {
  try {
    return Object.prototype.hasOwnProperty.call(this, prop);
  } catch {
    return false;
  }
};

Object.prototype.safeGetOwnPropertyNames = function(): string[] {
  try {
    return Object.getOwnPropertyNames(this);
  } catch {
    return [];
  }
};

// Export default getter for easy imports
export default get;

console.log('[SafeAccess] Safe access utilities initialized');
