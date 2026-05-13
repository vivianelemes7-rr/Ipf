import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sair } from './services/authService';

export default function Cadastro() {
    const navegar = useNavigate();
    const [dadosFormulario, definirDadosFormulario] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
    });

    const aoAlterar = (event) => {
        const { name, value } = event.target;
        definirDadosFormulario((anterior) => ({ ...anterior, [name]: value }));
    };

    const aoEnviar = (event) => {
        event.preventDefault();
        if (dadosFormulario.senha !== dadosFormulario.confirmarSenha) {
            alert('As senhas não coincidem.');
            return;
        }

        console.log('Cadastro enviado:', dadosFormulario);
        alert('Cadastro enviado com sucesso!');
        definirDadosFormulario({ nome: '', email: '', senha: '', confirmarSenha: '' });
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-7 col-lg-6">
                    <div className="card shadow-sm">
                        <div className="card-body p-4">
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
                                        name="confirmarSenha"
                                        type="password"
                                        className="form-control"
                                        value={dadosFormulario.confirmarSenha}
                                        onChange={aoAlterar}
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
