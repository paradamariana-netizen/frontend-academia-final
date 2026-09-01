const STORAGE_PREFIX = "frontend-academia:";

const getKey = (key: string) => `${STORAGE_PREFIX}${key}`;

/**
 * Guarda datos únicamente durante la sesión actual del navegador.
 *
 * `sessionStorage` mantiene la información disponible tras recargar la página,
 * pero la elimina al cerrar la pestaña. Así, los datos añadidos por la persona
 * usuaria no se envían a un servidor ni quedan guardados permanentemente.
 */
export const storageService = {
  get<T>(key: string): T | null {
    try {
      const value = sessionStorage.getItem(getKey(key));

      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error al leer ${key} del almacenamiento temporal:`, error);
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error(
        `Error al guardar ${key} en el almacenamiento temporal:`,
        error,
      );
    }
  },

  remove(key: string): void {
    sessionStorage.removeItem(getKey(key));
  },

  clear(): void {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
  },
};
