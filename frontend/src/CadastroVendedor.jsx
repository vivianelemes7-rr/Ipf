import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { criarOuAtualizarVendedor } from './services/vendedorService';
import { obterPapelUsuarioAtual } from './services/sessionService';
import { sair } from './services/authService';

const FORMULARIO_INICIAL = {
    nome: '',
    email: '',
    telefone: '',
    metaMensal: '',
    regiao: '',
};

export default function CadastroVendedor() {
    const navegar = useNavigate();
    const papelUsuario = obterPapelUsuarioAtual();
    const permitido = useMemo(() => papelUsuario === 'gerente' || papelUsuario === 'administrador', [papelUsuario]);
    const [dadosFormulario, definirDadosFormulario] = useState(FORMULARIO_INICIAL);
    const [retorno, definirRetorno] = useState('');

    const aoAlterar = (event) => {
        const { name, value } = event.target;
        definirDadosFormulario((anterior) => ({ ...anterior, [name]: value }));
    };

    const aoEnviar = (event) => {
        event.preventDefault();

        if (!permitido) {
            return;
        }

        criarOuAtualizarVendedor(dadosFormulario);
        definirRetorno('Perfil de vendedor salvo com sucesso.');
        definirDadosFormulario(FORMULARIO_INICIAL);
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
                        <p className="lead">Acesso restrito para gerencia.</p>
                        <button onClick={() => navegar('/dashboard')} className="btn btn-primary mt-3">Voltar ao Dashboard</button>
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
                    <p className="lead">Crie ou atualize o perfil de um vendedor para acompanhamento de metas.</p>

                    <form onSubmit={aoEnviar}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label htmlFor="nome" className="form-label">Nome completo</label>
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
                                <label htmlFor="email" className="form-label">E-mail corporativo</label>
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

                            <div className="col-md-4">
                                <label htmlFor="telefone" className="form-label">Telefone</label>
                                <input
                                    id="telefone"
                                    name="telefone"
                                    type="text"
                                    className="form-control"
                                    value={dadosFormulario.telefone}
                                    onChange={aoAlterar}
                                />
                            </div>

                            <div className="col-md-4">
                                <label htmlFor="metaMensal" className="form-label">Meta mensal (R$)</label>
                                <input
                                    id="metaMensal"
                                    name="metaMensal"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="form-control"
                                    value={dadosFormulario.metaMensal}
                                    onChange={aoAlterar}
                                />
                            </div>

                            <div className="col-md-4">
                                <label htmlFor="regiao" className="form-label">Regiao de atendimento</label>
                                <input
                                    id="regiao"
                                    name="regiao"
                                    type="text"
                                    className="form-control"
                                    value={dadosFormulario.regiao}
                                    onChange={aoAlterar}
                                />
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <button type="submit" className="btn btn-primary">Salvar perfil</button>
                            <button type="button" className="btn btn-outline-secondary" onClick={() => navegar('/dashboard')}>
                                Voltar ao Dashboard
                            </button>
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
