// Production-safe logging utility

const isDevelopment = import.meta.env.DEV;

export const logger = {
  // Keep error logging for debugging critical issues
  error: (message: string, ...args: any[]) => {
    // Error logging disabled
  },

  // Keep warning logging for important issues
  warn: (message: string, ...args: any[]) => {
    // Warning logging disabled
  },

  // Only log in development
  info: (message: string, ...args: any[]) => {
    // Info logging disabled
  },

  // Only log in development
  debug: (message: string, ...args: any[]) => {
    // Debug logging disabled
  },
};

// Production-safe performance logging
export const perfLogger = {
  start: (name: string) => {
    if (isDevelopment && performance.mark) {
      performance.mark(`${name}-start`);
    }
  },

  end: (name: string) => {
    if (isDevelopment && performance.measure && performance.mark) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      const measure = performance.getEntriesByName(name).pop();
      if (measure) {
        // Performance logging disabled
      }
    }
  },
};
