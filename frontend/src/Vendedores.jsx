import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obterUsuarioAtual, obterPapelUsuarioAtual } from './services/sessionService';
import { obterTodosVendedores, excluirVendedor } from './services/vendedorService';
import { sair } from './services/authService';

function formatarData(data) {
    if (!data) return '-';

    const dataObj = new Date(data);
    if (Number.isNaN(dataObj.getTime())) return '-';

    return dataObj.toLocaleDateString('pt-BR');
}

function formatarStatus(statusAtivo) {
    return statusAtivo ? 'Ativo' : 'Inativo';
}

export default function Vendedores() {
    const navegar = useNavigate();
    const papelAtual = obterPapelUsuarioAtual();
    const usuarioAtual = obterUsuarioAtual();

    const [perfilVendedorAtual, definirPerfilVendedorAtual] = useState(null);
    const [listaVendedores, definirListaVendedores] = useState([]);
    const [carregando, definirCarregando] = useState(true);
    const [erro, definirErro] = useState('');

    const ehVendedor = papelAtual === 'vendedor';
    const podeGerenciarVendedores = papelAtual === 'gerente' || papelAtual === 'administrador';

    const carregarVendedores = useCallback(async () => {
        definirCarregando(true);
        definirErro('');

        try {
            const vendedores = await obterTodosVendedores();
            definirListaVendedores(vendedores);

            if (usuarioAtual?.email) {
                const perfilSalvo = vendedores.find((vendedor) =>
                    vendedor.email?.toLowerCase() === usuarioAtual.email.toLowerCase()
                );

                if (perfilSalvo) {
                    definirPerfilVendedorAtual(perfilSalvo);
                } else if (ehVendedor) {
                    definirPerfilVendedorAtual({
                        nome: usuarioAtual.name || 'Vendedor',
                        email: usuarioAtual.email,
                        cargo: 'Vendedor',
                        statusAtivo: true,
                        departamento: 'Vendas',
                        dataCadastro: '',
                    });
                } else {
                    definirPerfilVendedorAtual(null);
                }
            }
        } catch (erroRequisicao) {
            console.error('Erro ao carregar vendedores:', erroRequisicao);
            definirErro(erroRequisicao.message || 'Não foi possível carregar os vendedores.');
            definirListaVendedores([]);

            if (ehVendedor && usuarioAtual?.email) {
                definirPerfilVendedorAtual({
                    nome: usuarioAtual.name || 'Vendedor',
                    email: usuarioAtual.email,
                    cargo: 'Vendedor',
                    statusAtivo: true,
                    departamento: 'Vendas',
                    dataCadastro: '',
                });
            }
        } finally {
            definirCarregando(false);
        }
    }, [ehVendedor, usuarioAtual?.email, usuarioAtual?.name]);

    useEffect(() => {
        carregarVendedores();
    }, [carregarVendedores]);

    const aoDesativar = async (vendedor) => {
        if (!vendedor?.id) {
            definirErro('Vendedor inválido para desativação.');
            return;
        }

        if (!window.confirm(`Desativar o vendedor "${vendedor.email}"?`)) {
            return;
        }

        try {
            await excluirVendedor(vendedor.id);
            await carregarVendedores();
        } catch (erroDesativacao) {
            console.error('Erro ao desativar vendedor:', erroDesativacao);
            definirErro(erroDesativacao.message || 'Não foi possível desativar o vendedor.');
        }
    };

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

                    {erro && (
                        <div className="alert alert-danger" role="alert">
                            {erro}
                        </div>
                    )}

                    {ehVendedor && (
                        <>
                            <p className="lead">Este é o seu perfil de vendedor.</p>

                            {perfilVendedorAtual ? (
                                <div className="border rounded p-3 bg-light">
                                    <p className="mb-2">
                                        <strong>Nome:</strong> {perfilVendedorAtual.nome || '-'}
                                    </p>
                                    <p className="mb-2">
                                        <strong>E-mail:</strong> {perfilVendedorAtual.email || '-'}
                                    </p>
                                    <p className="mb-2">
                                        <strong>Cargo:</strong> {perfilVendedorAtual.cargo || 'Vendedor'}
                                    </p>
                                    <p className="mb-2">
                                        <strong>Departamento:</strong> {perfilVendedorAtual.departamento || '-'}
                                    </p>
                                    <p className="mb-2">
                                        <strong>Status:</strong> {formatarStatus(perfilVendedorAtual.statusAtivo)}
                                    </p>
                                    <p className="mb-0">
                                        <strong>Cadastro:</strong> {formatarData(perfilVendedorAtual.dataCadastro)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-muted mb-0">Seu perfil ainda não foi cadastrado pela gerência.</p>
                            )}
                        </>
                    )}

                    {podeGerenciarVendedores && (
                        <>
                            <p className="lead">Analise os vendedores cadastrados e acesse o cadastro de novos perfis.</p>

                            {carregando ? (
                                <p className="text-muted">Carregando vendedores...</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-striped table-bordered align-middle">
                                        <thead>
                                            <tr>
                                                <th>Nome</th>
                                                <th>E-mail</th>
                                                <th>Cargo</th>
                                                <th>Departamento</th>
                                                <th>Status</th>
                                                <th>Cadastro</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {listaVendedores.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="text-center text-muted">
                                                        Nenhum vendedor cadastrado.
                                                    </td>
                                                </tr>
                                            ) : (
                                                listaVendedores.map((vendedor) => (
                                                    <tr key={vendedor.id || vendedor.email}>
                                                        <td>{vendedor.nome || '-'}</td>
                                                        <td>{vendedor.email || '-'}</td>
                                                        <td>{vendedor.cargo || 'Vendedor'}</td>
                                                        <td>{vendedor.departamento || '-'}</td>
                                                        <td>{formatarStatus(vendedor.statusAtivo)}</td>
                                                        <td>{formatarData(vendedor.dataCadastro)}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-warning btn-sm"
                                                                onClick={() => aoDesativar(vendedor)}
                                                                disabled={!vendedor.statusAtivo}
                                                            >
                                                                {vendedor.statusAtivo ? 'Desativar' : 'Inativo'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <button
                                onClick={() => navegar('/cadastro-vendedor')}
                                className="btn btn-outline-primary mt-2"
                            >
                                Ir para Cadastro de Vendedor
                            </button>
                        </>
                    )}

                    {!ehVendedor && !podeGerenciarVendedores && (
                        <p className="lead mb-0">Seu perfil não possui acesso detalhado a dados de vendedores.</p>
                    )}

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
