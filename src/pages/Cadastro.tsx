import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../supabaseClient";

const validarCPF = (cpfOriginal: string) => {
  const cpf = cpfOriginal.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
};

export default function Cadastro() {
  const navigate = useNavigate();
  
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [cidade, setCidade] = useState("Aracaju");
  const [bairro, setBairro] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, ''); 
    if (valor.length > 2) valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2'); 
    if (valor.length > 7) valor = valor.replace(/(\d{5})(\d)/, '$1-$2'); 
    setTelefone(valor.substring(0, 15)); 
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, ''); 
    if (valor.length > 3) valor = valor.replace(/^(\d{3})(\d)/, '$1.$2');
    if (valor.length > 6) valor = valor.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    if (valor.length > 9) valor = valor.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    setCpf(valor.substring(0, 14)); 
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 5) valor = valor.replace(/^(\d{5})(\d)/, '$1-$2');
    setCep(valor.substring(0, 9));
  };

  const buscarCep = async () => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setRua(data.logradouro);
        setBairro(data.bairro);
        setCidade(data.localidade);
      } else {
        toast.error("CEP não encontrado.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao buscar o CEP.");
    }
  };

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();

    if (!nome || !email || !senha || !confirmarSenha || !telefone || !cpf || !cep || !bairro || !rua) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (senha !== confirmarSenha) {
      toast.error("As senhas não coincidem. Verifique e tente novamente.");
      return;
    }

    if (!validarCPF(cpf)) {
      toast.error("O CPF informado é inválido. Verifique a numeração.");
      return;
    }

    try {
      const { data: usuariosExistentes, error: erroBusca } = await supabase
        .from('usuarios')
        .select('email, cpf')
        .or(`email.eq.${email},cpf.eq.${cpf}`);

      if (erroBusca) throw erroBusca;

      if (usuariosExistentes && usuariosExistentes.length > 0) {
        const duplicado = usuariosExistentes.find(u => u.email === email);
        if (duplicado) {
          toast.error("Este e-mail já está cadastrado no sistema.");
        } else {
          toast.error("Este CPF já está vinculado a outra conta.");
        }
        return; 
      }

      const usuario = { 
        id: Date.now().toString(),
        nome, 
        email, 
        senha, 
        telefone, 
        cpf,
        cep,
        cidade, 
        bairro, 
        rua, 
        numero,
        foto: `https://ui-avatars.com/api/?name=${nome}&background=random` 
      };

      const { error: erroInsert } = await supabase
        .from('usuarios')
        .insert([usuario]);

      if (erroInsert) throw erroInsert;

      toast.success("Cadastro realizado com sucesso no SuportFy!");
      
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      
    } catch (error: unknown) {
      console.error(error);
      toast.error("Erro ao conectar com o banco de dados.");
    }
  }

  const inputStyle = "w-full p-4 bg-slate-900/50 border border-slate-700 text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium placeholder-slate-500";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 pt-32 pb-20 relative">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="bg-slate-800 p-10 rounded-[2.5rem] shadow-xl border border-slate-700 w-full max-w-xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-white tracking-tight">Criar Conta</h2>
          <p className="text-slate-400 mt-2 text-sm font-medium">Preencha seus dados para começar.</p>
        </div>

        <form onSubmit={cadastrar} className="flex flex-col gap-4">
          
          <input className={inputStyle} placeholder="Nome Completo *" value={nome} onChange={(e) => setNome(e.target.value)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className={inputStyle} placeholder="WhatsApp *" value={telefone} onChange={handleTelefoneChange} />
            <input className={inputStyle} placeholder="CPF *" value={cpf} onChange={handleCpfChange} />
          </div>

          <input className={inputStyle} placeholder="E-mail *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SENHA */}
            <div className="relative w-full">
              <input 
                className={`${inputStyle} pr-12`} 
                placeholder="Senha *" 
                type={mostrarSenha ? "text" : "password"} 
                value={senha} 
                onChange={(e) => setSenha(e.target.value)} 
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors focus:outline-none flex items-center justify-center"
              >
                {mostrarSenha ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>

            {/* CONFIRMAR SENHA */}
            <div className="relative w-full">
              <input 
                className={`${inputStyle} pr-12`} 
                placeholder="Confirmar Senha *" 
                type={mostrarConfirmarSenha ? "text" : "password"} 
                value={confirmarSenha} 
                onChange={(e) => setConfirmarSenha(e.target.value)} 
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors focus:outline-none flex items-center justify-center"
              >
                {mostrarConfirmarSenha ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              className={inputStyle} 
              placeholder="CEP *" 
              value={cep} 
              onChange={handleCepChange} 
              onBlur={buscarCep} 
            />
            <input className={`col-span-2 ${inputStyle}`} placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          </div>

          <input className={inputStyle} placeholder="Bairro *" value={bairro} onChange={(e) => setBairro(e.target.value)} />

          <div className="grid grid-cols-3 gap-4">
            <input className={`col-span-2 ${inputStyle}`} placeholder="Rua / Avenida *" value={rua} onChange={(e) => setRua(e.target.value)} />
            <input className={inputStyle} placeholder="Nº *" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl mt-4 transition-all shadow-lg shadow-blue-900/50 transform hover:-translate-y-1">
            Finalizar Cadastro
          </button>
          
          <p className="text-center text-slate-400 text-sm font-bold mt-2">
            Já tem conta? <button type="button" onClick={() => navigate('/login')} className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">Fazer Login</button>
          </p>
        </form>
      </div>
    </div>
  );
}