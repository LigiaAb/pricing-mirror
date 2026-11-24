// EntidadContext.js
import React, { createContext, useContext, useState } from "react";

const EntidadContext = createContext();

export const EntidadProvider = ({ children }) => {
  const [tipoStr, setTipoStr] = useState(null); // Estado que deseas compartir

  return <EntidadContext.Provider value={{ tipoStr, setTipoStr }}>{children}</EntidadContext.Provider>;
};

export const useEntidadContext = () => {
  return useContext(EntidadContext);
};
