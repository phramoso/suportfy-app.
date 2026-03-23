import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface Anuncio {
  id: number | string;
  titulo: string;
  categoria: string;
  preco: string;
  autorNome: string;
  cidade: string;
  lat: number | null;
  lng: number | null;
  distanciaKm?: number;
  descricao: string;
  estrelas: number;
  totalAvaliacoes: number; 
}

const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export default function Home() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [ordenacao, setOrdenacao] = useState('relevancia');
  const [precoMax, setPrecoMax] = useState(1000);
  const [localUsuario, setLocalUsuario] = useState<{lat: number, lng: number} | null>(null);
  const [buscandoLocal, setBuscandoLocal] = useState(false);
  const [listaAnuncios, setListaAnuncios] = useState<Anuncio[]>([]);

  useEffect(() => {
    const buscarAnuncios = async () => {
      try {
        const { data, error } = await supabase
          .from('anuncios')
          .select('*');

        if (error) throw error;
        if (data) setListaAnuncios(data);
      } catch (err) {
        console.error("Erro:", err);
      }
    };

    buscarAnuncios();
  }, []);

  const categorias = ['Todos', 'Redes', 'Servidores', 'Sistemas', 'Impressoras', 'Segurança', 'Hardware', 'Software'];

  const ativarBuscaPorProximidade = () => {
    if (localUsuario) { setLocalUsuario(null); return; }
    setBuscandoLocal(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLocalUsuario({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setBuscandoLocal(false); },
        () => { alert("Ative o GPS!"); setBuscandoLocal(false); }
      );
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  let anunciosFiltrados = listaAnuncios.filter((a) => {
    const matchCat = categoriaAtiva === 'Todos' || a.categoria === categoriaAtiva;
    const matchBusca = a.titulo?.toLowerCase().includes(busca.toLowerCase());
    
    const precoNum = parseFloat(a.preco.replace(/[^\d]/g, '')) / 100 || 0;
    const matchPreco = precoNum <= precoMax;

    return matchCat && matchBusca && matchPreco;
  });

  if (localUsuario) {
    anunciosFiltrados = anunciosFiltrados.map(a => ({
      ...a,
      distanciaKm: a.lat ? calcularDistancia(localUsuario.lat, localUsuario.lng, a.lat, a.lng!) : undefined
    }));
  }

  anunciosFiltrados.sort((a, b) => {
    if (ordenacao === 'preco-baixo') return (parseFloat(a.preco.replace(/[^\d]/g, '')) - parseFloat(b.preco.replace(/[^\d]/g, '')));
    if (ordenacao === 'distancia' && localUsuario) return (a.distanciaKm || 999) - (b.distanciaKm || 999);
    return 0; 
  });

  return (
    <div className="min-h-screen bg-slate-900 pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <aside className="lg:col-span-1 space-y-8">
          <div className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 shadow-xl">
            <h3 className="text-white font-black mb-6 flex items-center gap-2">
              <span>⚡</span> Filtros Avançados
            </h3>

            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Preço Máximo</label>
                <span className="text-blue-400 font-bold text-xs">{formatarMoeda(precoMax)}</span>
              </div>
              <input 
                type="range" min="50" max="2000" step="50" 
                value={precoMax} onChange={(e) => setPrecoMax(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="mb-8">
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Ordernar por</label>
              <select 
                value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)}
                className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevancia">Mais Relevantes</option>
                <option value="preco-baixo">Menor Preço</option>
                <option value="distancia">Mais Próximos</option>
              </select>
            </div>

            <button 
              onClick={ativarBuscaPorProximidade}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border ${
                localUsuario ? 'bg-green-900/30 text-green-400 border-green-800/50' : 'bg-slate-900/50 text-slate-400 border-slate-700'
              }`}
            >
              {buscandoLocal ? 'Localizando...' : localUsuario ? '✅ GPS Ativo' : '📍 Usar minha localização'}
            </button>
          </div>
        </aside>

        <main className="lg:col-span-3">
          <div className="mb-8 space-y-6">
            <div className="relative">
              <input
                type="text" placeholder="O que você precisa consertar hoje?..."
                value={busca} onChange={(e) => setBusca(e.target.value)}
                className="w-full p-5 pl-14 bg-slate-800 border border-slate-700 text-white rounded-[1.5rem] shadow-2xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="absolute left-5 top-5 text-xl opacity-50">🔍</span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categorias.map(cat => (
                <button
                  key={cat} onClick={() => setCategoriaAtiva(cat)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                    categoriaAtiva === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {anunciosFiltrados.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-slate-800/50 rounded-[2rem] border border-dashed border-slate-700 text-slate-500">
                Nenhum técnico encontrado com esses filtros. 
              </div>
            ) : (
              anunciosFiltrados.map((anuncio) => (
                <div 
                  key={anuncio.id} onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                  className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black bg-blue-900/40 text-blue-400 px-3 py-1 rounded-lg uppercase border border-blue-800/30">
                        {anuncio.categoria}
                      </span>
                      {anuncio.distanciaKm && (
                        <span className="text-green-400 font-bold text-[10px] bg-green-900/20 px-2 py-1 rounded-md">
                          {anuncio.distanciaKm.toFixed(1)} km de você
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors leading-tight mb-2">
                      {anuncio.titulo}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-3">
                      <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">
                        {anuncio.autorNome.charAt(0)}
                      </div>
                      {anuncio.autorNome} • {anuncio.cidade}
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-900/50 inline-flex px-2 py-1 rounded-lg border border-slate-700/50">
                      <span className="text-amber-400 text-sm drop-shadow-[0_0_2px_rgba(251,191,36,0.8)]">★</span>
                      <span className="text-xs font-black text-white">
                      {(anuncio.totalAvaliacoes || 0) > 0 ? (anuncio.estrelas || 0).toFixed(1) : 'Novo'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 ml-1">
                        ({anuncio.totalAvaliacoes || 0} avaliações)
                      </span>
                    </div>

                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700/50">
                    <span className="text-xl font-black text-green-400">
                    R$ {parseFloat(anuncio.preco.replace(/[^\d,-]/g, '').replace(',', '.') || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-blue-500 font-bold text-xs group-hover:translate-x-1 transition-transform">Ver perfil →</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}