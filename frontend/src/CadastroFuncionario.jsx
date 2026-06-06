import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sair } from './services/authService';
import { excluirFuncionario, listarFuncionarios, salvarFuncionario } from './services/funcionarioService';
import { obterPapelUsuarioAtual } from './services/sessionService';

const FORMULARIO_INICIAL = {
    id: '',
    nome: '',
    email: '',
    senha: '',
    papel: 'vendedor',
};

export default function Cadastro() {
    const navegar = useNavigate();
    const papelUsuario = obterPapelUsuarioAtual();
    const podeGerenciar = useMemo(
        () => papelUsuario === 'administrador' || papelUsuario === 'gerente',
        [papelUsuario]
    );
    const [dadosFormulario, definirDadosFormulario] = useState(FORMULARIO_INICIAL);
    const [confirmarSenha, definirConfirmarSenha] = useState('');
    const [retorno, definirRetorno] = useState('');
    const [funcionarios, definirFuncionarios] = useState(() => listarFuncionarios());

    const aoAlterar = (event) => {
        const { name, value } = event.target;
        definirDadosFormulario((anterior) => ({ ...anterior, [name]: value }));
    };

    const aoEnviar = (event) => {
        event.preventDefault();
        if (!podeGerenciar) {
            definirRetorno('Apenas ADM e Gerente podem cadastrar perfis.');
            return;
        }

        if (dadosFormulario.senha !== confirmarSenha) {
            alert('As senhas não coincidem.');
            return;
        }

        try {
            salvarFuncionario(dadosFormulario);
            definirFuncionarios(listarFuncionarios());
            definirRetorno('Funcionario salvo com sucesso.');
            definirDadosFormulario(FORMULARIO_INICIAL);
            definirConfirmarSenha('');
        } catch (erro) {
            definirRetorno(erro.message || 'Nao foi possivel salvar o funcionario.');
        }
    };

    const aoEditar = (funcionario) => {
        definirDadosFormulario({
            id: funcionario.id,
            nome: funcionario.nome,
            email: funcionario.email,
            senha: funcionario.senha,
            papel: funcionario.papel,
        });
        definirConfirmarSenha(funcionario.senha || '');
    };

    const aoExcluir = (email) => {
        if (!window.confirm(`Deseja excluir o funcionario ${email}?`)) return;
        excluirFuncionario(email);
        definirFuncionarios(listarFuncionarios());
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-7 col-lg-6">
                    <div className="card shadow-sm">
                        <div className="card-body p-4">
                            <h2 className="card-title text-center mb-4">Cadastro de Usuário</h2>
                            <form onSubmit={aoEnviar}>
                                <div className="mb-3">
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

                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label">E-mail</label>
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
                                    <label htmlFor="papel" className="form-label">Perfil</label>
                                    <select
                                        id="papel"
                                        name="papel"
                                        className="form-select"
                                        value={dadosFormulario.papel}
                                        onChange={aoAlterar}
                                        required
                                    >
                                        <option value="vendedor">Vendedor</option>
                                        <option value="administrador">Administrador</option>
                                        <option value="arquitetura">Arquitetura</option>
                                        <option value="financeiro">Financeiro</option>
                                        <option value="producao">Producao</option>
                                        <option value="logistica">Logistica</option>
                                        <option value="gerente">Gerente</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="senha" className="form-label">Senha</label>
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
                                    <label htmlFor="confirmarSenha" className="form-label">Confirmar senha</label>
                                    <input
                                        id="confirmarSenha"
                                        type="password"
                                        className="form-control"
                                        value={confirmarSenha}
                                        onChange={(event) => definirConfirmarSenha(event.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary w-100 mb-3">
                                    Cadastrar
                                </button>
                            </form>
                            <div className="text-center">
                                <Link to="/" className="link-primary">
                                    Voltar ao login
                                </Link>
                            </div>

                            {retorno && (
                                <p style={{ marginTop: '12px', marginBottom: 0, color: '#0f5132' }}>{retorno}</p>
                            )}

                            <hr />
                            <h5>Funcionarios cadastrados</h5>
                            <div className="table-responsive">
                                <table className="table table-sm table-striped align-middle">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>E-mail</th>
                                            <th>Perfil</th>
                                            <th>Acoes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {funcionarios.map((funcionario) => (
                                            <tr key={funcionario.id || funcionario.email}>
                                                <td>{funcionario.nome}</td>
                                                <td>{funcionario.email}</td>
                                                <td>{funcionario.papel}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-primary btn-sm"
                                                            onClick={() => aoEditar(funcionario)}
                                                            disabled={!podeGerenciar}
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => aoExcluir(funcionario.email)}
                                                            disabled={!podeGerenciar}
                                                        >
                                                            Excluir
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
