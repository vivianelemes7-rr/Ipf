import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requisicao } from './services/httpClient';

const FORMULARIO_INICIAL = {
    nome: '',
    email: '',
    senha: '',
};

export default function Cadastro() {
    const navegar = useNavigate();

    const [dadosFormulario, definirDadosFormulario] = useState(FORMULARIO_INICIAL);
    const [confirmarSenha, definirConfirmarSenha] = useState('');
    const [retorno, definirRetorno] = useState('');
    const [erro, definirErro] = useState('');
    const [salvando, definirSalvando] = useState(false);

    const aoAlterar = (event) => {
        const { name, value } = event.target;

        definirDadosFormulario((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    };

    const validarFormulario = () => {
        const nome = dadosFormulario.nome.trim();
        const email = dadosFormulario.email.trim();
        const senha = dadosFormulario.senha.trim();

        if (!nome) {
            return 'Informe seu nome completo.';
        }

        if (!email) {
            return 'Informe seu e-mail.';
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            return 'Informe um e-mail válido.';
        }

        if (!senha) {
            return 'Informe uma senha.';
        }

        if (senha.length < 6) {
            return 'A senha deve ter no mínimo 6 caracteres.';
        }

        if (senha !== confirmarSenha) {
            return 'As senhas não coincidem.';
        }

        return '';
    };

    const aoEnviar = async (event) => {
        event.preventDefault();

        definirErro('');
        definirRetorno('');

        const erroValidacao = validarFormulario();

        if (erroValidacao) {
            definirErro(erroValidacao);
            return;
        }

        definirSalvando(true);

        try {
            const resposta = await requisicao('/auth/cadastrar', {
                metodo: 'POST',
                corpo: {
                    nome: dadosFormulario.nome.trim(),
                    email: dadosFormulario.email.trim().toLowerCase(),
                    senha: dadosFormulario.senha.trim(),
                },
            });

            definirRetorno(
                resposta?.mensagem ||
                'Cadastro solicitado com sucesso. Aguarde aprovação de um administrador.'
            );

            definirDadosFormulario(FORMULARIO_INICIAL);
            definirConfirmarSenha('');
        } catch (erroRequisicao) {
            console.error('Erro ao solicitar cadastro:', erroRequisicao);
            definirErro(erroRequisicao.message || 'Não foi possível solicitar o cadastro.');
        } finally {
            definirSalvando(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-7 col-lg-6">
                    <div className="card shadow-sm">
                        <div className="card-body p-4">
                            <h2 className="card-title text-center mb-4">
                                Solicitar cadastro
                            </h2>

                            <p className="text-muted text-center">
                                Preencha seus dados para solicitar acesso ao sistema.
                                O cadastro ficará pendente até aprovação de um administrador.
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
                                <div className="mb-3">
                                    <label htmlFor="nome" className="form-label">
                                        Nome completo
                                    </label>

                                    <input
                                        id="nome"
                                        name="nome"
                                        type="text"
                                        className="form-control"
                                        value={dadosFormulario.nome}
                                        onChange={aoAlterar}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">
                                        E-mail
                                    </label>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        className="form-control"
                                        value={dadosFormulario.email}
                                        onChange={aoAlterar}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="senha" className="form-label">
                                        Senha
                                    </label>

                                    <input
                                        id="senha"
                                        name="senha"
                                        type="password"
                                        className="form-control"
                                        value={dadosFormulario.senha}
                                        onChange={aoAlterar}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="confirmarSenha" className="form-label">
                                        Confirmar senha
                                    </label>

                                    <input
                                        id="confirmarSenha"
                                        name="confirmarSenha"
                                        type="password"
                                        className="form-control"
                                        value={confirmarSenha}
                                        onChange={(event) => definirConfirmarSenha(event.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 mb-3"
                                    disabled={salvando}
                                >
                                    {salvando ? 'Enviando...' : 'Solicitar cadastro'}
                                </button>
                            </form>

                            <div className="text-center">
                                <Link to="/" className="link-primary">
                                    Voltar ao login
                                </Link>
                            </div>

                            <div className="text-center mt-3">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => navegar('/')}
                                >
                                    Ir para login
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
