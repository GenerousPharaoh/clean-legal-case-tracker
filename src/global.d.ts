import * as ReactImport from 'react';

declare global {
  const React: typeof ReactImport;
  interface Window {
    React: typeof ReactImport;
  }
}

// This export is necessary to make this a module
export {};
