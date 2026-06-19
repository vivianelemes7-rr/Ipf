import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarOuAtualizarVendedor } from './services/vendedorService';
import { obterPapelUsuarioAtual } from './services/sessionService';
import { sair } from './services/authService';

const FORMULARIO_INICIAL = {
    nome: '',
    email: '',
    senha: '',
    departamento: 'Vendas',
};

export default function CadastroVendedor() {
    const navegar = useNavigate();
    const papelUsuario = obterPapelUsuarioAtual();

    const permitido = useMemo(
        () => papelUsuario === 'gerente' || papelUsuario === 'administrador',
        [papelUsuario]
    );

    const [dadosFormulario, definirDadosFormulario] = useState(FORMULARIO_INICIAL);
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
            return 'Informe o nome do vendedor.';
        }

        if (!email) {
            return 'Informe o e-mail do vendedor.';
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            return 'Informe um e-mail válido.';
        }

        if (!senha) {
            return 'Informe uma senha para o vendedor.';
        }

        if (senha.length < 6) {
            return 'A senha deve ter no mínimo 6 caracteres.';
        }

        return '';
    };

    const aoEnviar = async (event) => {
        event.preventDefault();

        if (!permitido) {
            return;
        }

        definirErro('');
        definirRetorno('');

        const erroValidacao = validarFormulario();

        if (erroValidacao) {
            definirErro(erroValidacao);
            return;
        }

        definirSalvando(true);

        try {
            await criarOuAtualizarVendedor({
                nome: dadosFormulario.nome,
                email: dadosFormulario.email,
                senha: dadosFormulario.senha,
                departamento: dadosFormulario.departamento || 'Vendas',
            });

            definirRetorno('Vendedor salvo com sucesso no back.');
            definirDadosFormulario(FORMULARIO_INICIAL);
        } catch (erroRequisicao) {
            console.error('Erro ao salvar vendedor:', erroRequisicao);
            definirErro(erroRequisicao.message || 'Não foi possível salvar o vendedor.');
        } finally {
            definirSalvando(false);
        }
    };

    if (!permitido) {
        return (
            <div className="container py-5">
                <div className="card shadow-sm">
                    <div className="card-body">
                        <div className="d-flex justify-content-end mb-3">
                            <button
                                type="button"
                                className="btn btn-outline-primary me-2"
                                onClick={() => navegar('/alterar-senha')}
                            >
                                Alterar senha
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => {
                                    sair();
                                    navegar('/');
                                }}
                            >
                                Sair
                            </button>
                        </div>

                        <h1 className="mb-3">Cadastro de Vendedor</h1>
                        <p className="lead">Acesso restrito para gerência.</p>

                        <button
                            onClick={() => navegar('/dashboard')}
                            className="btn btn-primary mt-3"
                        >
                            Voltar ao Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="d-flex justify-content-end mb-3">
                        <button
                            type="button"
                            className="btn btn-outline-primary me-2"
                            onClick={() => navegar('/alterar-senha')}
                        >
                            Alterar senha
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => {
                                sair();
                                navegar('/');
                            }}
                        >
                            Sair
                        </button>
                    </div>

                    <h1 className="mb-3">Cadastro de Vendedor</h1>
                    <p className="lead">
                        Crie um perfil de vendedor usando a rota real do back.
                    </p>

                    {erro && (
                        <div className="alert alert-danger" role="alert">
                            {erro}
                        </div>
                    )}

                    <form onSubmit={aoEnviar}>
                        <div className="row g-3">
                            <div className="col-md-6">
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

                            <div className="col-md-6">
                                <label htmlFor="email" className="form-label">
                                    E-mail corporativo
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

                            <div className="col-md-6">
                                <label htmlFor="senha" className="form-label">
                                    Senha inicial
                                </label>

                                <input
                                    id="senha"
                                    name="senha"
                                    type="password"
                                    minLength="6"
                                    className="form-control"
                                    value={dadosFormulario.senha}
                                    onChange={aoAlterar}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="departamento" className="form-label">
                                    Departamento
                                </label>

                                <input
                                    id="departamento"
                                    name="departamento"
                                    type="text"
                                    className="form-control"
                                    value={dadosFormulario.departamento}
                                    onChange={aoAlterar}
                                    placeholder="Vendas"
                                />
                            </div>

                            <div className="d-flex gap-2 mt-4">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={salvando}
                                >
                                    {salvando ? 'Salvando...' : 'Salvar vendedor'}
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => navegar('/vendedores')}
                                >
                                    Ver vendedores
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => navegar('/dashboard')}
                                >
                                    Voltar ao Dashboard
                                </button>
                            </div>
                        </div>
                    </form>

                    {retorno && (
                        <div className="alert alert-success mt-3 mb-0" role="status">
                            {retorno}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
