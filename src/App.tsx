import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./pages/Navbar.tsx"
import HomeEmpresa from "./pages/HomeEmpresa.tsx";
import CriarAnuncio from "./pages/CriarAnuncio.tsx";
import DetalhesAnuncio from "./pages/DetalhesAnuncio.tsx";
import MeusServicos from "./pages/MeusServiços.tsx";
import Login from "./pages/Login.tsx";
import Cadastro from "./pages/Cadastro.tsx";
import Perfil from "./pages/Perfil.tsx";
import MeusAnuncios from "./pages/MeusAnuncios.tsx";
import EditarAnuncio from "./pages/EditarAnuncio.tsx";

function App() {
  return (
    <BrowserRouter>
    <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/catálogo" element={<HomeEmpresa/>} />
        <Route path="/anuncio" element={<CriarAnuncio/>} />
        <Route path="/anuncio/:id" element={<DetalhesAnuncio/>} />
        <Route path="/meus-pedidos" element={<MeusServicos />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/meus-anuncios" element={<MeusAnuncios />} />
        <Route path="/editar-anuncio/:id" element={<EditarAnuncio />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;