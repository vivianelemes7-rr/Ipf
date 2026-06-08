import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import './notificacaoKanban.css';
import { PAPEIS_PERMITIDOS } from './config/roles';
import { listarQuadrosKanban } from './services/kanbanService';
import {
    listarNotificacoesKanban,
    marcarNotificacaoComoLida,
    marcarTodasNotificacoesComoLidas,
    obterPapeisComAcessoAoQuadro,
    verificarNotificacoesInatividade,
    verificarAlertasSlaComercial,
} from './services/notificacaoKanbanService';
import { obterPapelUsuarioAtual } from './services/sessionService';

function formatarData(dataIso) {
    const data = new Date(dataIso);
    if (Number.isNaN(data.getTime())) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(data);
}

export default function NotificacaoKanban() {
    const tipoLogin = obterPapelUsuarioAtual();
    const temAcessoKanban = PAPEIS_PERMITIDOS.includes(tipoLogin);
    const navegar = useNavigate();

    const [notificacoes, definirNotificacoes] = useState([]);
    const [filtroTipo, definirFiltroTipo] = useState('todas');

    const carregarNotificacoes = () => {
        definirNotificacoes(listarNotificacoesKanban(tipoLogin));
    };

    useEffect(() => {
        let estaMontado = true;

        async function prepararAvisosInatividade() {
            const quadros = await listarQuadrosKanban();
            if (!estaMontado) return;

            Object.entries(quadros).forEach(([chaveQuadro, quadro]) => {
                const papeisDestino = obterPapeisComAcessoAoQuadro(chaveQuadro);
                verificarNotificacoesInatividade({
                    chaveQuadro,
                    tituloQuadro: quadro.title,
                    cards: quadro.cards || [],
                    papeisDestino,
                });

                if (chaveQuadro === 'vendedor') {
                    verificarAlertasSlaComercial({
                        cards: quadro.cards || [],
                        papeisDestino,
                    });
                }
            });

            carregarNotificacoes();
        }

        prepararAvisosInatividade();
        return () => {
            estaMontado = false;
        };
    }, [tipoLogin]);

    const notificacoesFiltradas = useMemo(() => {
        if (filtroTipo === 'todas') return notificacoes;
        if (filtroTipo === 'nao-lidas') {
            return notificacoes.filter((notificacao) => !(notificacao.readBy || []).includes(tipoLogin));
        }

        return notificacoes.filter((notificacao) => notificacao.type === filtroTipo);
    }, [filtroTipo, notificacoes, tipoLogin]);

    const totalNaoLidas = useMemo(
        () => notificacoes.filter((notificacao) => !(notificacao.readBy || []).includes(tipoLogin)).length,
        [notificacoes, tipoLogin]
    );

    if (!temAcessoKanban) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="notificacao-page">
            <aside className="notificacao-sidebar" aria-label="Acessos rapidos">
                <Link to="/dashboard" className="sidebar-action" title="Dashboard" aria-label="Ir para dashboard">
                    <i className="fas fa-home" aria-hidden="true" />
                </Link>
                <button
                    type="button"
                    className="sidebar-action"
                    title="Voltar"
                    aria-label="Voltar para pagina anterior"
                    onClick={() => navegar(-1)}
                >
                    <i className="fas fa-arrow-left" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="sidebar-action"
                    title="Kanban"
                    aria-label="Ir para kanban"
                    onClick={() => navegar('/kanban')}
                >
                    <i className="fas fa-columns" aria-hidden="true" />
                </button>
            </aside>

            <main className="notificacao-main">
                <header className="notificacao-header">
                    <div>
                        <h1>Notificações automáticas</h1>
                        <p>Alertas automaticos de movimentacao de cards e inatividade acima de 20 dias.</p>
                    </div>

                    <div className="notificacao-tools">
                        <span className="badge-nao-lidas">Nao lidas: {totalNaoLidas}</span>
                        <button
                            type="button"
                            className="notificacao-btn"
                            onClick={() => {
                                marcarTodasNotificacoesComoLidas(tipoLogin);
                                carregarNotificacoes();
                            }}
                        >
                            Marcar todas como lidas
                        </button>
                    </div>
                </header>

                <section className="notificacao-filtros" aria-label="Filtrar notificacoes">
                    <button
                        type="button"
                        className={`filtro-btn ${filtroTipo === 'todas' ? 'active' : ''}`}
                        onClick={() => definirFiltroTipo('todas')}
                    >
                        Todas
                    </button>
                    <button
                        type="button"
                        className={`filtro-btn ${filtroTipo === 'nao-lidas' ? 'active' : ''}`}
                        onClick={() => definirFiltroTipo('nao-lidas')}
                    >
                        Nao lidas
                    </button>
                    <button
                        type="button"
                        className={`filtro-btn ${filtroTipo === 'mudanca-status' ? 'active' : ''}`}
                        onClick={() => definirFiltroTipo('mudanca-status')}
                    >
                        Mudancas de status
                    </button>
                    <button
                        type="button"
                        className={`filtro-btn ${filtroTipo === 'inatividade' ? 'active' : ''}`}
                        onClick={() => definirFiltroTipo('inatividade')}
                    >
                        Inatividade
                    </button>
                    <button
                        type="button"
                        className={`filtro-btn ${filtroTipo === 'sla-contato' ? 'active' : ''}`}
                        onClick={() => definirFiltroTipo('sla-contato')}
                    >
                        SLA Contato
                    </button>
                    <button
                        type="button"
                        className={`filtro-btn ${filtroTipo === 'sla-orcamento' ? 'active' : ''}`}
                        onClick={() => definirFiltroTipo('sla-orcamento')}
                    >
                        SLA Orcamento
                    </button>
                </section>

                <section className="notificacao-lista" aria-label="Lista de notificacoes">
                    {!notificacoesFiltradas.length && (
                        <div className="notificacao-vazia">
                            <h2>Sem notificacoes no momento</h2>
                            <p>Novos avisos automaticos aparecerao aqui quando houver movimentacoes no quadro.</p>
                        </div>
                    )}

                    {notificacoesFiltradas.map((notificacao) => {
                        const ehLida = (notificacao.readBy || []).includes(tipoLogin);
                        return (
                            <article
                                key={notificacao.id}
                                className={`notificacao-card ${ehLida ? 'lida' : 'nao-lida'}`}
                            >
                                <div>
                                    <h2>{notificacao.cardTitle}</h2>
                                    <p>{notificacao.message}</p>
                                    <small>
                                        Quadro: {notificacao.boardTitle} | Tipo: {notificacao.type} | Em: {formatarData(notificacao.createdAt)}
                                    </small>
                                </div>

                                {!ehLida && (
                                    <button
                                        type="button"
                                        className="notificacao-btn"
                                        onClick={() => {
                                            marcarNotificacaoComoLida(notificacao.id, tipoLogin);
                                            carregarNotificacoes();
                                        }}
                                    >
                                        Marcar como lida
                                    </button>
                                )}
                            </article>
                        );
                    })}
                </section>
            </main>
        </div>
    );
}
