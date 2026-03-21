import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

interface Usuario {
  id: number | string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cidade: string;
  bairro: string;
  rua: string;
  numero: string;
  foto: string;
}

export default function Perfil() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [bairro, setBairro] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");

  useEffect(() => {
    const dadosSessao = localStorage.getItem("usuarioLogado");
    if (!dadosSessao) {
      navigate("/login");
      return;
    }

    const userSessao = JSON.parse(dadosSessao);

    const buscarPerfil = async () => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', String(userSessao.id))
          .single();

        if (error) throw error;
        
        if (data) {
          setUsuario(data);
          setNome(data.nome);
          setTelefone(data.telefone);
          setBairro(data.bairro);
          setRua(data.rua);
          setNumero(data.numero);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    buscarPerfil();
  }, [navigate]);

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, ''); 
    if (valor.length > 2) valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2'); 
    if (valor.length > 7) valor = valor.replace(/(\d{5})(\d)/, '$1-$2'); 
    setTelefone(valor.substring(0, 15)); 
  };

  const handleSalvar = async () => {
    if (!usuario) return;

    const usuarioAtualizado = {
      ...usuario,
      nome,
      telefone,
      bairro,
      rua,
      numero,
    };

    try {
      const { error } = await supabase
        .from('usuarios')
        .update(usuarioAtualizado)
        .eq('id', String(usuario.id));

      if (error) throw error;

      setUsuario(usuarioAtualizado);
      localStorage.setItem("usuarioLogado", JSON.stringify(usuarioAtualizado));
      setEditando(false);
      toast.success("Perfil atualizado com sucesso! ✅");
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar alterações.");
    }
  };

  const inputStyle = "w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white font-medium transition-colors";

  if (loading) return <div className="pt-32 min-h-screen bg-slate-900 text-center font-bold text-slate-400">Carregando seu perfil...</div>;

  return (
    <div className="min-h-screen bg-slate-900 pt-28 pb-20 px-4 flex justify-center relative">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="w-full max-w-2xl bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-700 overflow-hidden z-10">
        
        <div className="bg-blue-600 p-8 text-center relative">
          <div className="w-24 h-24 rounded-3xl bg-slate-800 border-4 border-slate-900 mx-auto overflow-hidden shadow-2xl">
            <img src={usuario?.foto} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-white text-2xl font-black mt-4">{usuario?.nome}</h2>
          <p className="text-blue-200 text-sm font-medium">{usuario?.email}</p>
        </div>

        <div className="p-8 md:p-12">
          <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
            <h3 className="text-xl font-black text-white">Suas Informações</h3>
            <button 
              onClick={() => setEditando(!editando)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                editando ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-900/40'
              }`}
            >
              {editando ? "Cancelar Edição" : "Editar Perfil"}
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nome Completo</label>
                {editando ? (
                  <input className={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} />
                ) : (
                  <p className="p-3 bg-slate-900/50 rounded-xl text-slate-300 font-bold border border-transparent">{usuario?.nome}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">WhatsApp</label>
                {editando ? (
                  <input className={inputStyle} value={telefone} onChange={handleTelefoneChange} />
                ) : (
                  <p className="p-3 bg-slate-900/50 rounded-xl text-slate-300 font-bold border border-transparent">{usuario?.telefone}</p>
                )}
              </div>
            </div>

            <div className="bg-blue-900/20 p-6 rounded-[2rem] border border-blue-800/30 space-y-4">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">📍 Endereço de Atendimento</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-blue-500 uppercase">Bairro</label>
                  {editando ? (
                    <input className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm" value={bairro} onChange={(e) => setBairro(e.target.value)} />
                  ) : (
                    <p className="text-slate-300 font-bold">{usuario?.bairro}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-blue-500 uppercase">Cidade</label>
                  <p className="text-slate-300 font-bold">{usuario?.cidade}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-blue-500 uppercase">Rua</label>
                  {editando ? (
                    <input className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm" value={rua} onChange={(e) => setRua(e.target.value)} />
                  ) : (
                    <p className="text-slate-300 font-bold">{usuario?.rua}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-blue-500 uppercase">Nº</label>
                  {editando ? (
                    <input className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm" value={numero} onChange={(e) => setNumero(e.target.value)} />
                  ) : (
                    <p className="text-slate-300 font-bold">{usuario?.numero}</p>
                  )}
                </div>
              </div>
            </div>

            {editando && (
              <button 
                onClick={handleSalvar}
                className="w-full bg-green-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-green-900/40 hover:bg-green-500 transition-all transform hover:-translate-y-1 mt-6"
              >
                Salvar Alterações
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}