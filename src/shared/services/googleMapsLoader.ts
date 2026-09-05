/**
 * Cargador asíncrono singleton para Google Maps JavaScript API.
 * Garantiza que el script se cargue una sola vez de forma no bloqueante.
 */

let loadPromise: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'your-google-maps-api-key-here') {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY no está configurada en .env.local'));
      return;
    }

    const callbackName = `__googleMapsInitCallback_${Date.now()}`;

    // Callback global llamado por el script de Google
    (window as unknown as Record<string, () => void>)[callbackName] = () => {
      delete (window as unknown as Record<string, () => void>)[callbackName];
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps no se inicializó correctamente en el objeto global.'));
      }
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&loading=async&libraries=geometry`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      delete (window as unknown as Record<string, () => void>)[callbackName];
      reject(new Error('Error al descargar el script de Google Maps API. Revisa tu conexión o tu API Key.'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
