// update comment
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Grid, /* Grid, */ Typography } from "@mui/material";
// import { api } from "../../../../api";
import { useDispatch, useSelector } from "react-redux";
// import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
// import { decryptId, encryptId } from "../../../api/encryptDecrypt";
import PropTypes from "prop-types";
// import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
// import TablaEntidadAsignacion from "../../../views/Entidad/EntidadAsignacion/TablaEntidadAsignacion";
// import TabComponent from "../../../components/Tabs/TabComponent";
// import VistaNuevaAsignacion from "./VistaNuevaAsignacion";
// import TransferListsComponent from "../../../components/Lists/TransferListsComponent";
// import VistaTrasladoAsignacion from "./VistaTrasladoAsignacion";
// import VistaMisAsignaciones from "./VistaMisAsignaciones";
import { apagarCarga, encenderCarga } from "@/store/slices/status/statusSlice";
import { api } from "@/api";
import { decryptId, encryptId } from "@/api/encryptDecrypt";
import useObtenerOpcionesAcciones from "@/hooks/useObtenerOpcionesAcciones";
import TabComponent from "@/components/Tabs/TabComponent";
import TablaAsignacionCTS from "./TablaAsignacionCTS";
import { FormularioAsignacionCTS } from "./FormularioAsignacionCTS";
import FormularioCargaAsignacionCTS from "./FormularioCargaAsignacionCTS";

// import TablaEntidadAsignacion from "../../../views/Entidad/EntidadAsignacion/TablaEntidadAsignacion";

const ListaAsignacionCTS = (props) => {
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const { tipoStr } = props;
  const dispatch = useDispatch();

  const [datos, setDatos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [formulario, setFormulario] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [updateData, setUpdateData] = useState(0);
  const { currentCategoria } = useSelector((slice) => slice.menu);
  const { json } = useSelector((slice) => slice.auth);
  const { permisosArray, catalogoArray } = useObtenerOpcionesAcciones();
  const navigate = useNavigate();
  // const [valores, setValores] = useState({ filtro1: ""  , filtro2: ""   });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */

  const seleccionarAsignacion = (data) => {
    setFormulario(true)
    setAsignacionSeleccionada(data)
  };

  const nuevaAsignacion = (data) => {
    setFormulario(true)
    setAsignacionSeleccionada(null)
  };

  const onCreate = async (data) => {
    await api
        .get("api/appweb/listar-asignacion-cliente-cts", {params:{cod_asignacion_cts: data.cod_asignacion_cts}})
        .then(({ data }) => setAsignacionSeleccionada(data.data[0]))
        .catch((e) => console.error(e));
    setUpdateData(i => i + 1)
  };

  const handleSubmitDelete = async (elemento) => {
    await api
      .post("api/appweb/eliminar-asignacion-cliente-cts", {cod_asignacion_cts: elemento.cod_asignacion_cts})
      .then(({ data }) => {
        if(elemento.cod_asignacion_cts == asignacionSeleccionada.cod_asignacion_cts){
          setFormulario(false)
        }
      })
      .catch((e) => console.error(e));
    setUpdateData(i => i + 1)
  };

  return (
    <Box sx={{ width: "100%", mx: "auto", mt: 2, p: { xs: 1, md: 2 }, }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: 'text.primary' }}>
        Asignación de CTS
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Listado de operadores asignados a clientes
      </Typography>

      <TabComponent
        tabInicial={catalogoArray?.filter((o) => o.nivel_opcion === "I")[0]?.cod_opcion || null}
        opciones={[
          ...(catalogoArray
            .filter((o) => o.nivel_opcion === "I")
            .map((o) => ({
              id: o.cod_opcion,
              label: o.nom_opcion,
              icono: o.opcion_icono,
              disabled: !permisosArray.find((pa) => pa.cod_opcion === o.cod_opcion),
              content:
                <>
                  {
                    o.nom_opcion === "Lista" ? (
                      <Box mt={1}>
                        <TablaAsignacionCTS onView={seleccionarAsignacion} onNew={nuevaAsignacion} onDelete={handleSubmitDelete}
                          updateData={updateData}
                        />
                        {
                          formulario && <FormularioAsignacionCTS catalogos={{entidades: []}} dataGet={asignacionSeleccionada} onCreate={onCreate}/>
                        }
                      </Box>
                    ) : o.nom_opcion === "Asignación Masiva" ? (
                        <FormularioCargaAsignacionCTS/>
                    ) : null
                  }
                </>
            })) || []),

        ]}
      />

      <Grid container></Grid>
    </Box>
  );
};
ListaAsignacionCTS.propTypes = {
  // ELEMENTO
  tipoStr: PropTypes.string,
};
export default ListaAsignacionCTS;
