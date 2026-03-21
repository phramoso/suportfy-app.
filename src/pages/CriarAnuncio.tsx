import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

interface UsuarioLogado {
  id: number | string;
  nome: string;
  bairro: string;
  cidade: string;
}

export default function CriarAnuncio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);

  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [raioAtuacao, setRaioAtuacao] = useState('');
  const [certificacoes, setCertificacoes] = useState('');
  
  // NOVOS ESTADOS: Disponibilidade Inteligente
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('18:00');
  
  const [localizacao, setLocalizacao] = useState<{lat: number, lng: number} | null>(null);
  const [buscandoLocal, setBuscandoLocal] = useState(false);

  const categorias = ['Redes', 'Servidores', 'Sistemas', 'Impressoras', 'Segurança', 'Banco de Dados', 'Hardware', 'Storage', 'Outros'];
  const TODOS_OS_DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  useEffect(() => {
    const dados = localStorage.getItem("usuarioLogado");
    if (dados) {
      setUsuario(JSON.parse(dados));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const toggleDia = (dia: string) => {
    setDiasSelecionados(prev => 
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    );
  };

  const capturarLocalizacao = (e: React.MouseEvent) => {
    e.preventDefault();
    setBuscandoLocal(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocalizacao({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setBuscandoLocal(false);
          toast.success("Localização capturada com sucesso!");
        },
        () => {
          toast.error('Não foi possível acessar o GPS.');
          setBuscandoLocal(false);
        }
      );
    } else {
      toast.error('GPS não suportado neste navegador.');
      setBuscandoLocal(false);
    }
  };

  const handlePublicar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    if (diasSelecionados.length === 0) {
      toast.error("Por favor, selecione pelo menos um dia de atendimento.");
      return;
    }

    setLoading(true);

    // Mágica acontecendo: Transforma os botões clicados em uma frase bonita pro banco
    const horariosFinal = `${diasSelecionados.join(', ')} das ${horaInicio} às ${horaFim}`;

    const novoAnuncio = {
      id: Date.now().toString(),
      titulo,
      categoria,
      preco,
      descricao,
      horarios: horariosFinal, // Salvando a string gerada
      raioAtuacao,
      autorId: String(usuario.id), 
      autorNome: usuario.nome,
      bairro: usuario.bairro, 
      cidade: usuario.cidade,
      lat: localizacao?.lat || null,
      lng: localizacao?.lng || null,
      estrelas: 0,
      totalAvaliacoes: 0,
      certificacoes: certificacoes ? certificacoes.split(',').map(c => c.trim()) : []
    };

    try {
      const { error } = await supabase
        .from('anuncios')
        .insert([novoAnuncio]);

      if (error) throw error;

      toast.success('Anúncio publicado com sucesso! 🚀');
      
      setTimeout(() => {
        navigate('/meus-anuncios'); 
      }, 3000);
      
    } catch (error) {
      console.error(error);
      toast.error('Erro ao conectar com o banco de dados.');
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
          <h1 className="text-3xl font-black text-white">Anunciar Serviço</h1>
          <p className="text-slate-400 text-sm mt-1">Olá {usuario?.nome}, preencha os dados do seu serviço.</p>
        </div>

        <form onSubmit={handlePublicar} className="flex flex-col gap-6">
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 uppercase ml-1">Título do Anúncio *</label>
            <input type="text" placeholder="Ex: Formatação de PC" value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputStyle} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase ml-1">Categoria *</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={`${inputStyle} [&>option]:bg-slate-800`} required>
                <option value="" disabled>Selecione...</option>
                {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase ml-1">Preço Estimado *</label>
              <input type="text" placeholder="R$ 150,00" value={preco} onChange={(e) => setPreco(e.target.value)} className={inputStyle} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase ml-1">Área de Atuação *</label>
              <select value={raioAtuacao} onChange={(e) => setRaioAtuacao(e.target.value)} className={`${inputStyle} [&>option]:bg-slate-800`} required>
                <option value="" disabled>Selecione...</option>
                <option value="Apenas no meu bairro">Apenas no meu bairro</option>
                <option value="Toda Aracaju">Toda Aracaju</option>
                <option value="Remoto">Atendimento Online</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-500 uppercase ml-1">Certificações (Opcional)</label>
              <input type="text" placeholder="Ex: CCNA, ITIL" value={certificacoes} onChange={(e) => setCertificacoes(e.target.value)} className={inputStyle} />
            </div>
          </div>

          {/* NOVA SEÇÃO DE DISPONIBILIDADE */}
          <div className="space-y-3 p-6 bg-slate-900/50 rounded-[2rem] border border-slate-700/50 shadow-inner">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span>📅</span> Dias e Horários de Atendimento *
            </label>
            
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase">Quais dias você trabalha?</p>
                <div className="flex flex-wrap gap-2">
                  {TODOS_OS_DIAS.map(dia => (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDia(dia)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${
                        diasSelecionados.includes(dia)
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/50 transform scale-105'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-700/50 pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Horário Inicial</label>
                  <input 
                    type="time" 
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className={inputStyle}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Horário Final</label>
                  <input 
                    type="time" 
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                    className={inputStyle}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black text-slate-500 uppercase ml-1">Descrição do Serviço *</label>
            <textarea placeholder="Fale sobre sua experiência..." value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} className={`${inputStyle} resize-none`} required />
          </div>

          <button onClick={capturarLocalizacao} disabled={buscandoLocal || localizacao !== null} className={`flex items-center justify-center gap-3 p-4 rounded-2xl font-bold transition-all border ${localizacao ? 'bg-green-900/30 text-green-400 border-green-800/50' : 'bg-blue-900/30 text-blue-400 border-blue-800/50 hover:bg-blue-800/50'}`}>
            {buscandoLocal ? '🔄 Buscando...' : localizacao ? '✅ Localização Fixada' : '📍 Fixar GPS para destaque'}
          </button>

          <div className="flex gap-4 mt-4 pt-6 border-t border-slate-700">
            <button type="button" onClick={() => navigate('/')} className="flex-1 text-slate-400 font-bold hover:text-white transition-colors border border-transparent hover:border-slate-700 rounded-xl">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-[2] bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-2xl shadow-lg shadow-green-900/50 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0">
              {loading ? 'Publicando...' : '🚀 Publicar no Catálogo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}