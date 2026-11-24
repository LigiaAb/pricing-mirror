import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import BotonComponent from "../Boton/BotonComponent";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";


const TablaDetallesComponent = (props) => {
  const { titulo, columnas, data, datos, id = "id", height = 200, usarPaginacion = false, filasPorPagina = 10, mostrar_id = true, descargar = false, filename } = props;

  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);

  const filas = useMemo(() => data || datos || [], [data, datos]);

  // Estado para manejar la página y el número de elementos por página
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(filasPorPagina);

  // Cálculo de elementos a mostrar según la página y la cantidad de filas
  const paginatedItems = useMemo(() => (usarPaginacion ? filas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : filas), [filas, page, rowsPerPage, usarPaginacion]);

  // Manejadores para el cambio de página y número de filas por página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reinicia a la primera página
  };

  // const handleDownload = () => {
  //   console.log(titulo, columnas, filas )
  // }

const handleDownload = async () => {
  // const filename = "export.xlsx"`
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Datos");

  let dataStartRow = 1;

  if (titulo) {
    worksheet.addRow([titulo]);
    worksheet.mergeCells(1, 1, 1, columnas.length);
    const titleCell = worksheet.getCell("A1");
    titleCell.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3864" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.border = {
      top:    { style: "thin", color: { argb: "FFBFBFBF" } },
      bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
      left:   { style: "thin", color: { argb: "FFBFBFBF" } },
      right:  { style: "thin", color: { argb: "FFBFBFBF" } },
    };
    worksheet.getRow(1).height = 28;
    dataStartRow = 2;
  }

  const headers = columnas.map((col) => col.label);
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F3864" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top:    { style: "thin", color: { argb: "FFBFBFBF" } },
      bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
      left:   { style: "thin", color: { argb: "FFBFBFBF" } },
      right:  { style: "thin", color: { argb: "FFBFBFBF" } },
    };
  });
  headerRow.height = 20;

  filas.forEach((row, rowIndex) => {
    const values = columnas.map((col) => row[col.column] ?? "");
    const dataRow = worksheet.addRow(values);
    const isEven = rowIndex % 2 === 0;
    dataRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isEven ? "FFFFFFFF" : "FFF2F2F2" },
      };
      cell.border = {
        top:    { style: "thin", color: { argb: "FFBFBFBF" } },
        bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
        left:   { style: "thin", color: { argb: "FFBFBFBF" } },
        right:  { style: "thin", color: { argb: "FFBFBFBF" } },
      };
    });
  });

  // Column widths based on header length (min 20)
  worksheet.columns.forEach((column, index) => {
    const headerLength = headers[index]?.length ?? 0;
    column.width = Math.max(headerLength, 20);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${filename || `logs_${new Date().toISOString()}`}.xlsx`);
}


  return (
    <>
      <Grid container direction="row" alignItems="center" width="100%" color={`primary.${opositeMode}`} bgcolor="background.main_10" fontWeight="bold">
        <Grid sx={{ p: 0 }} size={4} />
        <Grid sx={{ p: 0.1, textAlign: "center" }} size={4}>
          {titulo}
        </Grid>
        <Grid sx={{ p: 0, textAlign: "right" }} size={4}>
          {
            !!descargar &&
            <Button variant="outlined" size="small" onClick={handleDownload}>
              Descargar
            </Button>
          }
        </Grid>
      </Grid>

      <Paper sx={{ width: "100%", overflow: "hidden", bgcolor: "transparent !important" }}>
        <TableContainer className={usarPaginacion ? "" : "scroll"} sx={{ maxHeight: usarPaginacion ? undefined : height, bgcolor: "transparent !important" }}>
          <Table size="small" stickyHeader aria-label="sticky a dense table" sx={{ bgcolor: "transparent !important" }}>
            <TableHead sx={{ bgcolor: "transparent !important" }}>
              <TableRow sx={{ bgcolor: "transparent !important" }}>
                {mostrar_id && <TableCell sx={{ textAlign: "center", bgcolor: `primary.main`, color: "white.400", fontWeight: "bolder", m: 0, p: 0, px: 1 }}></TableCell>}
                {columnas?.map((i) => (
                  <TableCell key={i.id} sx={{ textAlign: "center", bgcolor: `primary.main`, color: "white.400", fontWeight: "bolder", m: 0, p: 0, px: 1 }}>
                    {i.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody sx={{ bgcolor: "transparent !important" }}>
              {paginatedItems.map((fila, ind) => (
                <TableRow
                  hover
                  key={typeof id === "function" ? id(fila) : fila[id]}
                  sx={{
                    backdropFilter: "blur(2px)",
                    bgcolor: (ind + 1) % 2 === 0 ? "background.main_20" : "background.200_20",
                    "&:last-child td, &:last-child th": { border: 0 },
                  }}
                >
                  {mostrar_id && (
                    <TableCell sx={{ m: 0, p: 0.2 }}>
                      <Typography color="grey" sx={{ my: "auto", fontSize: 10, textAlign: "center" }}>
                        {typeof id === "function" ? id(fila) : fila[id]}
                      </Typography>
                    </TableCell>
                  )}
                  {columnas?.map((col) => (
                    <TableCell key={`col_${col.id || col.column}`} sx={{ m: 0, p: 0.2, px: 1, textAlign: col.align, color: col.color, ...col.sx }}>
                      <Typography sx={{ my: "auto", fontWeight: col.color ? "bold" : undefined }} component={col.pre ? "pre" : undefined}>
                        {fila[col.column]}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {usarPaginacion && (
        <Grid container width="100%">
          <Grid size="grow"></Grid>
          <TablePagination
            sx={{ "& *": { m: 0, p: 0, fontSize: `inherit`, "&.MuiSvgIcon-root": { fontSize: "1.5rem" } } }}
            component="div"
            count={filas.length} // Número total de elementos
            page={page}
            showFirstButton
            showLastButton
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Elementos por página"
            rowsPerPageOptions={[5, 10, 25, { value: -1, label: "Todos" }]} // Opciones para cambiar el número de filas
          />
        </Grid>
      )}
    </>
  );
};

TablaDetallesComponent.propTypes = {
  height: PropTypes.number,
  titulo: PropTypes.string,
  columnas: PropTypes.array,
  data: PropTypes.array,
  datos: PropTypes.array,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.func]),
  usarPaginacion: PropTypes.bool,
  mostrar_id: PropTypes.bool,
  buscar: PropTypes.bool,
  filasPorPagina: PropTypes.number,
};

export default TablaDetallesComponent;
