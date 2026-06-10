import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sair } from './services/authService';
import { requisicao } from './services/httpClient';

const FORMULARIO_INICIAL = {
    senhaAtual: '',
    senhaNova: '',
    confirmarSenha: '',
};

export default function AlterarSenha() {
    const navegar = useNavigate();

    const [formulario, definirFormulario] = useState(FORMULARIO_INICIAL);
    const [erro, definirErro] = useState('');
    const [retorno, definirRetorno] = useState('');
    const [salvando, definirSalvando] = useState(false);

    const aoAlterar = (evento) => {
        const { name, value } = evento.target;

        definirFormulario((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    };

    const validarFormulario = () => {
        const senhaAtual = formulario.senhaAtual.trim();
        const senhaNova = formulario.senhaNova.trim();
        const confirmarSenha = formulario.confirmarSenha.trim();

        if (!senhaAtual) {
            return 'Informe sua senha atual.';
        }

        if (!senhaNova) {
            return 'Informe a nova senha.';
        }

        if (senhaNova.length < 8) {
            return 'A nova senha deve ter no mínimo 8 caracteres.';
        }

        if (!confirmarSenha) {
            return 'Confirme a nova senha.';
        }

        if (senhaNova !== confirmarSenha) {
            return 'As senhas não coincidem.';
        }

        return '';
    };

    const aoEnviar = async (evento) => {
        evento.preventDefault();

        definirErro('');
        definirRetorno('');

        const erroValidacao = validarFormulario();

        if (erroValidacao) {
            definirErro(erroValidacao);
            return;
        }

        definirSalvando(true);

        try {
            const resposta = await requisicao('/auth/alterar-senha', {
                metodo: 'PATCH',
                corpo: {
                    senhaAtual: formulario.senhaAtual,
                    senhaNova: formulario.senhaNova,
                    confirmarSenha: formulario.confirmarSenha,
                },
            });

            definirRetorno(resposta?.mensagem || 'Senha alterada com sucesso!');
            definirFormulario(FORMULARIO_INICIAL);
        } catch (erroRequisicao) {
            console.error('Erro ao alterar senha:', erroRequisicao);
            definirErro(erroRequisicao.message || 'Não foi possível alterar a senha.');
        } finally {
            definirSalvando(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-7">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-end mb-3">
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

                            <h1 className="mb-3">Alterar Senha</h1>
                            <p className="text-muted">
                                Informe sua senha atual e defina uma nova senha.
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
                                    <label htmlFor="senhaAtual" className="form-label">
                                        Senha atual
                                    </label>
                                    <input
                                        id="senhaAtual"
                                        name="senhaAtual"
                                        type="password"
                                        className="form-control"
                                        value={formulario.senhaAtual}
                                        onChange={aoAlterar}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="senhaNova" className="form-label">
                                        Nova senha
                                    </label>
                                    <input
                                        id="senhaNova"
                                        name="senhaNova"
                                        type="password"
                                        className="form-control"
                                        value={formulario.senhaNova}
                                        onChange={aoAlterar}
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="confirmarSenha" className="form-label">
                                        Confirmar nova senha
                                    </label>
                                    <input
                                        id="confirmarSenha"
                                        name="confirmarSenha"
                                        type="password"
                                        className="form-control"
                                        value={formulario.confirmarSenha}
                                        onChange={aoAlterar}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary me-2"
                                    disabled={salvando}
                                >
                                    {salvando ? 'Salvando...' : 'Salvar'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navegar('/dashboard')}
                                    className="btn btn-outline-secondary"
                                >
                                    Cancelar
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
