import MenuBasePage from '@/pages/Cruds/MenuBasePage'
import ClienteBi from '@/views/ReportesBi/ClienteBi'
import CobrosBi from '@/views/ReportesBi/CobrosBi'
import React from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'

const RutasReportesBi = () => {
  return (
        <Routes>
          <Route path="reportesbi" element={<MenuBasePage />}>
            <Route index element={<Outlet />} />
    
            <Route path="clientes-bi" element={<Outlet />}>
              <Route index element={<ClienteBi />} />
            </Route>

            <Route path="cobros-bi" element={<Outlet />}>
              <Route index element={<CobrosBi />} />
            </Route>

          </Route>
        </Routes>
  )
}

export default RutasReportesBi