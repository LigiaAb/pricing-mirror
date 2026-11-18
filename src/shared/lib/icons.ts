import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Barcode,
  Briefcase,
  Bug,
  Building,
  Bus,
  Calculator,
  Calendar,
  CalendarCheck,
  CalendarIcon,
  Car,
  CarFront,
  Check,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Circle,
  ClipboardList,
  ClipboardPaste,
  Clock,
  CloudDownload,
  Code2,
  Copy,
  Download,
  Edit,
  Edit2,
  Eye,
  File,
  FileDown,
  FileSpreadsheet,
  FileText,
  FileWarning,
  Folder,
  Grid,
  Hash,
  HelpCircle,
  Home,
  IdCard,
  Info,
  Landmark,
  Link,
  ListChecks,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Minus,
  Moon,
  MoreHorizontal,
  NotebookText,
  Package,
  Paintbrush,
  Palette,
  PanelLeft,
  Pencil,
  Phone,
  Plane,
  Plus,
  PlusCircle,
  Receipt,
  RefreshCcw,
  RefreshCw,
  Save,
  Scale,
  Search,
  Send,
  Server,
  Settings,
  ShieldAlert,
  Ship,
  Sparkles,
  Sun,
  Tag,
  Terminal,
  Trash2,
  Truck,
  Upload,
  User,
  Users,
  Video,
  Wallet,
  Warehouse,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";
import type { FieldOption } from "@/shared/components/form/types";

export type IconComponent = LucideIcon;

export const Icons = {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Barcode,
  Briefcase,
  Bug,
  Building,
  Bus,
  Calculator,
  Calendar,
  CalendarCheck,
  CalendarIcon,
  Car,
  CarFront,
  Check,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Circle,
  ClipboardList,
  ClipboardPaste,
  Clock,
  CloudDownload,
  Code2,
  Copy,
  Download,
  Edit,
  Edit2,
  Eye,
  File,
  FileDown,
  FileSpreadsheet,
  FileText,
  FileWarning,
  Folder,
  Grid,
  Hash,
  HelpCircle,
  Home,
  IdCard,
  Info,
  Landmark,
  Link,
  ListChecks,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Minus,
  Moon,
  MoreHorizontal,
  NotebookText,
  Package,
  Paintbrush,
  Palette,
  PanelLeft,
  Pencil,
  Phone,
  Plane,
  Plus,
  PlusCircle,
  Receipt,
  RefreshCcw,
  RefreshCw,
  Save,
  Scale,
  Search,
  Send,
  Server,
  Settings,
  ShieldAlert,
  Ship,
  Sparkles,
  Sun,
  Tag,
  Terminal,
  Trash2,
  Truck,
  Upload,
  User,
  Users,
  Video,
  Wallet,
  Warehouse,
  Wifi,
  WifiOff,
  X,
  XCircle,
} as const satisfies Record<string, LucideIcon>;

