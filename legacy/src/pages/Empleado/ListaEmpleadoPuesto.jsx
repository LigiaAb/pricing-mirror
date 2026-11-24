import FormularioComponent from "@/components/Formulario/FormularioComponent";
import TablaDetallesComponent from "@/components/Tabla/TablaDetallesComponent";
import { useFetchEmpUsuPuesto } from "@/hooks/Fetch/useFetchConfiguracion";
import generarExcel from "@/utils/GeneradorExcel/_generador_excel_v2";
import { Grid } from "@mui/material";
import moment from "moment";
import React from "react";

const ListaEmpleadoPuesto = () => {
  const listaEmpUsuPue = useFetchEmpUsuPuesto({});
  const [filtros, setFiltros] = React.useState({ empresa: null, centro_costo: null, puesto: null, estado: null, usuario: null, empleado: null });

  const empresas = React.useMemo(
    () => listaEmpUsuPue.data?.map((i) => ({ label: i.nombre_emp, value: i.cod_emp })).reduce((acc, i) => (acc.some((j) => i.value === j.value) ? acc : [...acc, i]), []),
    [listaEmpUsuPue.data],
  );
  const centro_costos = React.useMemo(
    () => listaEmpUsuPue.data?.map((i) => ({ label: i.nombre_cc, value: i.cod_cc })).reduce((acc, i) => (acc.some((j) => i.value === j.value) ? acc : [...acc, i]), []),
    [listaEmpUsuPue.data],
  );
  const puestos = React.useMemo(
    () => listaEmpUsuPue.data?.map((i) => ({ label: i.puesto_desc, value: i.cod_puesto })).reduce((acc, i) => (acc.some((j) => i.value === j.value) ? acc : [...acc, i]), []),
    [listaEmpUsuPue.data],
  );
  const estados = React.useMemo(
    () => listaEmpUsuPue.data?.map((i) => ({ label: i.estado_desc, value: i.cod_estado })).reduce((acc, i) => (acc.some((j) => i.value === j.value) ? acc : [...acc, i]), []),
    [listaEmpUsuPue.data],
  );
  const usuarios = React.useMemo(
    () => listaEmpUsuPue.data?.map((i) => ({ label: i.usuario, value: i.cod_usuario })).reduce((acc, i) => (acc.some((j) => i.value === j.value) ? acc : [...acc, i]), []),
    [listaEmpUsuPue.data],
  );
  const empelados = React.useMemo(
    () => listaEmpUsuPue.data?.map((i) => ({ label: i.nombre_completo, value: i.cod_empleado })).reduce((acc, i) => (acc.some((j) => i.value === j.value) ? acc : [...acc, i]), []),
    [listaEmpUsuPue.data],
  );

  const columnas = [
    { id: "empresa", label: "Empresa", column: "nombre_emp" },
    { id: "centro costo", label: "Centros de Costo", column: "nombre_cc" },
    { id: "puesto", label: "Puesto", column: "puesto_desc" },
    { id: "usuemppue_default", label: "Default", column: "usuemppue_default" },
    { id: "empleado", label: "Empleado", column: "nombre_completo" },
    { id: "usuario", label: "Correo", column: "usuario" },
  ];

  const filtrados =
    listaEmpUsuPue.data
      ?.map((i) => ({ ...i, id: `${i.cod_emp}-${i.cod_cc}-${i.cod_puesto}-${i.cod_estado}-${i.cod_usuario}-${i.cod_empleado}` }))
      .filter((u) => (filtros.estado ? u.cod_estado === filtros.estado.value : true))
      .filter((u) => (filtros.empresa ? u.cod_emp === filtros.empresa.value : true))
      .filter((u) => (filtros.centro_costo ? u.cod_cc === filtros.centro_costo.value : true))
      .filter((u) => (filtros.puesto ? u.cod_puesto === filtros.puesto.value : true))
      .filter((u) => (filtros.usuario ? u.cod_usuario === filtros.usuario.value : true))
      .filter((u) => (filtros.empleado ? u.cod_empleado === filtros.empleado.value : true)) || [];

  const formatearElemento = (item) => {
    const obj = {};

    if (!filtros.empresa) obj["Empresa: "] = item.nombre_emp;
    if (!filtros.centro_costo) obj["Centro de Costo: "] = item.nombre_cc;
    if (!filtros.puesto) obj["Puesto: "] = item.puesto_desc;
    if (!filtros.puesto) obj["Default: "] = item.usuemppue_default;
    if (!filtros.estado) obj["Estado: "] = item.estado_desc;
    if (!filtros.usuario) obj["Usuario: "] = item.usuario;
    if (!filtros.empleado) obj["Empleado: "] = item.nombre_completo;

    return obj;
  };

  const generarEncabezados = () => {
    const obj = {};

    if (filtros.empresa) obj["Empresa: "] = filtros.empresa.label;
    if (filtros.centro_costo) obj["Centro de Costo: "] = filtros.centro_costo.label;
    if (filtros.puesto) obj["Puesto: "] = filtros.puesto.label;
    if (filtros.estado) obj["Estado: "] = filtros.estado.label;
    if (filtros.usuario) obj["Usuario: "] = filtros.usuario.label;
    if (filtros.empleado) obj["Empleado: "] = filtros.empleado.label;

    return obj;
  };

  const generarExcelButton = () => {
    generarExcel({
      descargar: true,
      propiedades: {
        title: `Puestos - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_ss")}.xlsx`,
        subject: "Reporte en excel",
        author: "ERP-web",
        creator: "ERP-web",
      },
      titulo: `Puestos del empleado`,
      horizontal: true,
      bottom: true,
      hojas: [
        {
          nombre: `Puestos`,
          color: "006821",
          header: { "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"), ...generarEncabezados() },
          datos: filtrados.map(formatearElemento),
        },
      ],
    });
  };

  return (
    <Grid container>
      {/* <pre>{JSON.stringify(filtros, null, 2)}</pre> */}

      <Grid size={12}>
        <FormularioComponent
          inputs={[
            { id: "empresa", tipo: "select", label: "Empresa", options: empresas, val: filtros.empresa },
            { id: "centro_costo", tipo: "select", label: "Centro de Costo", options: centro_costos, val: filtros.centro_costo },
            { id: "puesto", tipo: "select", label: "Puesto", options: puestos, val: filtros.puesto },
            { id: "estado", tipo: "select", label: "Estado", options: estados, val: filtros.estado },
            { id: "usuario", tipo: "select", label: "Usuario", options: usuarios, val: filtros.usuario },
            { id: "empleado", tipo: "select", label: "Empleado", options: empelados, val: filtros.empleado },
          ]}
          onInput={({ id, val }) => setFiltros((v) => ({ ...v, [id]: val }))}
          botones={{
            agregar: { visible: false },
            excel: { visible: true, texto: "Excel", icono2: "c-excel", textColor: "white", color: "excel", variant: "contained", onClick: () => generarExcelButton() },
          }}
        />
      </Grid>
      <Grid size={12}>
        <TablaDetallesComponent id={"id"} mostrar_id={false} data={filtrados} columnas={columnas} height={"50vh"} buscar titulo="Lista Empleados por puesto" />
      </Grid>

      {/* <pre>{JSON.stringify(listaEmpUsuPue.data, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(empresas, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(centro_costos, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(puestos, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(estados, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(empelados, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(usuarios, null, 2)}</pre> */}
    </Grid>
  );
};

export default ListaEmpleadoPuesto;
