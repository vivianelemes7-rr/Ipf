import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './Login.css'
import Login from './Login.jsx'
import EsquecerSenha from './EsquecerSenha.jsx'
import Cadastro from './CadastroFuncionario.jsx'
import CadastroVendedor from './CadastroVendedor.jsx'
import Dashboard from './Dashboard.jsx'
import Vendas from './Vendas.jsx'
import AlterarSenha from './AlterarSenha.jsx'
import Clientes from './Clientes.jsx'
import Vendedores from './Vendedores.jsx'
import Kanban from './Kanban.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/esquecer-senha" element={<EsquecerSenha />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/cadastro-vendedor" element={<CadastroVendedor />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vendas" element={<Vendas />} />
        <Route path="/alterar-senha" element={<AlterarSenha />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/vendedores" element={<Vendedores />} />
        <Route path="/kanban" element={<Kanban />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
