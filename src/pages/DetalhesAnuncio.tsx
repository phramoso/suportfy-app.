import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

interface Anuncio {
  id: string | number;
  titulo: string;
  categoria: string;
  preco: string;
  descricao: string;
  horarios: string;
  raioAtuacao: string;
  autorId: string | number;
  autorNome: string;
  cidade: string;
  bairro: string;
  certificacoes?: string[];
  estrelas?: number;
  totalAvaliacoes?: number;
}

export default function DetalhesAnuncio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [loading, setLoading] = useState(true);
  const [listaAvaliacoes, setListaAvaliacoes] = useState<any[]>([]);

  const [modalAberto, setModalAberto] = useState(false);
  const [problema, setProblema] = useState("");
  const [urgencia, setUrgencia] = useState("Normal");
  const [dataAgendamento, setDataAgendamento] = useState("");
  const [horaAgendamento, setHoraAgendamento] = useState("");

  const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado") || '{}');
  const hoje = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const carregarAnuncio = async () => {
      try {
        const { data, error } = await supabase
          .from('anuncios')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) setAnuncio(data);
      } catch (erro) {
        console.error(erro);
      } finally {
        setLoading(false);
      }
    };

    carregarAnuncio();
  }, [id]);

  useEffect(() => {
    const buscarAvaliacoes = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('anuncio_id', String(id))
        .order('criado_em', { ascending: false });

      if (data) setListaAvaliacoes(data);
    };

    buscarAvaliacoes();
  }, [id]);

  const dispararNotificacao = async (usuarioId: string | number, mensagem: string) => {
    try {
      await supabase.from('notificacoes').insert([{
        id: Date.now().toString(),
        usuarioId: String(usuarioId),
        mensagem,
        lida: false,
        data: new Date().toISOString()
      }]);
    } catch (error) {
      console.error("Erro ao disparar notificação:", error);
    }
  };

  const abrirModal = () => {
    const sessao = localStorage.getItem("usuarioLogado");
    if (!sessao) {
      toast.error("Você precisa estar logado para solicitar um serviço!");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    if (String(usuarioLogado.id) === String(anuncio?.autorId)) {
      toast.error("Você não pode solicitar um atendimento para o seu próprio anúncio.");
      return;
    }

    setModalAberto(true);
  };

  const confirmarSolicitacao = async () => {
    if (!problema || !dataAgendamento || !horaAgendamento) {
      toast.error("Por favor, preencha o problema, a data e o horário desejado.");
      return;
    }

    const cliente = JSON.parse(localStorage.getItem("usuarioLogado") || '{}');

    let precoNumerico = 0;
    const precoTexto = anuncio?.preco || "0";
    if (precoTexto.includes(',')) {
      precoNumerico = parseFloat(precoTexto.replace(/[^\d,-]/g, '').replace(',', '.'));
    } else {
      precoNumerico = parseFloat(precoTexto.replace(/[^\d.]/g, ''));
    }
    if (isNaN(precoNumerico)) precoNumerico = 0;

    const taxaPlataforma = precoNumerico * 0.15; 
    const valorTotal = precoNumerico + taxaPlataforma;
    const dataFormatada = dataAgendamento.split('-').reverse().join('/');
    const agendamentoFinal = `${dataFormatada} às ${horaAgendamento}`;

    try {
      const { data: dadosDoTecnico, error: erroTecnico } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', anuncio?.autorId)
        .single();

      if (erroTecnico) throw erroTecnico;

      const novoPedido = {
        id: Date.now().toString(),
        anuncioId: anuncio?.id,
        tituloServico: anuncio?.titulo,
        tecnicoId: anuncio?.autorId,
        tecnicoNome: anuncio?.autorNome,
        tecnicoTelefone: dadosDoTecnico.telefone,
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        clienteTelefone: cliente.telefone, 
        endereco: `${cliente.rua}, ${cliente.numero} - ${cliente.bairro}, ${cliente.cidade}`,
        problema: problema,
        urgencia: urgencia,
        agendamento: agendamentoFinal,
        valorServico: precoNumerico,
        taxaPlataforma: taxaPlataforma,
        valorTotal: valorTotal,
        status: "pendente", 
        dataHoraEmissao: new Date().toLocaleString() 
      };

      const { error: erroPedido } = await supabase
        .from('pedidos')
        .insert([novoPedido]);

      if (erroPedido) throw erroPedido;

      await dispararNotificacao(
        anuncio?.autorId as string, 
        `Nova solicitação: ${cliente.nome} precisa de ${anuncio?.titulo}.`
      );

      setModalAberto(false);
      toast.success("Solicitação enviada! O técnico foi notificado.");
      
      setTimeout(() => navigate("/catálogo"), 3000);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar pedido. Verifique o banco de dados.");
    }
  };

  const inputStyle = "w-full p-4 bg-slate-900/50 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-white placeholder-slate-500";

  if (loading) return <div className="pt-32 min-h-screen bg-slate-900 text-center font-bold text-slate-400">Carregando detalhes...</div>;
  if (!anuncio) return <div className="pt-32 min-h-screen bg-slate-900 text-center text-red-400">Anúncio não encontrado.</div>;

  return (
    <div className="min-h-screen bg-slate-900 pt-28 pb-20 px-4 relative">
      <Toaster position="top-center" reverseOrder={false} />

      {modalAberto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-[2rem] border border-slate-700 w-full max-w-lg p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-2">Agendar Serviço</h2>
            <p className="text-slate-400 text-sm mb-6">Descreva o serviço e escolha quando deseja ser atendido.</p>
            
            <div className="space-y-4">
              <textarea 
                rows={3}
                placeholder="Ex: Meu computador liga mas não dá tela..."
                value={problema}
                onChange={(e) => setProblema(e.target.value)}
                className={`${inputStyle} resize-none`}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Data Desejada *</label>
                  <input type="date" min={hoje} value={dataAgendamento} onChange={(e) => setDataAgendamento(e.target.value)} className={`${inputStyle} text-slate-300 font-bold`} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Horário *</label>
                  <input type="time" value={horaAgendamento} onChange={(e) => setHoraAgendamento(e.target.value)} className={`${inputStyle} text-slate-300 font-bold`} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Prioridade</label>
                <select value={urgencia} onChange={(e) => setUrgencia(e.target.value)} className={`${inputStyle} text-slate-300 [&>option]:bg-slate-800`}>
                  <option value="Normal">Normal</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setModalAberto(false)} className="flex-1 text-slate-400 font-bold hover:bg-slate-700 rounded-xl transition-colors border border-transparent hover:border-slate-600">Cancelar</button>
              <button onClick={confirmarSolicitacao} className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/50 hover:bg-blue-500 transition-transform hover:-translate-y-1">
                Confirmar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-slate-700">
            
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-blue-900/30 text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-blue-800/50">
                {anuncio.categoria}
              </span>
              <div className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                <span className="text-amber-400 text-sm drop-shadow-[0_0_2px_rgba(251,191,36,0.8)]">★</span>
                <span className="text-xs font-black text-white">
                {(anuncio.totalAvaliacoes || 0) > 0 ? (anuncio.estrelas || 0).toFixed(1) : 'Novo'}
                </span>
                <span className="text-[10px] font-bold text-slate-500">({anuncio.totalAvaliacoes || 0})</span>
              </div>
            </div>

            <h1 className="text-3xl font-black text-white mt-2 mb-6">{anuncio.titulo}</h1>
            
            <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-2xl mb-8 border border-slate-700/50">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl">{anuncio.autorNome.charAt(0)}</div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Profissional</p>
                <p className="text-white font-black">{anuncio.autorNome}</p>
              </div>
            </div>

            <h3 className="font-black text-white mb-3">Descrição do Serviço</h3>
            <p className="text-slate-400 leading-relaxed mb-8">{anuncio.descricao}</p>

            <h3 className="font-black text-white mb-4 pt-6 border-t border-slate-700/50">Ficha Técnica</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">🕒 Disponibilidade</span>
                <span className="text-slate-300 font-bold text-sm">{anuncio.horarios || 'Horário a combinar'}</span>
              </div>
              
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 flex flex-col gap-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">📍 Área de Atuação</span>
                <span className="text-slate-300 font-bold text-sm">{anuncio.raioAtuacao || 'A combinar'}</span>
              </div>
            </div>

            {anuncio.certificacoes && anuncio.certificacoes.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">🎓 Certificações e Especialidades</p>
                <div className="flex flex-wrap gap-2">
                  {anuncio.certificacoes.map((cert, index) => (
                    <span key={index} className="bg-blue-900/20 text-blue-400 px-4 py-2 rounded-xl text-xs font-bold border border-blue-800/30 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 pt-8 border-t border-slate-700 w-full">
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                ⭐ Avaliações dos Clientes
              </h3>
              
              {listaAvaliacoes.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
                  <p className="text-slate-400">Nenhuma avaliação ainda. Seja o primeiro a avaliar após o serviço!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {listaAvaliacoes.map((aval) => (
                    <div key={aval.id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-1 text-amber-400 text-lg">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < aval.nota ? 'drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]' : 'text-slate-600'}>
                              {i < aval.nota ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">
                          {new Date(aval.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      {aval.comentario && (
                        <p className="text-slate-300 italic text-sm mt-3">"{aval.comentario}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl border border-slate-700 sticky top-28 text-center sm:text-left">
            <p className="text-slate-500 font-bold text-sm mb-1">Preço estimado</p>
            <h2 className="text-4xl font-black text-white mb-6">
            R$ {parseFloat(anuncio.preco.replace(/[^\d,-]/g, '').replace(',', '.') || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-slate-400 font-bold"><span>📍</span> {anuncio.bairro}, {anuncio.cidade}</div>
              <div className="flex items-center gap-3 text-sm text-green-400 font-bold"><span>✅</span> Pagamento Seguro </div>
            </div>

            {String(usuarioLogado.id) === String(anuncio.autorId) ? (
              <div className="bg-amber-900/20 border border-amber-800/50 p-4 rounded-2xl text-center">
                <p className="text-amber-500 text-xs font-black uppercase leading-tight">Este anúncio é seu.</p>
                <button onClick={() => navigate('/meus-anuncios')} className="text-amber-400 text-[10px] font-bold underline mt-1 hover:text-amber-300">Gerenciar meus serviços</button>
              </div>
            ) : (
              <button onClick={abrirModal} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-900/50 transition-all transform hover:-translate-y-1 mb-4">
                Solicitar Atendimento
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}