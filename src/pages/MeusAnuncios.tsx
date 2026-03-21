import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

export default function MeusAnuncios() {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [meusAnuncios, setMeusAnuncios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [anuncioParaExcluir, setAnuncioParaExcluir] = useState<string | number | null>(null);

  useEffect(() => {
    const dadosSessao = localStorage.getItem("usuarioLogado");
    if (!dadosSessao) {
        navigate("/login");
        return;
    }
    const usuario = JSON.parse(dadosSessao);

    const buscarMeusAnuncios = async () => {
      try {
        const { data, error } = await supabase
          .from('anuncios')
          .select('*')
          .eq('autorId', String(usuario.id));

        if (error) throw error;
        if (data) setMeusAnuncios(data);
      } catch (error) {
        console.error("Erro ao buscar anúncios:", error);
      } finally {
        setLoading(false);
      }
    };

    buscarMeusAnuncios();
  }, [navigate]);

  const confirmarExclusao = async () => {
    if (!anuncioParaExcluir) return;

    try {
      const { error } = await supabase
        .from('anuncios')
        .delete()
        .eq('id', String(anuncioParaExcluir));

      if (error) throw error;
      
      setMeusAnuncios(prev => prev.filter(a => String(a.id) !== String(anuncioParaExcluir)));
      toast.success("Anúncio removido com sucesso! 🗑️");
    } catch (error) {
      console.error("Erro ao excluir anúncio:", error);
      toast.error("Erro ao excluir o anúncio.");
    } finally {
      setAnuncioParaExcluir(null); // Fecha o modal
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pt-28 pb-20 px-4 flex flex-col items-center relative">
      <Toaster position="top-center" reverseOrder={false} />

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {anuncioParaExcluir && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-[2rem] border border-slate-700 w-full max-w-sm p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl border border-red-800/50">
              ⚠️
            </div>
            <h2 className="text-xl font-black text-white mb-2">Excluir Anúncio?</h2>
            <p className="text-slate-400 text-sm mb-8">Essa ação não pode ser desfeita. O serviço sairá do catálogo imediatamente.</p>
            
            <div className="flex gap-4">
              <button onClick={() => setAnuncioParaExcluir(null)} className="flex-1 text-slate-400 font-bold hover:bg-slate-700 py-3 rounded-xl transition-colors border border-transparent hover:border-slate-600">
                Cancelar
              </button>
              <button onClick={confirmarExclusao} className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl shadow-lg shadow-red-900/50 hover:bg-red-500 transition-transform hover:-translate-y-1">
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Meus Anúncios</h1>
              <p className="text-slate-400 text-sm mt-1">Gerencie seus serviços publicados no catálogo.</p>
            </div>
            <button 
              onClick={() => navigate('/anuncio')} 
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-900/40 transition-all transform hover:-translate-y-1"
            > 
              + Novo Anúncio
            </button>
        </div>

        <div className="grid gap-4">
          {meusAnuncios.length === 0 ? (
            <div className="bg-slate-800 p-12 rounded-[2.5rem] text-center border border-slate-700 shadow-md">
                <p className="font-bold text-slate-500 uppercase tracking-widest text-sm">
                  {loading ? "Carregando..." : "Nenhum anúncio encontrado."}
                </p>
                {!loading && (
                  <button onClick={() => navigate('/anuncio')} className="text-blue-400 text-xs font-bold mt-2 hover:underline">
                    Comece a anunciar agora
                  </button>
                )}
            </div>
          ) : (
            meusAnuncios.map(anuncio => (
              <div key={anuncio.id} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-md flex justify-between items-center hover:border-slate-600 transition-colors">
                <div>
                  <span className="text-[10px] font-black text-blue-400 bg-blue-900/30 border border-blue-800/50 px-2 py-1 rounded-md uppercase">
                    {anuncio.categoria}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">{anuncio.titulo}</h3>
                  <p className="text-green-400 font-bold text-sm">{anuncio.preco}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/editar-anuncio/${anuncio.id}`)} 
                    className="px-4 py-2.5 bg-slate-900/50 text-slate-300 hover:text-white border border-slate-700 rounded-xl font-bold text-xs transition-colors"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => setAnuncioParaExcluir(anuncio.id)} 
                    className="px-4 py-2.5 bg-slate-900/50 text-red-400 hover:bg-red-900/20 border border-red-900/30 rounded-xl font-bold text-xs transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}