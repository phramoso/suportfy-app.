import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

interface Usuario {
  id: number | string;
  nome: string;
  foto?: string;
}

interface Notificacao {
  id: string | number;
  mensagem: string;
  data: string;
  lida: boolean;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  
  // NOVOS ESTADOS PARA A NOTIFICAÇÃO FLUTUANTE
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [dropdownNotificacoes, setDropdownNotificacoes] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Para fechar ao clicar fora

  useEffect(() => {
    setMenuAberto(false);
    setDropdownNotificacoes(false);
  }, [location]);

  // Fechar o dropdown de notificações se o usuário clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownNotificacoes(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const dados = localStorage.getItem("usuarioLogado");
    if (dados) {
      const userParsed = JSON.parse(dados) as Usuario;
      setUsuario(userParsed);

      const buscarNotificacoes = async () => {
        try {
          // AGORA TRAZEMOS TODOS OS DADOS (MENSAGEM, DATA), NÃO SÓ O ID
          const { data, error } = await supabase
            .from('notificacoes')
            .select('*')
            .eq('usuarioId', String(userParsed.id))
            .eq('lida', false)
            .order('data', { ascending: false }); // As mais novas primeiro

          if (error) throw error;
          setNotificacoes(data || []);
        } catch (erro) {
          console.error(erro);
        }
      };

      buscarNotificacoes();
      const interval = setInterval(buscarNotificacoes, 5000); // Checa a cada 5s
      return () => clearInterval(interval);
    } else {
      setUsuario(null);
      setNotificacoes([]);
    }
  }, [location]);

  // FUNÇÃO QUE RODA QUANDO O CLIENTE CLICA EM UMA NOTIFICAÇÃO ESPECÍFICA NA TELINHA
  const handleLerNotificacao = async (idNotificacao: string | number) => {
    try {
      // 1. Atualiza no Supabase para lida = true
      await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', String(idNotificacao));

      // 2. Remove da listagem local na hora (pra dar a sensação de velocidade)
      setNotificacoes(prev => prev.filter(n => String(n.id) !== String(idNotificacao)));
      
      // 3. Fecha a telinha e manda pro Painel
      setDropdownNotificacoes(false);
      navigate('/meus-pedidos');

    } catch (error) {
      console.error(error);
    }
  };

  const handleSair = () => {
    localStorage.removeItem("usuarioLogado");
    setUsuario(null);
    setNotificacoes([]);
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-[100] border-b border-slate-200 h-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
        
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-black text-blue-600 tracking-tighter hover:scale-105 transition-transform">
            Suporti<span className="text-slate-900">Fy</span>
          </Link>

          {usuario && (
            <div className="hidden md:flex gap-6">
              <Link to="/meus-pedidos" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
                Meus Serviços
              </Link>
              <Link to="/meus-anuncios" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
                Meus Anúncios
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {!usuario ? (
            <>
              <Link to="/login" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">Entrar</Link>
              <Link to="/cadastro" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-blue-100 transition-all">
                Cadastrar
              </Link>
            </>
          ) : (
            <>
              <Link to="/anuncio" className="hidden sm:block bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-green-100 transition-all">
                Anunciar
              </Link>

              <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden sm:block"></div>
              
              <Link to="/catálogo" className="hidden sm:block text-slate-600 hover:text-blue-600 font-bold transition-colors text-sm">
                Catálogo
              </Link>

              {/* ENVOLVRO DO SININHO E DA TELINHA FLUTUANTE */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setDropdownNotificacoes(!dropdownNotificacoes)} 
                  className={`relative p-2 sm:ml-2 transition-colors rounded-full hover:bg-slate-100 ${notificacoes.length > 0 ? 'text-blue-600' : 'text-slate-400'}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notificacoes.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-black text-white items-center justify-center">
                        {notificacoes.length}
                      </span>
                    </span>
                  )}
                </button>

                {/* TELINHA FLUTUANTE DE NOTIFICAÇÕES (DROPDOWN) */}
                {dropdownNotificacoes && (
                  <div className="absolute right-0 top-12 w-80 max-w-[90vw] bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-[110] flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="font-black text-slate-900 text-sm">Notificações</h3>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{notificacoes.length} novas</span>
                    </div>

                    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                      {notificacoes.length === 0 ? (
                        <div className="py-6 text-center flex flex-col items-center gap-2">
                          <span className="text-3xl">📭</span>
                          <p className="text-xs font-bold text-slate-400">Tudo limpo por aqui!</p>
                        </div>
                      ) : (
                        notificacoes.map((notif) => {
                          // Formatar a data para algo mais amigável
                          const dataFormatada = new Date(notif.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                          
                          return (
                            <div 
                              key={notif.id} 
                              onClick={() => handleLerNotificacao(notif.id)}
                              className="bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 p-3 rounded-xl cursor-pointer transition-colors group"
                            >
                              <p className="text-xs font-medium text-slate-700 leading-relaxed group-hover:text-blue-900">
                                {notif.mensagem}
                              </p>
                              <span className="text-[9px] font-bold text-blue-400 mt-2 block uppercase tracking-wider">
                                Hoje às {dataFormatada}
                              </span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PERFIL (DESKTOP) */}
              <div className="hidden sm:flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-100 ml-1">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-blue-100">
                  <img src={usuario.foto || 'https://via.placeholder.com/150'} alt="User" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <Link to="/perfil" className="text-[11px] font-black text-slate-900 leading-none hover:text-blue-600">
                    Meu Perfil
                  </Link>
                  <button onClick={handleSair} className="text-[9px] font-bold text-red-500 hover:text-red-600 text-left uppercase mt-1">
                    Sair
                  </button>
                </div>
              </div>

              {/* BOTÃO HAMBÚRGUER (CELULAR) */}
              <button 
                onClick={() => setMenuAberto(!menuAberto)} 
                className="sm:hidden p-2 ml-1 text-slate-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuAberto ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* MENU DROP-DOWN DO CELULAR (Permanece igual) */}
      {menuAberto && usuario && (
        <div className="sm:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-xl flex flex-col p-4 gap-3 z-[90]">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-blue-100">
              <img src={usuario.foto || 'https://via.placeholder.com/150'} alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-black text-slate-900">{usuario.nome}</span>
              <Link to="/perfil" className="text-xs font-bold text-blue-600 hover:underline">Ver Perfil</Link>
            </div>
          </div>

          <Link to="/anuncio" className="bg-green-600 text-white px-4 py-3.5 rounded-xl font-black text-center shadow-md">
            + Anunciar Serviço
          </Link>
          <Link to="/catálogo" className="text-slate-600 font-bold text-center py-3 bg-slate-50 rounded-xl border border-slate-100">
            Catálogo de Serviços
          </Link>
          <Link to="/meus-pedidos" className="text-slate-600 font-bold text-center py-3 bg-slate-50 rounded-xl border border-slate-100">
            Painel de Negócios
          </Link>
          <Link to="/meus-anuncios" className="text-slate-600 font-bold text-center py-3 bg-slate-50 rounded-xl border border-slate-100">
            Gerenciar Meus Anúncios
          </Link>
          
          <button onClick={handleSair} className="text-red-500 font-black text-center py-3 mt-2 border-t border-slate-100">
            Sair da Conta
          </button>
        </div>
      )}
    </nav>
  );
}