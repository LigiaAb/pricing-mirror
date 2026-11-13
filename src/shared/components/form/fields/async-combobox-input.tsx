/* STUB del repo espejo: solo tipos para verificar pricing. NO copiar al proyecto real. */
/*
 * Props inferidas de los usos en pricing y del error reportado en el proyecto real:
 * `value` es `T | null` (NO acepta `undefined`) → usar `?? null` al pasarle valores opcionales.
 */
import type * as React from "react";

export type AsyncComboboxInputProps<T> = {
  id?: string;
  label?: React.ReactNode;
  value: T | null;
  onChange: (value: T | null) => void;
  fetchOptions: (search: string) => Promise<T[]>;
  initialOptions?: T[];
  getOptionValue: (option: T) => string | number;
  getOptionLabel: (option: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  minSearchLength?: number;
  fetchOnEmpty?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  contentClassName?: string;
};

export declare function AsyncComboboxInput<T>(
  props: Readonly<AsyncComboboxInputProps<T>>,
): React.JSX.Element;
