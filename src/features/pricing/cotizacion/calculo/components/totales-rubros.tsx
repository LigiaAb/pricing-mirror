"use client";

import React from "react";

import type { useTotalesRubros } from "../hooks/use-totales-rubros";
import {
  construirDetalleMetodo,
  getMetodo,
  type MetodoTotal,
  type RubroTotal,
} from "../lib/totales-rubros";
import { shortCell, ValorMoneda } from "./utils";

type TotalesRubrosController = ReturnType<typeof useTotalesRubros>;

type Props = {
  controller: TotalesRubrosController;
  lectura?: boolean;
};

function NombreServicio({
  nombre,
  proveedor,
}: {
  nombre?: string | null | undefined;
  proveedor?: string | null | undefined;
}) {
  return (
    <div>
      <div className="font-medium break-normal">{nombre ?? ""}</div>

      {proveedor ? (
        <div className="text-xs text-muted-foreground">{shortCell({ value: proveedor })}</div>
      ) : null}
    </div>
  );
}

function DetalleMetodo({ metodo }: { metodo?: MetodoTotal | null | undefined }) {
  const detalle = construirDetalleMetodo(metodo);

  if (!detalle) {
    return <span className="text-muted-foreground">—</span>;
  }

  return <span className="text-sm">{detalle}</span>;
}

function Encabezado({
  children,
  invertido = false,
}: {
  children: React.ReactNode;
  invertido?: boolean;
}) {
  return (
    <div
      className={
        invertido
          ? "flex items-center gap-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
          : "flex items-center gap-4 rounded-md border border-primary px-4 py-2 text-primary"
      }
    >
      <span className="text-lg font-semibold tracking-[0.2em]">{children}</span>

      <div className={invertido ? "h-px grow bg-primary-foreground" : "h-px grow bg-primary"} />
    </div>
  );
}

