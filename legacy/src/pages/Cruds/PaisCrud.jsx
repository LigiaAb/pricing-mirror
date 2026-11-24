import PropTypes from "prop-types";
import TablaComponent from "../../components/Tabla/TablaComponent";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Checkbox, IconButton, Icon } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api";
import moment from "moment";

const llavesEspeciales = ["checked", "ediar", "eliminar", "autorizar", "pdf", "excel", "ver"];

const columns = [
  { name: "cod_empresa", campo: "cod_empresa", label: "cod_empresa", multilinea: false },
  { name: "NOMBRE_EMP", campo: "NOMBRE_EMP", label: "NOMBRE_EMP", multilinea: false },
  { name: "PAIS_EMP", campo: "PAIS_EMP", label: "PAIS_EMP", multilinea: false },
  { name: "NIT_EMP", campo: "NIT_EMP", label: "NIT_EMP", multilinea: false },
  { name: "DIRECCION_EMP", campo: "DIRECCION_EMP", label: "DIRECCION_EMP", multilinea: false },
  { name: "LOGO_EMP", campo: "LOGO_EMP", label: "LOGO_EMP", multilinea: false },
  { name: "FECHA_INGRESO", campo: "FECHA_INGRESO", label: "FECHA_INGRESO", multilinea: false },
];

// const columns = [
//   {
//     name: "PAIS_CORR",
//     label: "CORRELATIVO",
//     campo: "PAIS_CORR",
//   },
//   {
//     name: "PAIS_CODIGO",
//     label: "CODIGO",
//     campo: "PAIS_CODIGO",
//   },
//   {
//     name: "PAIS_NOMBRE",
//     label: "NOMBRE",
//     campo: "PAIS_NOMBRE",
//   },
//   {
//     name: "MON_CODIGO",
//     label: "MONEDA",
//     campo: "MON_CODIGO",
//   },
//   {
//     name: "CONTI_CODIGO",
//     label: "CODIGO DE CONTINENTE",
//     campo: "CONTI_CODIGO",
//   },
// ];

