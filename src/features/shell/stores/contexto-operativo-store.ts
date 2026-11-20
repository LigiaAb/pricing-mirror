import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Pais {
  cod_pais: number;
  nombre_pais: string;
}

interface Empresa {
  cod_empresa: number;
  nombre_emp?: string; // Nombre principal de la API
  nom_emp?: string; // Compatibilidad
}

interface CentroCosto {
  cod_cc: number;
  nombre_cc?: string; // Nombre principal de la API
  nom_cc?: string; // Compatibilidad
}

/**
 * Contexto operativo: el filtro de trabajo (país/empresa/centro de costo) que alimenta
 * las consultas de cada pantalla. Es global al usuario y se comparte entre pestañas.
 *
 * El módulo/menú/categoría NO viven aquí: se derivan del pathname en
 * `useNavegacionActual`, porque son estado de cada pestaña y deben sobrevivir un
 * recargado sin contaminarse con lo que hizo otra pestaña.
 */
interface ContextoOperativoState {
  currentPais: Pais | null;
  currentEmpresa: Empresa | null;
  currentCentroCosto: CentroCosto | null;
  /**
   * El contexto vive en localStorage y rehidrata *después* del primer render. Sin este
   * flag, una vista no puede distinguir "todavía no sé el país" de "no hay país", y
   * termina lanzando la consulta sin filtrar (mismo patrón que `auth-store`).
   */
  _hasHydrated: boolean;

  setHasHydrated: (state: boolean) => void;
  setCurrentPais: (pais: Pais | null) => void;
  setCurrentEmpresa: (empresa: Empresa | null) => void;
  setCurrentCentroCosto: (cc: CentroCosto | null) => void;
}

export const useContextoOperativoStore = create<ContextoOperativoState>()(
  persist(
    (set) => ({
      currentPais: null,
      currentEmpresa: null,
      currentCentroCosto: null,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setCurrentPais: (pais) => set({ currentPais: pais }),
      setCurrentEmpresa: (empresa) => set({ currentEmpresa: empresa }),
      setCurrentCentroCosto: (cc) => set({ currentCentroCosto: cc }),
    }),
    {
      // Clave histórica en localStorage: cambiarla resetearía el contexto guardado de los usuarios
      name: "menu-storage",
      partialize: ({ _hasHydrated: _, ...state }) => state,
      onRehydrateStorage: (state) => () => state.setHasHydrated(true),
    },
  ),
);
