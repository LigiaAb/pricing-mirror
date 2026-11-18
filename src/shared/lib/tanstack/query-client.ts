import {
  defaultShouldDehydrateQuery,
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { isSesionExpirada, mensajeDeError } from "@/shared/api/errors";

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      /** No mostrar toast ante error (la vista maneja el fallo, p. ej. boundary propio). */
      silent?: boolean;
    };
    mutationMeta: {
      /** No mostrar toast ante error. */
      silent?: boolean;
      /** Toast de éxito a mostrar al completar la mutación. */
      successMessage?: string | ((data: unknown) => string);
    };
  }
}

/**
 * Manejo de errores centralizado: el call site declara con `meta`
 * (`silent`, `successMessage`); nunca implementa toasts a mano.
 * Sesión expirada no genera toast: el adaptador HTTP ya redirige a /login.
 */
function notifyError(error: unknown, silent: boolean | undefined): void {
  if (silent || isSesionExpirada(error)) return;
  toast.error(mensajeDeError(error));
}

let browserQueryClient: QueryClient | undefined;

function makeQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => notifyError(error, query.meta?.silent),
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => notifyError(error, mutation.meta?.silent),
      onSuccess: (data, _variables, _context, mutation) => {
        const msg = mutation.meta?.successMessage;
        if (typeof msg === "function") {
          const resolvedMessage = msg(data);
          if (resolvedMessage) toast.success(resolvedMessage);
        } else if (msg) {
          toast.success(msg);
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        // Explícito (default 5min): cuánto vive la caché sin observadores
        gcTime: 5 * 60 * 1000,
        // Datos de ERP no cambian al alternar pestañas; las queries que
        // necesiten frescura lo activan por query
        refetchOnWindowFocus: false,
        // Reintentar una sesión expirada solo repite el 401 y el redirect a /login
        retry: (failureCount, error) => !isSesionExpirada(error) && failureCount < 1,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

export function getQueryClient(): QueryClient {
  if (globalThis.window === undefined) {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function createQueryClient(): QueryClient {
  return makeQueryClient();
}
