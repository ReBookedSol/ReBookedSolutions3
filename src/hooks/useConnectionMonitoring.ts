import { useEffect } from 'react';
import { setupConnectionMonitoring } from '@/utils/connectionStatus';

/**
 * Hook to set up connection monitoring
 * Call this once in your main App component
 */
export function useConnectionMonitoring() {
  useEffect(() => {
    setupConnectionMonitoring();

    // Cleanup function (though connection monitoring doesn't need cleanup)
    return () => {};
  }, []);
}

export default useConnectionMonitoring;
