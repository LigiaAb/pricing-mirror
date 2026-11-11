/* STUB del repo espejo: solo tipos para verificar pricing. NO copiar al proyecto real. */
type Config = { params?: Record<string, unknown> | undefined; [key: string]: unknown };
export declare const http: {
  get<T = unknown>(url: string, config?: Config): Promise<T>;
  post<T = unknown>(url: string, body?: unknown, config?: Config): Promise<T>;
  put<T = unknown>(url: string, body?: unknown, config?: Config): Promise<T>;
  delete<T = unknown>(url: string, config?: Config): Promise<T>;
};
