"use client";

import {
  Building2,
  CalendarDays,
  ClipboardList,
  type LucideIcon,
  Mail,
  Package,
  Pencil,
  Phone,
  Plane,
  Receipt,
  UserRound,
} from "lucide-react";
import type * as React from "react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { EncabezadoPaso, SoloConsulta } from "../../../shared/components/utils";
import {
  CAMPOS_DETALLES,
  CAMPOS_FECHAS,
  CAMPOS_RUTA,
  type CampoEmbarque,
} from "../../../shared/lib/campos-embarque";
import type { EmbarqueMaqueta, ValoresEmbarque } from "../../../shared/lib/tipos";
import { informacionMaqueta } from "../../lib/datos-maqueta";

/**
 * Detalle completo del embarque (el resumen breve está siempre visible arriba).
 * Una card por sección del módulo actual (Shipper, Consignatario, Facturación,
 * Detalles, Rutas, Fechas y Producto); cada card junta varios datos en pocas
 * líneas para leerlos de un vistazo. Los datos son los campos del módulo actual
 * (`shared/lib/campos-embarque.ts`, por `key`).
 * La ven todos los perfiles; solo Operaciones la edita (`editable`).
 */
export function PasoInformacion({
  embarque,
  editable = false,
}: {
  embarque: EmbarqueMaqueta;
  editable?: boolean | undefined;
}) {
  const info = informacionMaqueta(embarque);

  return (
    <div className="space-y-4">
      <EncabezadoPaso
        titulo="Información del embarque"
        descripcion="Partes, detalles, ruta, fechas y carga."
        acciones={
          editable ? (
            <Button type="button" size="sm" variant="outline" disabled>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Button>
          ) : (
            <SoloConsulta />
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CardEntidad titulo="Shipper" icono={Building2} valores={info.shipper} />
        <CardEntidad titulo="Consignatario" icono={UserRound} valores={info.consignatario} />
        <CardFacturacion valores={info.facturacion} />
        <CardDetalles valores={info.detalles} />
        <CardRutas rutas={info.rutas} />
        <CardFechas recoleccion={info.fechaRecoleccion} fechas={info.fechas} />
        <CardProducto cargas={info.cargas} className="md:col-span-full" />
      </div>
    </div>
  );
}

/* ==========================================================================
 * CARDS (una por sección del módulo actual)
 * ========================================================================== */

/** Shipper y Consignatario (mismos campos: `camposEntidad`). */
function CardEntidad({
  titulo,
  icono,
  valores,
}: {
  titulo: string;
  icono: LucideIcon;
  valores: ValoresEmbarque;
}) {
  return (
    <CardInfo titulo={titulo} icono={icono}>
      <Principal
        texto={texto(valores, "entidad_nombre")}
        detalle={unir([
          prefijo("NIT", texto(valores, "entidad_nit")),
          texto(valores, "entidad_industria"),
          texto(valores, "entidad_pais"),
        ])}
      />
      <Datos>
        <Fila label="Dirección">
          {texto(valores, "direccion_recoleccion") ?? VACIO}
          <Secundario
            texto={unir([
              texto(valores, "direccion_recoleccion_muni"),
              texto(valores, "direccion_recoleccion_depto"),
              texto(valores, "direccion_recoleccion_ciudad"),
              texto(valores, "direccion_recoleccion_pais"),
            ])}
          />
        </Fila>
        <Fila label="Contacto">
          <Contacto
            nombre={texto(valores, "entidad_contacto_nombre")}
            tipos={lista(valores, "_contacto_tipo_list")}
            email={texto(valores, "entidad_contacto_email")}
            telefono={texto(valores, "entidad_contacto_telefono")}
          />
        </Fila>
      </Datos>
    </CardInfo>
  );
}

/** Cliente que factura (siempre de consulta: refleja el maestro del cliente). */
function CardFacturacion({ valores }: { valores: ValoresEmbarque }) {
  return (
    <CardInfo titulo="Facturación" icono={Receipt}>
      <Principal
        texto={texto(valores, "cliente")}
        detalle={prefijo("NIT", texto(valores, "numero"))}
      />
      <Datos>
        <Fila label="Dirección fiscal">{texto(valores, "direccionFiscal") ?? VACIO}</Fila>
        <Fila label="Contacto">
          <Contacto
            nombre={texto(valores, "clienteContacto")}
            email={texto(valores, "clienteContactoEmail")}
            telefono={texto(valores, "clienteContactoTelefono")}
          />
        </Fila>
      </Datos>
    </CardInfo>
  );
}

/** Condiciones del embarque: pago, carga, servicio y documentos. */
function CardDetalles({ valores }: { valores: ValoresEmbarque }) {
  const peligrosidad = lista(valores, "peligrosidad");
  const documentos = lista(valores, "documentosCropa");
  const instrucciones = texto(valores, "instruccionesManejo");
  return (
    <CardInfo titulo="Detalles" icono={ClipboardList}>
      <Datos>
        <Fila label="Pago / Incoterm">
          {unir([texto(valores, "tipoPago"), texto(valores, "incoterm")]) ?? VACIO}
        </Fila>
        <Fila label="Servicio">{texto(valores, "servicio") ?? VACIO}</Fila>
        <Fila label="Carga">
          {unir([texto(valores, "tipoCarga"), texto(valores, "clasificacionCarga")]) ?? VACIO}
        </Fila>
        <Fila label={etiqueta(CAMPOS_DETALLES, "documentosCropa")}>
          <Etiquetas valores={documentos} />
        </Fila>
        {peligrosidad.length > 0 ? (
          <Fila label={etiqueta(CAMPOS_DETALLES, "peligrosidad")}>
            <Etiquetas valores={peligrosidad} aviso />
          </Fila>
        ) : null}
      </Datos>
      {instrucciones ? <Nota titulo="Instrucciones de manejo" texto={instrucciones} /> : null}
    </CardInfo>
  );
}

/** Cada tramo: origen → destino, aerolínea y vuelo. */
function CardRutas({ rutas }: { rutas: readonly ValoresEmbarque[] }) {
  return (
    <CardInfo titulo="Rutas" icono={Plane} meta={cantidad(rutas.length, "tramo", "tramos")}>
      {rutas.length === 0 ? (
        <SinDatos texto="Sin rutas registradas." />
      ) : (
        <ul className="divide-y">
          {rutas.map((ruta, indice) => (
            <li key={claveFila(ruta, ["puertoIdOrigen", "puertoIdDestino"])} className="py-2">
              <p className="flex flex-wrap items-center gap-1 text-sm font-semibold">
                {rutas.length > 1 ? <Numero valor={indice + 1} /> : null}
                {texto(ruta, "puertoIdOrigen") ?? VACIO}
                <span className="text-muted-foreground" aria-hidden="true">
                  →
                </span>
                {texto(ruta, "puertoIdDestino") ?? VACIO}
              </p>
              <Secundario
                texto={unir([
                  unir([texto(ruta, "codPaisOrigen"), texto(ruta, "codPaisDestino")], " → "),
                  texto(ruta, "codEntidadProv"),
                  prefijo(etiqueta(CAMPOS_RUTA, "flightNumber"), texto(ruta, "flightNumber")),
                ])}
              />
            </li>
          ))}
        </ul>
      )}
    </CardInfo>
  );
}

/** Recolección y fechas de movimiento (tipo de fecha, fecha y observación). */
function CardFechas({
  recoleccion,
  fechas,
}: {
  recoleccion: ValoresEmbarque;
  fechas: readonly ValoresEmbarque[];
}) {
  return (
    <CardInfo titulo="Fechas" icono={CalendarDays}>
      <Datos>
        <Fila label="Recolección">{texto(recoleccion, "fecha_recoleccion") ?? VACIO}</Fila>
        {fechas.map((fecha) => (
          <Fila
            key={claveFila(fecha, ["id_tipo_fecha", "fecha"])}
            label={texto(fecha, "id_tipo_fecha") ?? etiqueta(CAMPOS_FECHAS, "fecha")}
          >
            {texto(fecha, "fecha") ?? VACIO}
            <Secundario texto={texto(fecha, "observacion")} />
          </Fila>
        ))}
      </Datos>
    </CardInfo>
  );
}

/** Cada carga en una fila (descripción, bultos, peso, medidas, valor y partida) y totales. */
function CardProducto({
  cargas,
  className,
}: {
  cargas: readonly ValoresEmbarque[];
  className?: string | undefined;
}) {
  const bultos = sumar(cargas, "cantidad");
  const peso = sumar(cargas, "pesoTotal");
  return (
    <CardInfo
      titulo="Producto"
      icono={Package}
      className={className}
      meta={unir([
        cantidad(cargas.length, "carga", "cargas"),
        cantidad(bultos, "bulto", "bultos"),
        `${peso.toLocaleString("es-GT", { minimumFractionDigits: 2 })} kg`,
      ])}
    >
      {cargas.length === 0 ? (
        <SinDatos texto="Sin cargas registradas." />
      ) : (
        <ul className="divide-y">
          {cargas.map((carga, indice) => (
            <li
              key={claveFila(carga, ["descripcion", "partidaArancelaria"])}
              className="grid gap-x-4 gap-y-1 py-2 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-sm font-semibold">
                  {cargas.length > 1 ? <Numero valor={indice + 1} /> : null}
                  <span className="truncate">{texto(carga, "descripcion") ?? VACIO}</span>
                </p>
                <Secundario
                  texto={unir([
                    cantidad(Number(texto(carga, "cantidad") ?? 0), "bulto", "bultos"),
                    sufijo(texto(carga, "pesoTotal"), "kg"),
                    medidas(carga),
                  ])}
                />
              </div>
              <div className="text-xs text-muted-foreground sm:text-right">
                <p className="text-sm font-semibold text-foreground">
                  {texto(carga, "valor") ?? VACIO}
                </p>
                {unir([
                  texto(carga, "paisOrigenId"),
                  prefijo("Partida", texto(carga, "partidaArancelaria")),
                ])}
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardInfo>
  );
}

/* ==========================================================================
 * PIEZAS DE LAS CARDS
 * ========================================================================== */

const VACIO = "—";

/** Card con encabezado (icono, título y dato resumen a la derecha). */
function CardInfo({
  titulo,
  icono: Icono,
  meta,
  className,
  children,
}: {
  titulo: string;
  icono: LucideIcon;
  meta?: string | undefined;
  className?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col overflow-hidden rounded-lg border bg-card", className)}>
      <header className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icono className="size-4" aria-hidden="true" />
        </span>
        <h4 className="flex-1 text-sm font-semibold">{titulo}</h4>
        {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
      </header>
      <div className="flex flex-1 flex-col gap-3 px-4 py-3">{children}</div>
    </section>
  );
}

/** Dato principal de la card (nombre) con su detalle debajo. */
function Principal({ texto, detalle }: { texto: string | undefined; detalle: string | undefined }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold" title={texto}>
        {texto ?? VACIO}
      </p>
      <Secundario texto={detalle} />
    </div>
  );
}

/** Lista etiqueta / valor en dos columnas. */
function Datos({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-[minmax(6rem,auto)_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
      {children}
    </dl>
  );
}

function Fila({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="pt-0.5 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}

/** Texto pequeño en gris (no se dibuja si no hay texto). */
function Secundario({ texto }: { texto: string | undefined }) {
  return texto ? <span className="block text-xs text-muted-foreground">{texto}</span> : null;
}

function Contacto({
  nombre,
  tipos = [],
  email,
  telefono,
}: {
  nombre: string | undefined;
  tipos?: readonly string[] | undefined;
  email: string | undefined;
  telefono: string | undefined;
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p>
        {nombre ?? VACIO}
        {tipos.length > 0 ? (
          <span className="text-xs text-muted-foreground"> · {tipos.join(", ")}</span>
        ) : null}
      </p>
      {email ? (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{email}</span>
        </p>
      ) : null}
      {telefono ? (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Phone className="size-3 shrink-0" aria-hidden="true" />
          {telefono}
        </p>
      ) : null}
    </div>
  );
}

/** Opciones marcadas (casillas) como etiquetas; `aviso` las resalta. */
function Etiquetas({ valores, aviso = false }: { valores: readonly string[]; aviso?: boolean }) {
  if (valores.length === 0) return <>{VACIO}</>;
  return (
    <span className="flex flex-wrap gap-1">
      {valores.map((valor) => (
        <span
          key={valor}
          className={cn(
            "rounded-full border px-2 py-0.5 text-[11px] font-medium",
            aviso
              ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
              : "bg-muted/60",
          )}
        >
          {valor}
        </span>
      ))}
    </span>
  );
}

/** Texto largo al pie de la card. */
function Nota({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2 text-xs">
      <span className="font-medium">{titulo}: </span>
      <span className="text-muted-foreground">{texto}</span>
    </div>
  );
}

function Numero({ valor }: { valor: number }) {
  return (
    <span className="rounded border px-1 font-mono text-[10px] text-muted-foreground">{valor}</span>
  );
}

function SinDatos({ texto }: { texto: string }) {
  return <p className="text-sm text-muted-foreground">{texto}</p>;
}

/* ==========================================================================
 * HELPERS
 * ========================================================================== */

/** Valor de texto (vacío → `undefined`; una lista se une con comas). */
function texto(valores: ValoresEmbarque, key: string): string | undefined {
  const valor = valores[key];
  const resultado = typeof valor === "string" ? valor : valor?.join(", ");
  return resultado?.trim() ? resultado : undefined;
}

function lista(valores: ValoresEmbarque, key: string): readonly string[] {
  const valor = valores[key];
  if (valor === undefined) return [];
  return typeof valor === "string" ? [valor] : valor;
}

/** Une las partes con valor; `undefined` si ninguna tiene. */
function unir(partes: readonly (string | undefined)[], separador = " · "): string | undefined {
  const conValor = partes.filter((parte): parte is string => Boolean(parte));
  return conValor.length > 0 ? conValor.join(separador) : undefined;
}

function prefijo(etiquetaDato: string, valor: string | undefined): string | undefined {
  return valor ? `${etiquetaDato} ${valor}` : undefined;
}

function sufijo(valor: string | undefined, unidad: string): string | undefined {
  return valor ? `${valor} ${unidad}` : undefined;
}

function cantidad(valor: number, singular: string, plural: string): string {
  return `${valor.toLocaleString("es-GT")} ${valor === 1 ? singular : plural}`;
}

/** Suma un dato numérico de una lista (acepta separador de miles). */
function sumar(filas: readonly ValoresEmbarque[], key: string): number {
  return filas.reduce((total, fila) => {
    const numero = Number((texto(fila, key) ?? "0").replace(/,/g, ""));
    return total + (Number.isFinite(numero) ? numero : 0);
  }, 0);
}

/** "L × A × An unidad" (solo si tiene alguna medida). */
function medidas(carga: ValoresEmbarque): string | undefined {
  const valores = (["largo", "alto", "ancho"] as const).map((key) => texto(carga, key) ?? "?");
  if (valores.every((valor) => valor === "?")) return undefined;
  return unir([valores.join(" × "), texto(carga, "unidadMedida")], " ");
}

/** Nombre del campo en `campos-embarque.ts` (definición única de etiquetas). */
function etiqueta(campos: readonly CampoEmbarque[], key: string): string {
  return campos.find((campo) => campo.key === key)?.label ?? key;
}

/** Clave estable de una fila de lista a partir de sus datos (no por índice). */
function claveFila(fila: ValoresEmbarque, keys: readonly string[]): string {
  return keys.map((key) => texto(fila, key) ?? "").join("|");
}
