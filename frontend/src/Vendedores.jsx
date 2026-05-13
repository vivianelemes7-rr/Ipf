import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { obterUsuarioAtual, obterPapelUsuarioAtual } from './services/sessionService';
import { encontrarVendedorPorEmail, obterTodosVendedores, excluirVendedor } from './services/vendedorService';
import { sair } from './services/authService';

export default function Vendedores() {
    const navegar = useNavigate();
    const papelAtual = obterPapelUsuarioAtual();
    const usuarioAtual = obterUsuarioAtual();

    const perfilVendedorAtual = useMemo(() => {
        if (!usuarioAtual?.email) {
            return null;
        }

        const perfilSalvo = encontrarVendedorPorEmail(usuarioAtual.email);
        if (perfilSalvo) {
            return perfilSalvo;
        }

        if (papelAtual === 'vendedor') {
            return {
                nome: usuarioAtual.name || 'Vendedor',
                email: usuarioAtual.email,
                telefone: '',
                metaMensal: 0,
                regiao: '',
            };
        }

        return null;
    }, [papelAtual, usuarioAtual]);

    const [listaVendedores, definirListaVendedores] = useState(() => obterTodosVendedores());
    const ehVendedor = papelAtual === 'vendedor';
    const podeGerenciarVendedores = papelAtual === 'gerente' || papelAtual === 'administrador';

    const aoRemover = useCallback((email) => {
        if (!window.confirm(`Remover o vendedor "${email}"?`)) {
            return;
        }
        excluirVendedor(email);
        definirListaVendedores(obterTodosVendedores());
    }, []);

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
                    <h1 className="mb-3">Vendedores</h1>
                    {ehVendedor && (
                        <>
                            <p className="lead">Este e o seu perfil de vendedor.</p>
                            {perfilVendedorAtual ? (
                                <div className="border rounded p-3 bg-light">
                                    <p className="mb-2"><strong>Nome:</strong> {perfilVendedorAtual.nome || '-'}</p>
                                    <p className="mb-2"><strong>E-mail:</strong> {perfilVendedorAtual.email || '-'}</p>
                                    <p className="mb-2"><strong>Telefone:</strong> {perfilVendedorAtual.telefone || '-'}</p>
                                    <p className="mb-2"><strong>Meta mensal:</strong> R$ {Number(perfilVendedorAtual.metaMensal || 0).toFixed(2)}</p>
                                    <p className="mb-0"><strong>Regiao:</strong> {perfilVendedorAtual.regiao || '-'}</p>
                                </div>
                            ) : (
                                <p className="text-muted mb-0">Seu perfil ainda nao foi cadastrado pela gerencia.</p>
                            )}
                        </>
                    )}

                    {podeGerenciarVendedores && (
                        <>
                            <p className="lead">Analise os vendedores cadastrados e acesse o cadastro de novos perfis.</p>
                            <div className="table-responsive">
                                <table className="table table-striped table-bordered align-middle">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>E-mail</th>
                                            <th>Telefone</th>
                                            <th>Meta mensal (R$)</th>
                                            <th>Regiao</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listaVendedores.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center text-muted">Nenhum vendedor cadastrado.</td>
                                            </tr>
                                        ) : (
                                            listaVendedores.map((vendedor) => (
                                                <tr key={vendedor.id || vendedor.email}>
                                                    <td>{vendedor.nome || '-'}</td>
                                                    <td>{vendedor.email || '-'}</td>
                                                    <td>{vendedor.telefone || '-'}</td>
                                                    <td>{Number(vendedor.metaMensal || 0).toFixed(2)}</td>
                                                    <td>{vendedor.regiao || '-'}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => aoRemover(vendedor.email)}
                                                        >
                                                            Remover
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <button onClick={() => navegar('/cadastro-vendedor')} className="btn btn-outline-primary mt-2">
                                Ir para Cadastro de Vendedor
                            </button>
                        </>
                    )}

                    {!ehVendedor && !podeGerenciarVendedores && (
                        <p className="lead mb-0">Seu perfil nao possui acesso detalhado a dados de vendedores.</p>
                    )}

                    <button onClick={() => navegar('/dashboard')} className="btn btn-primary mt-3">Voltar ao Dashboard</button>
                </div>
            </div>
        </div>
    );
}
