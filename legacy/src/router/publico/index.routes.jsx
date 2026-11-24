import { Routes, Route } from "react-router-dom";
import PublicEmbarquesPage from "../../pages/Embarques/pages/public/page";
import { LinkExpiredPage } from "../../layouts/LinkExpired";

export const RutasPublicas = () => {
  return (
    <Routes>

      {/* Ruta para enlace vencido */}
      <Route path="enlace-vencido" element={<LinkExpiredPage />} />
      {/* ruta para cts público con id */}
      <Route path="cts/:id" element={<PublicEmbarquesPage />} />

    </Routes>
  );
};

export default RutasPublicas;
