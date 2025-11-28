import { useEffect, useState } from 'react';

interface PlacesLibraryState {
  isLoaded: boolean;
  error: Error | null;
}

export const usePlacesLibrary = () => {
  const [state, setState] = useState<PlacesLibraryState>({
    isLoaded: false,
    error: null,
  });

  useEffect(() => {
    const loadPlacesLibrary = async () => {
      try {
        // Check if google maps API is already loaded
        if (!window.google?.maps) {
          // Load the Google Maps API first
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API;
          if (!apiKey) {
            throw new Error('Google Maps API key is not configured');
          }

          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
          script.async = true;
          script.defer = true;

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Load the Places library
        if (window.google?.maps) {
          await window.google.maps.importLibrary('places');
          setState({ isLoaded: true, error: null });
        } else {
          throw new Error('Google Maps library failed to load');
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ isLoaded: false, error });
      }
    };

    loadPlacesLibrary();
  }, []);

  return state;
};

export default usePlacesLibrary;
