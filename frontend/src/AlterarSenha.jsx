import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { sair } from './services/authService';

export default function AlterarSenha() {
    const navegar = useNavigate();
    const [senhaAtual, definirSenhaAtual] = useState('');
    const [novaSenha, definirNovaSenha] = useState('');
    const [confirmarSenha, definirConfirmarSenha] = useState('');

    const aoEnviar = (event) => {
        event.preventDefault();
        if (novaSenha !== confirmarSenha) {
            alert('As senhas não coincidem.');
            return;
        }
        alert('Senha alterada com sucesso!');
        definirSenhaAtual('');
        definirNovaSenha('');
        definirConfirmarSenha('');
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
                            <form onSubmit={aoEnviar}>
                                <div className="mb-3">
                                    <label className="form-label">Senha atual</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={senhaAtual}
                                        onChange={(e) => definirSenhaAtual(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Nova senha</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={novaSenha}
                                        onChange={(e) => definirNovaSenha(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label">Confirmar nova senha</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={confirmarSenha}
                                        onChange={(e) => definirConfirmarSenha(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary me-2">Salvar</button>
                                <button type="button" onClick={() => navegar('/dashboard')} className="btn btn-outline-secondary">Cancelar</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
