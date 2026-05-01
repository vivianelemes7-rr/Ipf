import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MDBInput,
    MDBIcon,
    MDBModal,
    MDBModalDialog,
    MDBModalContent,
    MDBModalHeader,
    MDBModalBody,
    MDBModalFooter,
} from 'mdb-react-ui-kit';
import './EsquecerSenha.css';
import { sair } from './services/authService';

const EsquecerSenha = () => {
    const navegar = useNavigate();
    const [email, definirEmail] = useState('');
    const [mostrarModal, definirMostrarModal] = useState(false);

    const aoEnviar = (e) => {
        e.preventDefault();
        if (email.trim()) {
            definirMostrarModal(true);
        }
    };

    const aoIrLogin = () => {
        definirMostrarModal(false);
        navegar('/', { replace: true });
    };

    return (
        <div className="forgot-page-wrapper">
            <div className="forgot-container">
                <div className="animate-fade-in">
                    <div className="d-flex justify-content-end mb-2">
                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm me-2"
                            onClick={() => navegar('/alterar-senha')}
                        >
                            Alterar senha
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => {
                                sair();
                                navegar('/', { replace: true });
                            }}
                        >
                            Sair
                        </button>
                    </div>
                    <h4 className="title">Recuperar Senha</h4>
                    <p className="subtitle">Insira seu e-mail para receber as instruções.</p>

                    <form onSubmit={aoEnviar}>
                        <MDBInput className='input'
                            wrapperClass="mb-4"
                            label="E-mail cadastrado"
                            type="email"
                            size="lg"
                            value={email}
                            onChange={(e) => definirEmail(e.target.value)}
                            required
                        />

                        <button className="btn-recovery" type="submit">
                            Enviar Link de Redefinição
                        </button>
                    </form>

                    <div className="text-center">
                        <button type="button" className="back-link" onClick={aoIrLogin}>
                            <MDBIcon fas icon="arrow-left" className="me-2" />
                            Voltar para o Login
                        </button>
                    </div>

                    <MDBModal show={mostrarModal} setShow={definirMostrarModal} tabIndex='-1'>
                        <MDBModalDialog centered>
                            <MDBModalContent style={{ borderRadius: '16px', border: 'none' }}>
                                <MDBModalHeader className='border-0 justify-content-center pt-4'>
                                    <div className='success-icon-wrapper'>
                                        <MDBIcon fas icon='paper-plane' size='2x' style={{ color: '#00bcd4' }} />
                                    </div>
                                </MDBModalHeader>
                                <MDBModalBody className='text-center px-4 pb-4'>
                                    <h5 className='fw-bold mb-3' style={{ color: '#0f172a' }}>
                                        E-mail enviado!
                                    </h5>
                                    <p className='text-muted small'>
                                        Verifique a caixa de entrada de <strong>{email}</strong> e siga as instruções para redefinir sua senha.
                                    </p>
                                </MDBModalBody>
                                <MDBModalFooter className='border-0 p-3'>
                                    <button
                                        className='btn-recovery'
                                        type='button'
                                        onClick={aoIrLogin}
                                        style={{ backgroundColor: '#0f172a', borderRadius: '8px', fontWeight: '600' }}
                                    >
                                        Ok, voltar
                                    </button>
                                </MDBModalFooter>
                            </MDBModalContent>
                        </MDBModalDialog>
                    </MDBModal>

                    <div className='footer-copy'>
                        IPF Sistemas
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EsquecerSenha;