export function TotalesRubros({ controller, lectura = false }: Props) {
  const {
    listaElementos,
    elementosAgrupados,
    totalPorMoneda,

    letraTipoPagoDefault,
    mostrarTipoPago,

    gruposIngresadosSegunRubro,
    nombresGrupo,
    tipoPagoSeleccionado,

    cambiarGrupo,
    cambiarNombreGrupo,
    cambiarTipoPago,
  } = controller;

  /*
   * =========================================================
   * MONEDA
   * =========================================================
   *
   * El controller ya calculó los totales por moneda usando el
   * mismo catálogo recibido por useTotalesRubros. Para la UI no
   * hace falta volver a consultar el catálogo de monedas.
   */
  const getSimboloMoneda = React.useCallback(
    (item: RubroTotal) => {
      const metodo = getMetodo(item);

      const codMoneda = metodo?.cod_moneda_venta ?? 2;

      const moneda = totalPorMoneda[String(codMoneda)]?.moneda;

      return moneda?.simbolo_moneda ?? moneda?.SIMBOLO_MONEDA ?? "";
    },
    [totalPorMoneda],
  );

  /*
   * =========================================================
   * NOMBRE DE GRUPO
   * =========================================================
   */
  const getNombreGrupo = React.useCallback(
    (idDeGrupo: number) => {
      const idKey = String(idDeGrupo);

      const tieneNombreEscrito = Object.hasOwn(nombresGrupo, idKey);

      if (tieneNombreEscrito) {
        return nombresGrupo[idKey] ?? "";
      }

      const rubroDelGrupo = listaElementos.find(
        (item) => String(gruposIngresadosSegunRubro[String(item.value ?? "")]?.idDeGrupo) === idKey,
      );

      const nombreAutomatico = rubroDelGrupo
        ? gruposIngresadosSegunRubro[String(rubroDelGrupo.value ?? "")]?.nombre
        : "";

      const nombreRubro = rubroDelGrupo?.servicio?.nombre ?? rubroDelGrupo?.nombre ?? "";

      return nombreAutomatico || nombreRubro || "";
    },
    [nombresGrupo, listaElementos, gruposIngresadosSegunRubro],
  );

  return (
    <div className="space-y-8">
      {/* =====================================================
          TOTAL
      ====================================================== */}

      <section className="space-y-3">
        <Encabezado invertido>TOTAL</Encabezado>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="w-[70px] px-3 py-2 text-left">Grupo</th>

                <th className="w-[180px] px-3 py-2 text-left">
                  {mostrarTipoPago ? "Prepaid / Collect" : ""}
                </th>

                <th className="px-3 py-2 text-left">Servicio</th>

                <th className="w-[150px] px-3 py-2 text-right">Venta</th>

                <th className="px-3 py-2 text-left">Detalle</th>
              </tr>
            </thead>

            <tbody>
              {listaElementos.map((item) => {
                const id = String(item.value ?? "");

                const metodo = getMetodo(item as RubroTotal);

                const simbolo = getSimboloMoneda(item as RubroTotal);

                return (
                  <tr key={id} className="border-b last:border-b-0">
                    {/* GRUPO */}

                    <td className="px-3 py-2 align-top">
                      {lectura ? (
                        (gruposIngresadosSegunRubro[id]?.idDeGrupo ?? "")
                      ) : (
                        <input
                          value={gruposIngresadosSegunRubro[id]?.idDeGrupo ?? ""}
                          inputMode="numeric"
                          onChange={(event) => cambiarGrupo(id, event.target.value)}
                          className="h-8 w-14 rounded-md border bg-transparent px-2 text-center outline-none focus:border-primary"
                        />
                      )}
                    </td>

                    {/* P / C */}

                    <td className="px-3 py-2 align-top">
                      {!lectura && mostrarTipoPago ? (
                        <div className="flex gap-3">
                          <label className="flex cursor-pointer items-center gap-1">
                            <input
                              type="radio"
                              name={`tipo_pago_${id}`}
                              value="P"
                              checked={(tipoPagoSeleccionado[id] ?? letraTipoPagoDefault) === "P"}
                              onChange={() => cambiarTipoPago(id, "P")}
                            />

                            <span>Prepaid</span>
                          </label>

                          <label className="flex cursor-pointer items-center gap-1">
                            <input
                              type="radio"
                              name={`tipo_pago_${id}`}
                              value="C"
                              checked={(tipoPagoSeleccionado[id] ?? letraTipoPagoDefault) === "C"}
                              onChange={() => cambiarTipoPago(id, "C")}
                            />

                            <span>Collect</span>
                          </label>
                        </div>
                      ) : null}
                    </td>

                    {/* SERVICIO */}

                    <td className="px-3 py-2 align-top">
                      <NombreServicio
                        nombre={item.servicio?.nombre}
                        proveedor={item.servicio?.entidad_nombre}
                      />
                    </td>

                    {/* VENTA */}

                    <td className="px-3 py-2 text-right align-top">
                      {metodo?.venta ? <ValorMoneda simbolo={simbolo} valor={metodo.venta} /> : "—"}
                    </td>

                    {/* DETALLE */}

                    <td className="px-3 py-2 align-top">
                      <DetalleMetodo metodo={metodo} />
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              {Object.entries(totalPorMoneda).map(([codMoneda, total]) => (
                <tr key={`subtotal-${codMoneda}`} className="border-t-2">
                  <td />
                  <td />

                  <td className="px-3 py-2 font-semibold">SUB TOTAL</td>

                  <td className="px-3 py-2 text-right">
                    <ValorMoneda
                      total
                      simbolo={total.moneda.simbolo_moneda ?? total.moneda.SIMBOLO_MONEDA}
                      valor={total.total}
                    />
                  </td>

                  <td className="px-3 py-2 text-muted-foreground">Sin IVA</td>
                </tr>
              ))}
            </tfoot>
          </table>
        </div>
      </section>

      {/* =====================================================
          TOTAL AGRUPADO
      ====================================================== */}

      <section className="space-y-3">
        <Encabezado>TOTAL AGRUPADO</Encabezado>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="w-[70px] px-3 py-2 text-left">Grupo</th>

                <th className="w-[130px] px-3 py-2 text-center">P / C</th>

                <th className="px-3 py-2 text-left">Nombre</th>

                <th className="w-[150px] px-3 py-2 text-right">Venta</th>

                <th className="px-3 py-2 text-left">Detalle</th>
              </tr>
            </thead>

            <tbody>
              {elementosAgrupados.map((item) => {
                const metodo = getMetodo(item);

                const simbolo = getSimboloMoneda(item);

                /*
                 * ==========================
                 * FILA DE GRUPO
                 * ==========================
                 */

                if (item.__tipo === "GRUPO" && item.__idDeGrupo) {
                  const idGrupo = item.__idDeGrupo;

                  const nombre = getNombreGrupo(idGrupo);

                  return (
                    <tr key={String(item.value)} className="border-b last:border-b-0">
                      <td className="px-3 py-2">{idGrupo}</td>

                      <td className="px-3 py-2 text-center">{item.letra_tipo_pago ?? ""}</td>

                      <td className="px-3 py-2">
                        {lectura ? (
                          <span className="font-medium break-normal">{nombre}</span>
                        ) : (
                          <input
                            value={nombre}
                            placeholder="Nombre grupo"
                            onChange={(event) => cambiarNombreGrupo(idGrupo, event.target.value)}
                            className="h-8 w-full max-w-xs rounded-md border bg-transparent px-2 outline-none focus:border-primary"
                          />
                        )}
                      </td>

                      <td className="px-3 py-2 text-right">
                        <ValorMoneda simbolo={simbolo} valor={metodo?.venta ?? 0} />
                      </td>

                      <td className="px-3 py-2">
                        <DetalleMetodo metodo={metodo} />
                      </td>
                    </tr>
                  );
                }

                /*
                 * ==========================
                 * RUBRO SIN GRUPO
                 * ==========================
                 */

                const id = String(item.value ?? "");

                return (
                  <tr key={`agr-${id}`} className="border-b last:border-b-0">
                    <td className="px-3 py-2">{gruposIngresadosSegunRubro[id]?.idDeGrupo ?? ""}</td>

                    <td className="px-3 py-2 text-center">
                      {tipoPagoSeleccionado[id] ?? item.letra_tipo_pago ?? letraTipoPagoDefault}
                    </td>

                    <td className="px-3 py-2">
                      <NombreServicio
                        nombre={item.servicio?.nombre}
                        proveedor={item.servicio?.entidad_nombre}
                      />
                    </td>

                    <td className="px-3 py-2 text-right">
                      {metodo?.venta ? <ValorMoneda simbolo={simbolo} valor={metodo.venta} /> : "—"}
                    </td>

                    <td className="px-3 py-2">
                      <DetalleMetodo metodo={metodo} />
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              {Object.entries(totalPorMoneda).flatMap(([codMoneda, total]) => {
                const simbolo = total.moneda.simbolo_moneda ?? total.moneda.SIMBOLO_MONEDA;

                return [
                  <tr key={`agr-subtotal-${codMoneda}`} className="border-t-2">
                    <td />
                    <td />

                    <td className="px-3 py-2 font-semibold">SUB TOTAL</td>

                    <td className="px-3 py-2 text-right">
                      <ValorMoneda total simbolo={simbolo} valor={total.total} />
                    </td>

                    <td className="px-3 py-2 text-muted-foreground">Sin IVA</td>
                  </tr>,

                  <tr key={`agr-iva-${codMoneda}`}>
                    <td />
                    <td />

                    <td className="px-3 py-2 font-semibold">IVA</td>

                    <td className="px-3 py-2 text-right">
                      <ValorMoneda total simbolo={simbolo} valor={total.iva} />
                    </td>

                    <td className="px-3 py-2 text-muted-foreground">IVA: 12%</td>
                  </tr>,

                  <tr key={`agr-total-${codMoneda}`} className="border-t-4">
                    <td />
                    <td />

                    <td className="px-3 py-2 text-base font-bold">TOTAL</td>

                    <td className="px-3 py-2 text-right">
                      <ValorMoneda total simbolo={simbolo} valor={total.totalConIVA} />
                    </td>

                    <td className="px-3 py-2 text-muted-foreground">Con IVA</td>
                  </tr>,
                ];
              })}
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
