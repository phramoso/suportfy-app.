import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

export default function EditarAnuncio() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [horarios, setHorarios] = useState('');
  const [raioAtuacao, setRaioAtuacao] = useState('');
  const [certificacoes, setCertificacoes] = useState('');

  const categorias = ['Redes', 'Servidores', 'Sistemas', 'Impressoras', 'Segurança', 'Banco de Dados', 'Hardware', 'Storage', 'Outros'];

  useEffect(() => {
    const buscarAnuncio = async () => {
      try {
        const { data, error } = await supabase
          .from('anuncios')
          .select('*')
          .eq('id', String(id))
          .single();

        if (error) throw error;
        
        if (data) {
          setTitulo(data.titulo);
          setCategoria(data.categoria);
          setPreco(data.preco);
          setDescricao(data.descricao);
          setHorarios(data.horarios);
          setRaioAtuacao(data.raioAtuacao);
          setCertificacoes(data.certificacoes ? data.certificacoes.join(', ') : '');
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar dados do anúncio.");
        setTimeout(() => {
          navigate('/meus-anuncios');
        }, 3000);
      }
    };

    buscarAnuncio();
  }, [id, navigate]);

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const anuncioAtualizado = {
      titulo,
      categoria,
      preco,
      descricao,
      horarios,
      raioAtuacao,
      certificacoes: certificacoes ? certificacoes.split(',').map(c => c.trim()) : []
    };

    try {
      const { error } = await supabase
        .from('anuncios')
        .update(anuncioAtualizado)
        .eq('id', String(id));

      if (error) throw error;

      toast.success('Alterações salvas com sucesso! ✅');
      setTimeout(() => {
        navigate('/meus-anuncios');
      }, 3000);
      
    } catch (error) {
      console.error(error);
      toast.error('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full p-4 bg-slate-900/50 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium text-white placeholder-slate-500";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center pt-28 pb-20 px-4 relative">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="w-full max-w-2xl bg-slate-800 p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-700 z-10">
        
        <div className="mb-8 border-b border-slate-700 pb-6">
          <h1 className="text-3xl font-black text-white">Editar Anúncio</h1>
          <p className="text-slate-400 text-sm mt-1">Atualize as informações do seu serviço no catálogo.</p>
        </div>

        <form onSubmit={handleSalvarEdicao} className="flex flex-col gap-6">
          
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 uppercase ml-1">Título do Anúncio *</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputStyle} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase ml-1">Categoria *</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={`${inputStyle} [&>option]:bg-slate-800`} required>
                {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase ml-1">Preço *</label>
              <input type="text" value={preco} onChange={(e) => setPreco(e.target.value)} className={inputStyle} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-900/50 rounded-[2rem] border border-slate-700/50 shadow-inner">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase ml-1">Disponibilidade</label>
              <input type="text" value={horarios} onChange={(e) => setHorarios(e.target.value)} className="w-full p-4 bg-slate-800 border border-slate-600 rounded-2xl outline-none text-white text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase ml-1">Área de Atuação</label>
              <select value={raioAtuacao} onChange={(e) => setRaioAtuacao(e.target.value)} className="w-full p-4 bg-slate-800 border border-slate-600 rounded-2xl outline-none text-white text-sm [&>option]:bg-slate-800">
                <option value="Apenas no meu bairro">Apenas no meu bairro</option>
                <option value="Toda Aracaju">Toda Aracaju</option>
                <option value="Remoto">Atendimento Online</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 uppercase ml-1">Certificações</label>
            <input type="text" value={certificacoes} onChange={(e) => setCertificacoes(e.target.value)} className={inputStyle} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 uppercase ml-1">Descrição do Serviço *</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={6} className={`${inputStyle} resize-none`} required />
          </div>

          <div className="flex gap-4 mt-4 pt-6 border-t border-slate-700">
            <button type="button" onClick={() => navigate('/meus-anuncios')} className="flex-1 text-slate-500 font-bold hover:text-slate-300 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-900/50 transition-all transform hover:-translate-y-1">
              {loading ? 'Salvando...' : '💾 Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}