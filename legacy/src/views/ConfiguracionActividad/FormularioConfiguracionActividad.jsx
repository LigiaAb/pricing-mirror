import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
import validators from "@/hooks/Bpm/coordinaciones/validators";
const FormularioConfiguracionActividad = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    configuracion, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
  } = props;
  const { estados = [], tipos = [], empresas = [], cencos = [] } = catalogos;
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_configuracion_actividad: 0,
    empresa: null,
    cenco: null,
    tipo_actividad: null,
    tipo_resultado: null,
    dias_creacion: 0,
    dias_cierre: 0,
    fecha_creacion: new Date(),
    estado: null,
    solo_resultado: "0",
    requiere_cliente: "1",
    abreviatura: "",
    icon: null,
    color: null
  });
  const navigate = useNavigate();
  const [key, setKey] = useState(0);


  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */

  const empresas_ = useMemo(
    () => (empresas?.map((item) => (
      { ...item, 
        label: item.nombre_emp,
        value: item.cod_empresa
      }
    )) || []), [empresas]
  );

  const cencos_ = useMemo(
    () => {
      if(valores?.empresa){
        return (cencos?.map((item) => (
          { ...item, 
            value: item.cod_cc,
            label: item.nombre_cc
          }
        )) || [])
        .filter((i) => i.cod_empresa_cc == valores?.empresa.value)
      } 
      return []
    }, [empresas, cencos, valores?.empresa]
  );

  const tipo_actividad_ = useMemo(
    () => (tipos?.filter((i) => i.tipo_tabla == "ACTIVIDAD")
    .map((item) => (
      { ...item, 
        label: item.nom_tipo,
        value: item.cod_tipo
      }
    )) || []), [tipos]
  );

  const tipo_resultado_ = useMemo(
    () => (tipos?.filter((i) => i.tipo_tabla == "RESULTADO")
    .map((item) => (
      { ...item, 
        label: item.nom_tipo,
        value: item.cod_tipo
      }
    )) || []), [tipos]
  );

  const estados_ = useMemo(
    () => (estados?.filter((i) => i.nom_tipo == "GLOBAL")
    .map((item) => (
      { ...item, 
        label: item.estado_desc,
        value: item.cod_estado
      }
    )) || []), [estados]
  );

  const inputs = useMemo(() => {
    return [
      { 
        id: "cod_configuracion_actividad", 
        label: "Código", 
        tipo: "number", 
        val: valores.cod_configuracion_actividad, 
        readonly: true 
      },
      { 
        id: "empresa", 
        label: "Empresa", 
        tipo: "select", 
        val: valores.empresa, 
        options: empresas_,
        readonly: false 
      },
      { 
        id: "cenco", 
        label: "Centro de costo", 
        tipo: "select", 
        val: valores.cenco, 
        options: cencos_,
        readonly: !valores.empresa 
      },
      { 
        id: "tipo_actividad", 
        label: "Tipo de actividad", 
        tipo: "select", 
        val: valores.tipo_actividad, 
        options: tipo_actividad_,
        readonly: false
      },
      { 
        id: "tipo_resultado", 
        label: "Tipo de resultado", 
        tipo: "select", 
        val: valores.tipo_resultado, 
        options: tipo_resultado_,
        readonly: false
      },
      { 
        id: "abreviatura", 
        label: "Abreviatura", 
        tipo: "text", 
        val: valores.abreviatura, 
        readonly: false
      },
      { 
        id: "color", 
        label: "Color", 
        tipo: "color",
        val: valores.color, 
        readonly: false
      },
      { 
        id: "icono", 
        label: "Icono", 
        tipo: "icono", 
        val: valores.icono, 
        icono: valores.icono, 
        readonly: false
      },
      { 
        id: "dias_creacion", 
        label: "Dias para creación", 
        tipo: "number", 
        val: valores.dias_creacion, 
        readonly: false
      },
      { 
        id: "dias_cierre", 
        label: "Dias para cierre", 
        tipo: "number", 
        val: valores.dias_cierre, 
        readonly: false
      },
      { 
        id: "solo_resultado", 
        label: "¿ES SOLO RESULTADO?", 
        tipo: "radio", 
        val: valores.solo_resultado, 
        readonly: false,
        options: [
          {label: "NO", value: 0},
          {label: "SI", value: 1},
        ]
      },
      { 
        id: "requiere_cliente", 
        label: "¿REQUIERE DE UN CLIENTE?", 
        tipo: "radio", 
        val: valores.requiere_cliente, 
        readonly: false,
        options: [
          {label: "NO", value: 0},
          {label: "SI", value: 1},
        ]
      },
      { 
        id: "estado", 
        label: "Estado", 
        tipo: "select", 
        val: valores.estado, 
        readonly: false,
        options: estados_
      },
      { 
        id: "fecha_creacion", 
        label: "Fecha de creacion", 
        tipo: "date", 
        val: valores.fecha_creacion, 
        readonly: true
      },

    ];
  }, [valores, empresas_, cencos_, estados_]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    if(id == "empresa"){
      setValores((v) => ({ ...v, [id]: val,  cenco: null}));
    } else {
      setValores((v) => ({ ...v, [id]: val }));
    }
  }, []);

  const agregar = useCallback(async () => {
    console.log(valores)
    const { cenco, empresa, tipo_actividad, tipo_resultado, estado, solo_resultado, requiere_cliente, color } = valores;
    await api.post("api/appweb/insertar-configuracion-actividad", {
        ...valores,
        cod_emp: empresa?.value,
        cod_cc: cenco?.value,
        cod_tipo_actividad: tipo_actividad?.value,
        cod_tipo_resultado: tipo_resultado?.value,
        cod_estado: estado.value,
        solo_resultado: Number(solo_resultado),
        requiere_cliente: Number(requiere_cliente),
        color: !!color ? color : undefined,
      }
      ).then(({data}) => {
        if(data.data.success) navigate(`../${encryptId(data.data.configuracion_id)}`)
      })
    
    ;
  }, [navigate, valores]);

  const cancelar = useCallback(() => {}, []);

  const guardar = useCallback(() => {
    console.log(valores)
    const { cenco, empresa, tipo_actividad, tipo_resultado, estado, color } = valores;
    api.post("api/appweb/actualizar-configuracion-actividad", {
        ...valores,
        cod_emp: empresa.value,
        cod_cc: cenco.value,
        cod_tipo_actividad: tipo_actividad.value,
        cod_tipo_resultado: tipo_resultado.value,
        cod_estado: estado.value,
        color: !!color ? color : undefined,
      }
    );
  }, [valores]);

  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
   console.log("conf", configuracion)
    if(configuracion){
      const { 
        cod_configuracion_actividad, cod_emp, cod_cc, cod_tipo_actividad, dias_creacion, dias_cierre, solo_resultado,
        nom_tipo_actividad, cod_tipo_resultado, nom_tipo_resultado, fecha_creacion, cod_estado, estado_desc, requiere_cliente,
        abreviatura, color, icono
      } = configuracion;

      const empresa = empresas?.find((i) => i.cod_empresa === cod_emp);
      const cenco = cencos?.find((i) => i.cod_cc === cod_cc);

      setValores({
        cod_configuracion_actividad,
        empresa: { value: empresa?.cod_empresa, label: empresa?.nombre_emp },
        cenco: { value: cenco?.cod_cc, label: cenco?.nombre_cc },
        tipo_actividad: { value: cod_tipo_actividad, label: nom_tipo_actividad },
        tipo_resultado: { value: cod_tipo_resultado, label: nom_tipo_resultado },
        dias_cierre,
        dias_creacion,
        fecha_creacion: new Date(fecha_creacion),
        estado: { value: cod_estado, label: estado_desc },
        solo_resultado: solo_resultado ? "1" : "0",
        requiere_cliente: requiere_cliente ? "1" : "0",
        abreviatura,
        color,
        icono
      })
    } 
  }, [estados, configuracion, empresas, cencos]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <p><b>*Dias para creación:</b> Cuantos dias en el pasado puede crearse una actividad.</p>
      <p><b>*Dias para cierre:</b> Número de dias máximo despues de la fecha de programación cuando pueden agregarse resultados a la actividad.</p>
      <FormularioComponent
        key={key}
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: id === "new", onClick: () => agregar() },
          cancelar: { visible: false, onClick: cancelar },
          guardar: { visible: id !== "new", onClick: () => guardar() },
          filtrar: { visible: false, onClick: filtrar },
        }}
      />
    </Box>
  );
};
FormularioConfiguracionActividad.propTypes = {
  // ELEMENTO
  configuracion: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioConfiguracionActividad;
