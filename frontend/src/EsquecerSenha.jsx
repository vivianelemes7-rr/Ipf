import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EsquecerSenha.css';
import { requisicao } from './services/httpClient';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EsquecerSenha = () => {
    const navegar = useNavigate();

    const [email, definirEmail] = useState('');
    const [erro, definirErro] = useState('');
    const [retorno, definirRetorno] = useState('');
    const [enviando, definirEnviando] = useState(false);

    const validarEmail = () => {
        const emailNormalizado = email.trim();

        if (!emailNormalizado) {
            return 'Informe o e-mail cadastrado.';
        }

        if (!EMAIL_REGEX.test(emailNormalizado)) {
            return 'Informe um e-mail válido.';
        }

        return '';
    };

    const aoEnviar = async (evento) => {
        evento.preventDefault();

        definirErro('');
        definirRetorno('');

        const erroValidacao = validarEmail();

        if (erroValidacao) {
            definirErro(erroValidacao);
            return;
        }

        definirEnviando(true);

        try {
            const resposta = await requisicao('/auth/esquecer-senha', {
                metodo: 'POST',
                corpo: {
                    email: email.trim().toLowerCase(),
                },
            });

            definirRetorno(
                resposta?.mensagem ||
                'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.'
            );
        } catch (erroRequisicao) {
            console.error('Erro ao solicitar redefinição de senha:', erroRequisicao);
            definirErro(erroRequisicao.message || 'Não foi possível solicitar a redefinição de senha.');
        } finally {
            definirEnviando(false);
        }
    };

    const aoIrLogin = () => {
        navegar('/', { replace: true });
    };

    return (
        <div className="forgot-page-wrapper">
            <div className="forgot-container">
                <div className="animate-fade-in">
                    <h4 className="title">Recuperar Senha</h4>
                    <p className="subtitle">
                        Insira seu e-mail para receber as instruções.
                    </p>

                    {erro && (
                        <div className="alert alert-danger" role="alert">
                            {erro}
                        </div>
                    )}

                    {retorno && (
                        <div className="alert alert-success" role="status">
                            {retorno}
                        </div>
                    )}

                    <form onSubmit={aoEnviar}>
                        <div className="input-wrapper mb-4">
                            <label htmlFor="email" className="form-label">
                                E-mail cadastrado
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="form-control"
                                value={email}
                                onChange={(evento) => definirEmail(evento.target.value)}
                                required
                            />
                        </div>

                        <button
                            className="btn-recovery"
                            type="submit"
                            disabled={enviando}
                        >
                            {enviando ? 'Enviando...' : 'Enviar Link de Redefinição'}
                        </button>
                    </form>

                    <div className="text-center">
                        <button
                            type="button"
                            className="back-link"
                            onClick={aoIrLogin}
                        >
                            ← Voltar para o Login
                        </button>
                    </div>

                    <div className="footer-copy">
                        IPF Sistemas
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EsquecerSenha;
