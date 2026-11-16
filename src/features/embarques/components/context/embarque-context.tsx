"use client";

import { createContext, useContext } from "react";

interface EmbarqueContextValue {
  embarque_id: number | null;
  cod_file: string | null;
  servicioNombre: string;
}

const EmbarqueContext = createContext<EmbarqueContextValue>({
  embarque_id: null,
  cod_file: null,
  servicioNombre: "",
});

export function useEmbarqueContext() {
  return useContext(EmbarqueContext);
}

interface EmbarqueProviderProps {
  readonly children: React.ReactNode;
  readonly value: EmbarqueContextValue;
}

export function EmbarqueProvider({ children, value }: EmbarqueProviderProps) {
  return <EmbarqueContext.Provider value={value}>{children}</EmbarqueContext.Provider>;
}
