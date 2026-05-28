const DB_NAME = 'AgregadosOfflineDB';
const DB_VERSION = 1;

export interface OfflineAction {
  id?: number;
  type: 'INICIAR_VIAJE' | 'REGISTRAR_BALANZA' | 'CONFIRMAR_ENTREGA';
  viajeId: string;
  payload: any;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error al abrir IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('cola_acciones')) {
        db.createObjectStore('cola_acciones', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('fotos_tickets')) {
        db.createObjectStore('fotos_tickets', { keyPath: 'viajeId' });
      }
      if (!db.objectStoreNames.contains('cache_viaje')) {
        db.createObjectStore('cache_viaje', { keyPath: 'viajeId' });
      }
    };
  });
}

export const offlineDb = {
  // --- GESTIÓN DE ACCIONES LOGÍSTICAS ---
  
  /**
   * Agrega una acción a la cola local en IndexedDB.
   */
  async enqueueAction(
    type: OfflineAction['type'], 
    viajeId: string, 
    payload: any = {}
  ): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cola_acciones', 'readwrite');
      const store = transaction.objectStore('cola_acciones');
      const action: OfflineAction = {
        type,
        viajeId,
        payload,
        timestamp: Date.now()
      };
      
      const request = store.add(action);
      
      request.onsuccess = () => {
        resolve(request.result as number);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  /**
   * Obtiene la lista completa de acciones pendientes ordenadas por ID/fecha.
   */
  async getPendingActions(): Promise<OfflineAction[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cola_acciones', 'readonly');
      const store = transaction.objectStore('cola_acciones');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  /**
   * Elimina una acción procesada de la cola.
   */
  async deleteAction(id: number): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cola_acciones', 'readwrite');
      const store = transaction.objectStore('cola_acciones');
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  // --- GESTIÓN DE IMÁGENES BINARIAS (TICKETS DE BALANZA) ---

  /**
   * Guarda de forma binaria el ticket físico en IndexedDB asociado al viaje.
   */
  async savePendingPhoto(viajeId: string, file: File): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('fotos_tickets', 'readwrite');
      const store = transaction.objectStore('fotos_tickets');
      const request = store.put({ viajeId, file });
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  /**
   * Obtiene el archivo binario del ticket para el viaje especificado.
   */
  async getPendingPhoto(viajeId: string): Promise<File | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('fotos_tickets', 'readonly');
      const store = transaction.objectStore('fotos_tickets');
      const request = store.get(viajeId);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.file);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  /**
   * Borra el ticket guardado localmente una vez que se ha subido con éxito a Supabase.
   */
  async deletePendingPhoto(viajeId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('fotos_tickets', 'readwrite');
      const store = transaction.objectStore('fotos_tickets');
      const request = store.delete(viajeId);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  // --- CACHÉ DE VIAJE ACTIVO ---

  /**
   * Guarda en caché local de IndexedDB el estado actual del viaje activo recuperado de Supabase.
   */
  async cacheActiveTrip(viajeId: string, trip: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cache_viaje', 'readwrite');
      const store = transaction.objectStore('cache_viaje');
      const request = store.put({ viajeId, trip, timestamp: Date.now() });
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  },

  /**
   * Recupera el último viaje activo guardado en la caché local.
   */
  async getCachedActiveTrip(): Promise<any | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cache_viaje', 'readonly');
      const store = transaction.objectStore('cache_viaje');
      const request = store.openCursor(null, 'prev'); // Obtener el registro más reciente
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          resolve(cursor.value.trip);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }
};
