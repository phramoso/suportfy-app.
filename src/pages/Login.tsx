import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from "../supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  useEffect(() => {
    const logado = localStorage.getItem("usuarioLogado");
    if (logado) {
      navigate("/catálogo");
    }
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email);

      if (error) throw error;

      if (usuarios && usuarios.length > 0) {
        const usuarioEncontrado = usuarios[0];

        if (usuarioEncontrado.senha === senha) {
          localStorage.setItem("usuarioLogado", JSON.stringify(usuarioEncontrado));
          
          toast.success(`Bem-vindo de volta, ${usuarioEncontrado.nome}!`);
          
          setTimeout(() => {
            navigate("/catálogo"); 
          }, 3000);
          
        } else {
          toast.error("Senha incorreta!");
        }
      } else {
        toast.error("E-mail não cadastrado!");
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error("Erro ao conectar com o servidor.");
    }
  }

  const inputStyle = "w-full p-4 bg-slate-900/50 border border-slate-700 text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-500";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="bg-slate-800 p-10 rounded-[2.5rem] shadow-xl border border-slate-700 w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black text-white tracking-tight">Login</h2>
          <p className="text-slate-400 font-bold mt-2">Acesse sua conta SuportFy</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            className={inputStyle}
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <div className="relative w-full">
            <input
              className={`${inputStyle} pr-12`} 
              type={mostrarSenha ? "text" : "password"}
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors focus:outline-none flex items-center justify-center"
              title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {mostrarSenha ? (
                
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl mt-4 transition-all shadow-lg shadow-blue-900/50 transform hover:-translate-y-1">
            Entrar no Sistema
          </button>
          
          <button 
            type="button"
            onClick={() => navigate('/cadastro')}
            className="w-full bg-transparent text-slate-400 font-bold py-2 mt-2 hover:text-slate-300 transition-colors"
          >
            Ainda não tenho conta
          </button>
        </form>
      </div>
    </div>
  );
}