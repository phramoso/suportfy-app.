import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

interface Pedido {
  id: number | string;
  anuncioId?: string | number; // <-- ADICIONADO PARA VINCULAR A NOTA AO CATÁLOGO
  clienteId: string | number;
  clienteNome: string;
  clienteTelefone?: string;
  tecnicoId: string | number;
  tecnicoNome: string;
  tituloServico: string;
  problema?: string;
  endereco?: string;
  agendamento?: string;
  dataHora?: string;
  data?: string; 
  valorServico?: number;
  taxaPlataforma?: number;
  valorTotal?: number;
  status: string;
  nota?: number;
  tecnicoTelefone?: string;
}

interface UsuarioLocal {
  id: string | number;
  nome?: string;
  email?: string;
}

// COMPONENTE VISUAL DA LINHA DO TEMPO
const TimelineDoPedido = ({ statusAtual }: { statusAtual: string }) => {
  if (statusAtual === 'recusado') return null;

  const etapas = [
    { id: 'pendente', titulo: 'Aprovação', icone: '📋' },
    { id: 'aguardando_pagamento', titulo: 'Pagamento', icone: '💲' },
    { id: 'em_andamento', titulo: 'Execução', icone: '⚙️' },
    { id: 'concluido', titulo: 'Finalizado', icone: '✅' }
  ];

  const indiceAtual = etapas.findIndex(etapa => etapa.id === statusAtual);

  return (
    <div className="w-full py-4 mt-2 mb-4 relative px-2">
      <div className="flex items-center justify-between relative">
        {/* Linha de Fundo Cinza */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-700 rounded-full z-0"></div>
        
        {/* Linha de Progresso Verde */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 rounded-full z-0 transition-all duration-700 ease-out"
          style={{ width: `${(Math.max(0, indiceAtual) / (etapas.length - 1)) * 100}%` }}
        ></div>

        {/* Pontos da Timeline */}
        {etapas.map((etapa, index) => {
          const etapaConcluida = index <= indiceAtual;
          const etapaAtiva = index === indiceAtual;

          return (
            <div key={etapa.id} className="relative z-10 flex flex-col items-center gap-1.5 w-16">
              <div 
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-lg shadow-lg transition-all duration-300 ${
                  etapaConcluida 
                    ? 'bg-green-500 text-white border-2 sm:border-4 border-slate-800 scale-110' 
                    : 'bg-slate-800 text-slate-500 border-2 border-slate-600'
                } ${etapaAtiva ? 'ring-4 ring-green-500/30' : ''}`}
              >
                {etapa.icone}
              </div>
              <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-wide text-center leading-tight ${
                etapaConcluida ? 'text-green-400' : 'text-slate-500'
              }`}>
                {etapa.titulo}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function MeusServicos() {
  const [meusPedidos, setMeusPedidos] = useState<Pedido[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<"cliente" | "tecnico">("cliente");
  const [usuarioLocal, setUsuarioLocal] = useState<UsuarioLocal | null>(null);
  
  // Estados para o Modal de Avaliação
  const [pedidoAvaliacao, setPedidoAvaliacao] = useState<Pedido | null>(null);
  const [notaEstrelas, setNotaEstrelas] = useState(0);

  useEffect(() => {
    const dadosSessao = localStorage.getItem("usuarioLogado");
    if (dadosSessao) {
      setUsuarioLocal(JSON.parse(dadosSessao));
    }
    
    const buscarPedidos = async () => {
      try {
        const { data, error } = await supabase.from('pedidos').select('*').order('id', { ascending: false });
        if (error) throw error;
        if (data) setMeusPedidos(data);
      } catch (erro) {
        console.error("Erro ao buscar banco:", erro);
      }
    };

    buscarPedidos();
  }, []);

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

  const atualizarStatusNoBanco = async (id: number | string, atualizacao: Partial<Pedido>) => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .update(atualizacao)
        .eq('id', String(id))
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMeusPedidos(pedidos => pedidos.map((p) => String(p.id) === String(id) ? data : p));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAceitarServico = (pedido: Pedido) => {
    atualizarStatusNoBanco(pedido.id, { status: 'aguardando_pagamento' });
    dispararNotificacao(pedido.clienteId, `Seu serviço "${pedido.tituloServico}" foi aceito por ${pedido.tecnicoNome}! Realize o pagamento para liberar o contato.`);
    toast.success("Serviço aceito! O cliente foi notificado para realizar o PIX.");
  };

  const handleRecusarServico = (pedido: Pedido) => {
    const confirma = window.confirm("Tem certeza que deseja recusar este serviço? O cliente será notificado.");
    if (confirma) {
      atualizarStatusNoBanco(pedido.id, { status: 'recusado' });
      dispararNotificacao(pedido.clienteId, `Infelizmente o técnico ${pedido.tecnicoNome} não poderá atender o chamado: ${pedido.tituloServico}.`);
      toast.success("Serviço recusado com sucesso.");
    }
  };

  const handleSimularPagamentoPix = (pedido: Pedido) => {
    atualizarStatusNoBanco(pedido.id, { status: 'em_andamento' });
    dispararNotificacao(pedido.tecnicoId, `Pagamento confirmado para o serviço: ${pedido.tituloServico}. O WhatsApp do cliente foi liberado!`);
    toast.success("✅ PIX Confirmado! O dinheiro está retido e o WhatsApp foi liberado.");
  };

  const abrirModalAvaliacao = (pedido: Pedido) => {
    setPedidoAvaliacao(pedido);
    setNotaEstrelas(0); // Reseta as estrelas
  };

  // <-- FUNÇÃO ATUALIZADA COM A MÁGICA DA REPUTAÇÃO -->
  const enviarAvaliacaoEConcluir = async () => {
    if (!pedidoAvaliacao || notaEstrelas === 0) {
      toast.error("Por favor, selecione pelo menos 1 estrela para avaliar o serviço.");
      return;
    }

    try {
      // 1. Atualiza o status do pedido para concluído
      await atualizarStatusNoBanco(pedidoAvaliacao.id, { status: 'concluido', nota: notaEstrelas });
      
      // 2. Notifica o técnico
      dispararNotificacao(pedidoAvaliacao.tecnicoId, `O cliente confirmou a conclusão de "${pedidoAvaliacao.tituloServico}" e te avaliou com ${notaEstrelas} estrelas!`);
      
      // 3. A MÁGICA DA REPUTAÇÃO NO CATÁLOGO 🌟
      if (pedidoAvaliacao.anuncioId) {
        // Puxa as estrelas atuais do anúncio
        const { data: anuncio, error: erroAnuncio } = await supabase
          .from('anuncios')
          .select('estrelas, totalAvaliacoes')
          .eq('id', String(pedidoAvaliacao.anuncioId))
          .single();

        if (!erroAnuncio && anuncio) {
          const totalAtual = anuncio.totalAvaliacoes || 0;
          // Se for o primeiro serviço, a base é a nota que o cliente deu agora
          const mediaAtual = totalAtual === 0 ? notaEstrelas : (anuncio.estrelas || 5.0); 

          // Calcula a nova média real
          let novaMedia = ((mediaAtual * totalAtual) + notaEstrelas) / (totalAtual + 1);
          
          // Garante que a nota não passe de 5.0 nem fique com muitas casas decimais
          novaMedia = Math.min(5.0, parseFloat(novaMedia.toFixed(1)));
          const novoTotal = totalAtual + 1;

          // Atualiza a vitrine pública do técnico
          await supabase
            .from('anuncios')
            .update({
              estrelas: novaMedia,
              totalAvaliacoes: novoTotal
            })
            .eq('id', String(pedidoAvaliacao.anuncioId));
        }
      }

      toast.success("🎉 Avaliação salva! A reputação do técnico foi atualizada no catálogo.");
      setPedidoAvaliacao(null); // Fecha o modal
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar a avaliação.");
    }
  };

  const abrirWhatsApp = (telefone: string) => {
    const num = telefone ? telefone.replace(/\D/g, '') : "";
    if (!num) {
      toast.error("Número de WhatsApp não encontrado.");
      return;
    }
    window.open(`https://wa.me/55${num}`, '_blank');
  };

  const pedidosExibidos = meusPedidos.filter(p => {
    if (!usuarioLocal) return false; 
    return abaAtiva === "cliente" 
      ? String(p.clienteId) === String(usuarioLocal.id) 
      : String(p.tecnicoId) === String(usuarioLocal.id);
  });

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center pt-28 pb-20 px-4 relative">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* MODAL DE AVALIAÇÃO COM ESTRELAS */}
      {pedidoAvaliacao && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-[2rem] border border-slate-700 w-full max-w-sm p-8 shadow-2xl text-center">
            <h2 className="text-2xl font-black text-white mb-2">Serviço Concluído!</h2>
            <p className="text-slate-400 text-sm mb-6">Como foi o atendimento de <span className="text-blue-400 font-bold">{pedidoAvaliacao.tecnicoNome}</span>?</p>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((estrela) => (
                <button 
                  key={estrela}
                  onClick={() => setNotaEstrelas(estrela)}
                  className={`text-4xl transition-all hover:scale-110 ${estrela <= notaEstrelas ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-slate-600'}`}
                >
                  {estrela <= notaEstrelas ? '★' : '☆'}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setPedidoAvaliacao(null)} className="flex-1 text-slate-400 font-bold hover:bg-slate-700 py-3 rounded-xl transition-colors border border-transparent hover:border-slate-600">
                Voltar
              </button>
              <button onClick={enviarAvaliacaoEConcluir} className="flex-[2] bg-green-600 text-white font-black py-3 rounded-xl shadow-lg shadow-green-900/50 hover:bg-green-500 transition-transform hover:-translate-y-1">
                Confirmar Avaliação
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">Painel de Negócios</h1>
            <p className="text-slate-400 text-sm mt-1">Acompanhe seus serviços e pagamentos.</p>
          </div>
          
          <div className="flex bg-slate-800 border border-slate-700 p-1 rounded-xl shadow-sm">
            <button onClick={() => setAbaAtiva("cliente")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${abaAtiva === "cliente" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>
              Serviços Solicitados
            </button>
            <button onClick={() => setAbaAtiva("tecnico")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${abaAtiva === "tecnico" ? "bg-green-600 text-white shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>
              Serviços Recebidos
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {pedidosExibidos.length === 0 ? (
            <p className="text-center text-slate-400 py-10 bg-slate-800 rounded-3xl border border-slate-700 shadow-md">Nenhum registro encontrado nesta aba.</p>
          ) : (
            pedidosExibidos.map(pedido => {
              const dataExibicao = pedido.dataHora ? pedido.dataHora.split(' ')[0] : (pedido.data || 'Data indisponível');
              const valorServico = pedido.valorServico || 0;
              const taxa = pedido.taxaPlataforma || 0;
              const total = pedido.valorTotal || 0;

              return (
                <div key={pedido.id} className="bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-lg flex flex-col md:flex-row gap-6 justify-between items-start hover:shadow-xl transition-shadow relative overflow-hidden">
                  
                  {/* Borda lateral colorida baseada no status */}
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                    pedido.status === 'concluido' ? 'bg-green-500' :
                    pedido.status === 'em_andamento' ? 'bg-blue-500' :
                    pedido.status === 'aguardando_pagamento' ? 'bg-amber-500' :
                    pedido.status === 'recusado' ? 'bg-red-500' : 'bg-slate-500'
                  }`}></div>

                  <div className="flex-1 pl-2 w-full">
                    <div className="flex items-center gap-3 mb-4">
                      {pedido.status === 'pendente' && <span className="text-[10px] font-black text-slate-300 bg-slate-700 px-3 py-1.5 rounded-lg uppercase">Aguardando Técnico</span>}
                      {pedido.status === 'aguardando_pagamento' && <span className="text-[10px] font-black text-amber-400 bg-amber-900/40 px-3 py-1.5 rounded-lg uppercase border border-amber-800/50">Aguardando Pagamento</span>}
                      {pedido.status === 'em_andamento' && <span className="text-[10px] font-black text-white bg-blue-600 px-3 py-1.5 rounded-lg uppercase shadow-lg shadow-blue-900/50">Em Andamento</span>}
                      {pedido.status === 'concluido' && <span className="text-[10px] font-black text-green-400 bg-green-900/40 px-3 py-1.5 rounded-lg uppercase border border-green-800/50">Finalizado</span>}
                      {pedido.status === 'recusado' && <span className="text-[10px] font-black text-red-400 bg-red-900/20 px-3 py-1.5 rounded-lg uppercase border border-red-800/50 line-through">Cancelado</span>}
                      
                      <span className="text-xs font-bold text-slate-500">{dataExibicao}</span>
                    </div>

                    <h3 className="text-xl font-black text-white">{pedido.tituloServico}</h3>
                    <p className="text-slate-400 text-sm mt-1 font-medium">
                      {abaAtiva === "cliente" ? `Técnico responsável: ${pedido.tecnicoNome}` : `Cliente: ${pedido.clienteNome}`}
                    </p>
                    
                    {/* LINHA DO TEMPO INSERIDA AQUI NO MEIO DO CARD */}
                    <TimelineDoPedido statusAtual={pedido.status} />

                    <div className="mt-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Problema relatado:</p>
                      <p className="text-sm text-slate-300 font-medium mb-3">{pedido.problema || 'Nenhum problema relatado.'}</p>
                      <p className="text-xs font-bold text-slate-400 mb-1">📍 {pedido.endereco || 'Endereço não informado'}</p>
                      {pedido.agendamento && (
                        <p className="text-xs font-black text-blue-400 mt-2 bg-blue-900/30 inline-block px-3 py-1.5 rounded-lg border border-blue-800/50">
                          📅 Agendado para: {pedido.agendamento}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="w-full md:w-72 flex flex-col items-center md:items-end gap-3 border-t md:border-t-0 md:border-l border-slate-700 pt-6 md:pt-0 md:pl-6 shrink-0">
                    <div className="text-center md:text-right w-full mb-2 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 shadow-inner">
                      {abaAtiva === "cliente" ? (
                        <>
                          <div className="flex justify-between text-xs text-slate-400 font-bold mb-1">
                            <span>Valor do Serviço:</span> <span className="text-slate-300">R$ {valorServico.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-400 font-bold mb-2">
                            <span>Taxa SuportFy:</span> <span className="text-slate-300">R$ {taxa.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-slate-700 pt-2 mt-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Total a Pagar</span>
                            <span className="text-2xl font-black text-green-400">R$ {total.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase">Valor a Receber</span>
                          <span className="text-2xl font-black text-green-400">R$ {valorServico.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {abaAtiva === "tecnico" && (
                      <>
                        {pedido.endereco && (
                          <div className="w-full mb-2 rounded-2xl overflow-hidden border border-slate-700 shadow-md bg-slate-800 h-32 relative">
                            <iframe 
                          width="100%" 
                          height="100%" 
                          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} 
                          loading="lazy" 
                          referrerPolicy="no-referrer-when-downgrade" 
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(pedido.endereco || '')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        ></iframe>
                          </div>
                        )}
                        {pedido.status === 'pendente' && (
                          <div className="w-full flex flex-col gap-2 mt-2">
                            <button onClick={() => handleAceitarServico(pedido)} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-black py-4 rounded-xl shadow-md transition-transform transform hover:-translate-y-1">Aceitar Serviço</button>
                            <button onClick={() => handleRecusarServico(pedido)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-600 text-xs font-black py-3 rounded-xl transition-colors">Recusar</button>
                          </div>
                        )}
                        {pedido.status === 'aguardando_pagamento' && (
                          <div className="w-full text-center bg-blue-900/30 text-blue-400 text-xs font-bold py-3 rounded-xl border border-blue-800/50">Aguardando cliente pagar o PIX...</div>
                        )}
                      </>
                    )}

                    {abaAtiva === "cliente" && (
                      <>
                        {pedido.status === 'pendente' && (
                          <div className="w-full text-center bg-slate-900/50 text-slate-400 text-xs font-bold py-3 rounded-xl border border-slate-700">Aguardando técnico aceitar...</div>
                        )}
                        {pedido.status === 'aguardando_pagamento' && (
                          <div className="flex flex-col items-center bg-amber-900/20 p-4 rounded-2xl border border-amber-800/50 w-full">
                            <p className="text-[10px] font-black text-amber-400 uppercase mb-2 text-center">Escaneie para reter o valor</p>
                            <div className="bg-white p-2 rounded-xl shadow-lg mb-3">
                              <QRCodeSVG value={`00020126360014BR.GOV.BCB.PIX0114+55799999999995204000053039865405${total}5802BR5914SuportFy6007Aracaju62070503***6304`} size={100} />
                            </div>
                            <button onClick={() => handleSimularPagamentoPix(pedido)} className="w-full bg-green-600 hover:bg-green-500 text-white text-xs font-black py-3 rounded-xl shadow-md transition-all">Simular Pagamento</button>
                          </div>
                        )}
                        {pedido.status === 'em_andamento' && (
                          <button onClick={() => abrirModalAvaliacao(pedido)} className="w-full bg-green-600 hover:bg-green-500 text-white text-sm font-black py-4 rounded-xl shadow-md transition-transform transform hover:-translate-y-1 mt-2">✅ Confirmar Conclusão</button>
                        )}
                      </>
                    )}

                    {pedido.status === 'recusado' && (
                      <div className="w-full text-center bg-slate-900/50 text-slate-500 text-xs font-bold py-3 rounded-xl border border-slate-800 mt-2">
                        {abaAtiva === "cliente" ? "O técnico recusou a solicitação." : "Você recusou este pedido."}
                      </div>
                    )}

                    {pedido.status === 'em_andamento' && (
                      <button onClick={() => abrirWhatsApp(abaAtiva === "cliente" ? (pedido.tecnicoTelefone || "") : (pedido.clienteTelefone || ""))} className="w-full bg-slate-800 border-2 border-green-600/50 text-green-400 text-sm font-black py-3 rounded-xl hover:bg-slate-700 hover:border-green-500 transition-all flex justify-center items-center gap-2 shadow-sm mt-2">
                        📱 Falar no WhatsApp
                      </button>
                    )}

                    {pedido.status === 'concluido' && (
                      <div className="w-full bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center shadow-inner mt-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Nota do Serviço</p>
                        <div className="flex gap-1 text-amber-400 text-xl">
                          {Array.from({ length: 5 }).map((_, i) => (<span key={i} className={i < (pedido.nota || 0) ? 'drop-shadow-[0_0_5px_rgba(251,191,36,0.4)]' : 'text-slate-600'}>{i < (pedido.nota || 0) ? '★' : '☆'}</span>))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}