function toKebabCase(str: string): string {
  return str
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replaceAll(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

export const iconMap: Record<string, LucideIcon> = {
  "c-a": FileText,
  "c-actualizar": RefreshCw,
  "c-archivo": File,
  "c-asignacion": ListChecks,
  "c-avion": Plane,
  "c-banco": Landmark,
  "c-barco": Ship,
  "c-bienes": Package,
  "c-billetera": Wallet,
  "c-bodega": Warehouse,
  "c-bolsa-dinero": Wallet,
  "c-buscar-mapa": MapPin,
  "c-calculadora": Calculator,
  "c-calendario": Calendar,
  "c-calendario-actividad": CalendarCheck,
  "c-calendario-agenda": Calendar,
  "c-camion": Truck,
  "c-cancelar": XCircle,
  "c-cargar": Upload,
  "c-carpeta": Folder,
  "c-carpetas": Folder,
  "c-carro": Car,
  "c-chat": MessageSquare,
  "c-check": CheckCircle2,
  "c-cheque": CheckCircle,
  "c-circulo-cheque": CheckCircle,
  "c-cliente": User,
  "c-codigo-barras": Barcode,
  "c-configuracion": Settings,
  "c-copiar": Copy,
  "c-cuaderno": NotebookText,
  "c-cuadrado-cheque": CheckSquare,
  "c-documento": File,
  "c-documento-obligatorio": FileWarning,
  "c-documentos": FileText,
  "c-eliminar": Trash2,
  "c-empresa": Building,
  "c-entregar": Truck,
  "c-enviar": Send,
  "c-estadisticas": BarChart3,
  "c-estrella": Sparkles,
  "c-excel": FileSpreadsheet,
  "c-factura": Receipt,
  "c-grua": Truck,
  "c-grupo": Users,
  "c-guardar": Save,
  "c-home": Home,
  "c-id": IdCard,
  "c-kanban": Grid,
  "c-lapiz": Pencil,
  "c-link-roto": Link,
  "c-lista": ListChecks,
  "c-lista-checkbox": CheckSquare,
  "c-logistica": Truck,
  "c-lupa": Search,
  "c-mail": Mail,
  "c-mapa": MapPin,
  "c-mapa-ubicacion": MapPin,
  "c-memos": NotebookText,
  "c-menu": Menu,
  "c-modulo": Grid,
  "c-numeros": Hash,
  "c-pdf": FileText,
  "c-pegar": ClipboardPaste,
  "c-perfil-usuario": User,
  "c-proceedor": Building,
  "c-puerto-derecha": Ship,
  "c-puerto-izquierda": Ship,
  "c-puesto": Briefcase,
  "c-radio-button": Circle,
  "c-recursos-humanos": Users,
  "c-reloj": Clock,
  "c-reportes": BarChart3,
  "c-restar": Minus,
  "c-rol": ShieldAlert,
  "c-suma": Plus,
  "c-tarifa": Tag,
  "c-telefono": Phone,
  "c-usuario": User,
  "c-ver": Eye,
  "c-video-llamada": Video,
  "c-x1": X,
  cuaderno: NotebookText,
};

function nameToIconKey(name: string): string {
  const clean = name
    .replace(/^cropa-/i, "")
    .replace(/^c-/i, "")
    .trim();

  return toPascalCase(clean);
}

export function getIconForName(name: string): LucideIcon {
  const key = nameToIconKey(name);
  const pascalKey = toPascalCase(key);

  if (iconMap[name]) return iconMap[name];
  if (iconMap[`c-${key.toLowerCase()}`]) return iconMap[`c-${key.toLowerCase()}`] as LucideIcon;

  const iconsRecord = Icons as Record<string, LucideIcon | undefined>;
  const lucideIcon = iconsRecord[pascalKey];
  if (lucideIcon) return lucideIcon;

  const lowerKey = key.toLowerCase();
  const match = Object.keys(Icons).find(
    (k) => k.toLowerCase() === lowerKey || toKebabCase(k) === lowerKey,
  );
  if (match) return iconsRecord[match] ?? FileText;

  return FileText;
}

/**
 * Opciones de ícono para el combobox de `ico_modulo`/`ico_cat`/`ico_opcion`/
 * `ico_menu`/`ico_accion` (accesos §2.1). Si `valorActual` no está en
 * `iconMap` ni en `Icons` se antepone como opción propia: de los 80 valores
 * de ícono en producción, 52 no están catalogados (§7.3 del plan de accesos)
 * y el combobox no puede perder ese valor en un guardado sin tocarlo.
 */
export function opcionesDeIcono(valorActual?: string): FieldOption[] {
  const iconsRecord = Icons as Record<string, LucideIcon>;
  const deLucide: FieldOption[] = Object.keys(iconsRecord)
    .sort((a, b) => a.localeCompare(b))
    .map((clave) => ({
      value: clave,
      label: toKebabCase(clave),
      icon: iconsRecord[clave],
    }));

  const catalogadas: FieldOption[] = [
    ...Object.keys(iconMap)
      .sort((a, b) => a.localeCompare(b))
      .map((clave) => ({
        value: clave,
        label: clave,
        icon: iconMap[clave],
      })),
    ...deLucide,
  ];

  if (!valorActual || iconMap[valorActual] || iconsRecord[valorActual]) return catalogadas;

  return [
    {
      value: valorActual,
      label: `${valorActual} (sin ícono en el catálogo)`,
      icon: FileText,
    },
    ...catalogadas,
  ];
}