export const PaisCrud = () => {
  const [header, setHeader] = useState(columns);
  const [paises, setPaises] = useState([]);
  const [paisSeleccionado, setPaisSeleccionado] = useState(null);

  const consultarLista = useCallback(async () => {
    await api.get("appweb/listaempresas").then(({ data }) => setPaises(data.data));
  }, []);

  useEffect(() => {
    consultarLista();
  }, []);

  const handleChange = (ev, pais) => {
    setPaises((paises) => paises.map((i) => ({ ...i, checked: pais.PAIS_CODIGO === i.PAIS_CODIGO ? !i.checked : false })));
    if (pais.PAIS_CODIGO === paisSeleccionado?.PAIS_CODIGO) setPaisSeleccionado(null);
    else setPaisSeleccionado(pais);
  };

  const [valores, setValores] = useState({
    test1: "",
    test2: "",
    test3: moment("1996-08-22"),
    test4: "",
    test5: "",
    test6: "",
    test7: "",
    test8: "",
    test9: "",
    test10: "",
    test11: "",
    test12: "",
  });
  const [readonly, setReadonly] = useState({
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
    test6: false,
    test7: false,
    test8: false,
    test9: false,
    test10: false,
    test11: false,
    test12: false,
  });

  const inputs = useMemo(
    () => [
      { id: "test1", label: "test1", tipo: "text", val: valores["test1"], readonly: readonly["test1"] },
      { id: "test2", label: "test2", tipo: "text", val: valores["test2"], readonly: readonly["test2"] },
      { id: "test3", label: "test3", tipo: "date", val: valores["test3"], readonly: readonly["test3"] },
      { id: "test4", label: "test4", tipo: "text", val: valores["test4"], readonly: true },
      { id: "test5", label: "test5", tipo: "text", val: valores["test5"], error: true, errorMessge: "Este campo tiene error" },
      { id: "test6", label: "test6", tipo: "text", val: valores["test6"], requerido: true },
      { id: "test7", label: "test7", tipo: "text", val: valores["test7"] },
      {
        id: "test8",
        label: "test8",
        tipo: "select",
        val: valores["test8"],
        options: [
          { label: "testlabel", value: "testid1" },
          { label: "testlabe2", value: "testid2" },
          { label: "testlabe3", value: "testid3" },
          { label: "testlabe4", value: "testid4" },
          { label: "testlabe5", value: "testid5" },
          { label: "testlabe6", value: "testid6" },
          { label: "testlabe7", value: "testid7" },
          { label: "testlabe8", value: "testid8" },
          { label: "testlabe9", value: "testid9" },
          { label: "testlabe10", value: "testid10" },
          { label: "testlabe11", value: "testid11" },
          { label: "testlabe12", value: "testid12" },
          { label: "testlabe13", value: "testid13" },
          { label: "testlabe14", value: "testid14" },
        ],
      },
      { id: "test9", label: "test9", tipo: "number", val: valores["test9"] },
      { id: "test10", label: "test10", tipo: "number", val: valores["test10"] },
      { id: "test11", label: "test11", tipo: "number", val: valores["test11"] },
      { id: "test12", label: "test12", tipo: "number", val: valores["test12"] },
    ],
    [valores, readonly]
  );

  // const [inputs, setInputs] = useState([
  //   { id: "test1", label: "test1", tipo: "text", val: "test" },
  //   { id: "test2", label: "test2", tipo: "text", val: "" },
  //   { id: "test3", label: "test3", tipo: "date", val: "" },
  //   { id: "test4", label: "test4", tipo: "text", val: "", readonly: true },
  //   { id: "test5", label: "test5", tipo: "text", val: "", error: true, errorMessge: "Este campo tiene error" },
  //   { id: "test6", label: "test6", tipo: "text", val: "", requerido: true },
  //   { id: "test7", label: "test7", tipo: "text", val: "" },
  //   {
  //     id: "test8",
  //     label: "test8",
  //     tipo: "select",
  //     val: "",
  //     options: [
  //       { label: "testlabel", value: "testid1" },
  //       { label: "testlabe2", value: "testid2" },
  //       { label: "testlabe3", value: "testid3" },
  //       { label: "testlabe4", value: "testid4" },
  //       { label: "testlabe5", value: "testid5" },
  //       { label: "testlabe6", value: "testid6" },
  //       { label: "testlabe7", value: "testid7" },
  //       { label: "testlabe8", value: "testid8" },
  //       { label: "testlabe9", value: "testid9" },
  //       { label: "testlabe10", value: "testid10" },
  //       { label: "testlabe11", value: "testid11" },
  //       { label: "testlabe12", value: "testid12" },
  //       { label: "testlabe13", value: "testid13" },
  //       { label: "testlabe14", value: "testid14" },
  //     ],
  //   },
  //   { id: "test9", label: "test9", tipo: "number", val: "" },
  //   { id: "test10", label: "test10", tipo: "number", val: "" },
  //   { id: "test11", label: "test11", tipo: "number", val: "" },
  //   { id: "test12", label: "test12", tipo: "number", val: "" },
  // ]);

  return (
    <Box m={0} p={0}>
      <TablaComponent
        encabezado={header}
        datos={paises}
        id="cod_empresa"
        titulo="EMPRESAS"
        /* multipleSelect */ camposTotales={header.map((i) => i.name)}
        mostrarTotales
        onFilaSeleccionada={setPaisSeleccionado}
        botonesAHabilitar={{
          canAdd: false,
          canView: true,
          canGo: false,
          canCopy: false,
          canPaste: false,
          canAuth: false,
          canEdit: false,
          canExcel: false,
          canPdf: false,
          canDownload: false,
          canDelete: false,
        }}
      />
      <pre>{JSON.stringify(paisSeleccionado, null, 2)}</pre>

      <FormularioComponent
        inputs={inputs}
        onInput={({ id, val }) => {
          setValores((inp) => ({ ...inp, [id]: val }));
        }}
      />
      <pre>{JSON.stringify(valores, null, 2)}</pre>
      <pre>{JSON.stringify(inputs, null, 2)}</pre>
    </Box>
  );
};

PaisCrud.propTypes = {};

export default PaisCrud;
