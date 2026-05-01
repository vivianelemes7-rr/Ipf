import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MDBInput, MDBBtn } from 'mdb-react-ui-kit';
import './Login.css';
import { autenticar } from './services/authService';

const Login = () => {
  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [tipoLogin, definirTipoLogin] = useState('administrador');
  const [estaEnviando, definirEstaEnviando] = useState(false);
  const [mensagemErro, definirMensagemErro] = useState('');
  const navegar = useNavigate();

  const EsquecerSenha = ({ aoNavegar }) => {
    const aoClicarEsqueciSenha = (e) => {
      e.preventDefault();
      localStorage.setItem('sfera_page', 'forgot');
      aoNavegar('forgot');
    };

    return (
      <div className='animate__animated animate__fadeIn'>
        <h4 className='fw-bold mb-4' style={{ color: '#0f172a' }}>Acessar Conta</h4>
        <MDBInput wrapperClass='mb-4' label='E-mail corporativo' type='email' size='lg' />
        <MDBInput wrapperClass='mb-4' label='Senha' type='password' size='lg' />

        <MDBBtn className='w-100 mb-3' size='lg' style={{ backgroundColor: '#0f172a' }}>
          Entrar
        </MDBBtn>

        <div className='text-center'>
          <a href='#!' onClick={aoClicarEsqueciSenha}
            style={{ color: '#38bdf8', fontSize: '0.9rem', fontWeight: '500' }}>
            Esqueceu a senha?
          </a>
        </div>
      </div>
    );
  };

  const aoEnviar = async (e) => {
    e.preventDefault();

    definirEstaEnviando(true);
    definirMensagemErro('');

    try {
      await autenticar({ email, senha, papel: tipoLogin });
      navegar('/dashboard');
    } catch (erro) {
      definirMensagemErro(erro.message || 'Nao foi possivel autenticar.');
    } finally {
      definirEstaEnviando(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-login-container">
        <div className="login-brand-side">
          <div className="brand-content">
            <h1>IPF<span>Sistemas</span></h1>
            <p>Sua central inteligente de gestão e relacionamento.</p>
          </div>
        </div>

        <div className="login-form-side">
          <form className="login-box" onSubmit={aoEnviar}>
            <h2>Bem-vindo</h2>
            <p className="subtitle">Acesse sua conta para continuar</p>

            <div className="input-group">
              <label>Tipo de acesso</label>
              <select
                value={tipoLogin}
                onChange={(e) => definirTipoLogin(e.target.value)}
                required
              >
                <option value="vendedor">Vendedor</option>
                <option value="administrador">Administrador</option>
                <option value="arquitetura">Arquitetura</option>
                <option value="financeiro">Financeiro</option>
                <option value="producao">Produção</option>
                <option value="gerente">Gerente</option>
              </select>
            </div>

            <div className="input-group">
              <label>E-mail</label>
              <input
                type="email"
                placeholder="exemplo@empresa.com"
                value={email}
                onChange={(e) => definirEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Senha</label>
              <input
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => definirSenha(e.target.value)}
                required
              />
            </div>

            <div className="form-options">
              <Link to="/esquecer-senha">Esqueceu a senha?</Link>
            </div>

            <button type="submit" className="btn-primary" disabled={estaEnviando}>
              {estaEnviando ? 'Entrando...' : 'Entrar no Sistema'}
            </button>

            {mensagemErro && (
              <p role="alert" style={{ color: '#b42318', marginTop: '12px', marginBottom: 0 }}>
                {mensagemErro}
              </p>
            )}

            <div className="footer-links">
              <span>Ainda não tem acesso?</span>
              <Link to="/cadastro" className="register-link">Solicitar cadastro</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;