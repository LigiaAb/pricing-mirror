import { DataTable } from "@/shared/components/data-table/data-table";

const pasos = [
  { id: 1, descripcion: "TEXTO DE PASO" },
  { id: 2, descripcion: "TEXTO DE PASO" },
  { id: 3, descripcion: "TEXTO DE PASO" },
  { id: 4, descripcion: "TEXTO DE PASO" },
  { id: 5, descripcion: "TEXTO DE PASO" },
  { id: 6, descripcion: "TEXTO DE PASO" },
];

export const VistaGeneral = () => {
  const data: {}[] = [];
  return (
    <div className="flex flex-col w-full gap-4 p-4 shadow rounded-lg bg-card">
      <div className="p-2 rounded-lg shadow flex flex-col">{<DataTable columns={[]} data={data} />}</div>

      {/* <!-- 2. CUERPO PRINCIPAL: CSS GRID (Ideal para dividir áreas en 2 dimensiones) --> */}
      {/* <!-- flex-1 hace que esta sección crezca y empuje el footer hasta abajo --> */}
      <main className="max-h-[80vh] min-h-[80vh] h-dvh flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-auto">
        <div className="p-4 rounded-lg shadow flex flex-col items-center justify-between w-full col-span-full">
          <div className="w-full flex flex-col justify-start">Informacion general</div>
          <section className="w-full justify-between md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <div className="p-4 rounded-lg border-2 border-gray-500/10 flex items-start justify-center min-w-30 flex-col">
              <span className="text-sm">Codigo de File</span>
              <span>#000000</span>
            </div>
            <div className="p-4 rounded-lg border-2 border-gray-500/10 flex items-start justify-center min-w-30 flex-col">
              <span className="text-sm">Id</span>
              <span>0000</span>
            </div>
            <div className="p-4 rounded-lg border-2 border-gray-500/10 flex items-start justify-center min-w-30 flex-col">
              <span className="text-sm">Origen</span>
              <span>Guatemala</span>
            </div>
            <div className="p-4 rounded-lg border-2 border-gray-500/10 flex items-start justify-center min-w-30 flex-col">
              <span className="text-sm">Destino</span>
              <span>Guatemala</span>
            </div>
            <div className="p-4 rounded-lg border-2 border-gray-500/10 flex items-start justify-center min-w-30 flex-col">
              <span className="text-sm">Cliente</span>
              <span>CROPA DSV</span>
            </div>
          </section>
        </div>
        <div className="p-2 px-7 rounded-lg shadow flex flex-col items-center justify-between col-span-full">
          <div className="w-full py-2 text-sm flex text-gray-400">Tracking demostrativo</div>
          <div className="flex flex-row w-full justify-between items-center">
            {pasos.map((item, index) => (
              <React.Fragment key={item.id}>
                <div className="flex flex-col items-center">
                  <span className="bg-muted-foreground/50 rounded-full p-2 w-12 h-12 flex items-center justify-center">{item.id}</span>
                  <span>{item.descripcion}</span>
                </div>

                {/* Muestra '>' solo si NO es el último elemento */}
                {index < pasos.length - 1 && <div className="w-16 h-6 rounded justify-center flex">{">"}</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
        {/* <div className="bg-brand-100 p-4 rounded-lg shadow flex items-center justify-between col-span-full"> */}
        {/* <div className="w-24 h-8 bg-blue-500 rounded">Logo</div> */}

        {/* <!-- Grupo de enlaces con FLEX y GAP --> */}
        {/* <nav className="flex items-center gap-3">
            <div className="w-16 h-6 bg-brand-100 rounded">1</div>
            <div className="w-16 h-6 bg-brand-100 rounded">2</div>
            <div className="w-16 h-6 bg-brand-100 rounded">3</div>
          </nav> */}
        {/* </div> */}
        {/* <!-- BARRA LATERAL (Ocupa 1 de 4 columnas) --> */}
        {/* <!-- Internamente es FLEX-COL para apilar elementos verticalmente --> */}
        <aside className="md:col-span-1 bg-brand-100 p-4 rounded-lg shadow flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-8 bg-brand-100 rounded">Item 1</div>
            <div className="h-8 bg-brand-100 rounded">Item 2</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
            <div className="h-8 bg-brand-100 rounded">Item 3</div>
          </div>
          {/* <!-- Elemento anclado al fondo gracias a justify-between --> */}
          <div className="h-10 bg-black text-white rounded flex items-center justify-center">Acción inferior</div>
        </aside>

        {/* <!-- ÁREA DE CONTENIDO (Ocupa 3 de 4 columnas) --> */}
        {/* <!-- Es otro GRID anidado para crear una cuadrícula de tarjetas --> */}
        <section className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* <!-- Tarjeta destacada: Ocupa 2 columnas de ancho --> */}
          <div className="sm:col-span-2 bg-brand-100 p-4 rounded-lg shadow flex flex-col justify-between">
            <div className="h-6 w-1/3 bg-blue-200 rounded mb-4"></div>
            <div className="flex-1 bg-gray-100 rounded min-h-[120px]"></div>
          </div>

          {/* <!-- Tarjeta normal 1 --> */}
          <div className="bg-brand-100 p-4 rounded-lg shadow flex flex-col justify-between">
            <div className="h-6 w-1/2 bg-brand-100 rounded mb-4"></div>
            <div className="flex justify-end gap-2 mt-4">
              <div className="w-12 h-6 bg-gray-300 rounded"></div>
              <div className="w-12 h-6 bg-blue-500 rounded"></div>
            </div>
          </div>

          {/* <!-- Tarjeta normal 2 --> */}
          <div className="bg-brand-100 p-4 rounded-lg shadow flex items-center justify-center min-h-[150px]">Centrado perfecto (Flex)</div>

          {/* <!-- Tarjeta normal 3 --> */}
          <div className="bg-brand-100 p-4 rounded-lg shadow flex items-center justify-center min-h-[150px]">Centrado perfecto (Flex)</div>

          {/* <!-- Tarjeta normal 4 --> */}
          <div className="bg-brand-100 p-4 rounded-lg shadow flex items-center justify-center min-h-[150px]">Centrado perfecto (Flex)</div>
        </section>

        {/* <!-- 3. FOOTER: FLEXBOX --> */}
        <footer className="bg-brand-100 p-4 rounded-lg shadow flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="w-32 h-4 bg-gray-300 rounded"></div>
          <div className="w-48 h-4 bg-brand-100 rounded"></div>
        </footer>
      </main>
    </div>
  );
};
