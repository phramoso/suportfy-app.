import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from "../supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

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
          <input
            className={inputStyle}
            type="password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
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