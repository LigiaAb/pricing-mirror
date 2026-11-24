import { useState } from "react";
import { Box, Typography } from "@mui/material";
import TabComponent from "../../../components/Tabs/TabComponent";
import TablaCoordinaciones from "../../../components/bpm/tablas/tablaCoordinaciones";
import TablaConsolidadoMawb from "../components/TablaConsolidadoMawb";
import ManifiestoConsolidado from "./manifiestoConsolidado";
import ManifiestoDirecto from "./manifiestoDirecto";
import ManifiestoPendiente from "./manifiestoPendiente";

export default function ManifiestoPage() {
  const [tab, setTab] = useState(0);
  const [vista, setVista] = useState("tabla");
  const [datosVista, setDatosVista] = useState(null);

  const handleVerConsolidado = (mawb, coordinaciones) => {
    setDatosVista({ mawb, coordinaciones });
    setVista("consolidado");
  };

  const handleVerDirecto = (coordinacion) => {
    setDatosVista(coordinacion);
    setVista("directo");
  };

  const handleVerPendiente = (coordinacion) => {
    setDatosVista(coordinacion);
    setVista("pendiente");
  };

  const handleVolver = () => {
    setVista("tabla");
    setDatosVista(null);
  };

  if (vista === "consolidado") {
    return (
      <ManifiestoConsolidado
        mawb={datosVista.mawb}
        coordinaciones={datosVista.coordinaciones}
        onClose={handleVolver}
      />
    );
  }

  if (vista === "directo") {
    return <ManifiestoDirecto coordinacion={datosVista} onClose={handleVolver} />;
  }

  if (vista === "pendiente") {
    return <ManifiestoPendiente coordinacion={datosVista} onClose={handleVolver} />;
  }

  return (
    <Box sx={{ width: "95%", mx: "auto", mt: 2 }}>

      <TabComponent
        opciones={[
          {
            id: 0,
            label: "Consolidado",
            content: (
              <Box sx={{ mt: 2 }}>
                <TablaConsolidadoMawb onVer={handleVerConsolidado} />
              </Box>
            ),
          },
          {
            id: 1,
            label: "Directo",
            content: (
              <TablaCoordinaciones
                estadoFilter="REPESADO"
                servicioFilter={9}
                onView={handleVerDirecto}
              />
            ),
          },
          {
            id: 2,
            label: "Pendiente",
            content: <TablaCoordinaciones estadoFilter="PENDIENTE" onView={handleVerPendiente} />,
          },
        ]}
        tabInicial={tab}
        tabSeleccionado={(nuevoTab) => setTab(nuevoTab)}
        onCambiarTab={(nuevoTab) => setTab(nuevoTab)}
        variante="scrollable"
        bgcolor="transparent"
      />
    </Box>
  );
}
