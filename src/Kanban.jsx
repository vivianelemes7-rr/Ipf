
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import './Kanban.css';
import { PAPEIS_PERMITIDOS, QUADRO_PADRAO_POR_PAPEL } from './config/roles';
import {
    listarQuadrosKanban,
    atualizarColunaCardKanban,
    criarCardKanban,
} from './services/kanbanService';
import { obterPapelUsuarioAtual } from './services/sessionService';
import { sair } from './services/authService';

const FORMULARIO_CARD_INICIAL = {
    columnId: '',
    title: '',
    seller: '',
    details: '',
    footer: '',
};

export default function Kanban() {
    const tipoLogin = obterPapelUsuarioAtual();
    const perfilAtor = tipoLogin || 'desconhecido';
    const temAcessoKanban = PAPEIS_PERMITIDOS.includes(tipoLogin);
    const [quadroSelecionado, definirQuadroSelecionado] = useState(QUADRO_PADRAO_POR_PAPEL[tipoLogin] || 'arquitetura');
    const [configuracoesQuadro, definirConfiguracoesQuadro] = useState({});
    const [cardsPorQuadro, definirCardsPorQuadro] = useState({});
    const [estaCarregando, definirEstaCarregando] = useState(true);
    const [erroCarregamento, definirErroCarregamento] = useState('');

    const chaveQuadroAtual = tipoLogin === 'administrador'
        ? quadroSelecionado
        : QUADRO_PADRAO_POR_PAPEL[tipoLogin];

    const quadroAtual = configuracoesQuadro[chaveQuadroAtual];
    const [busca, definirBusca] = useState('');
    const [idArrastando, definirIdArrastando] = useState(null);
    const [mostrarFormularioNovoCard, definirMostrarFormularioNovoCard] = useState(false);
    const [dadosNovoCard, definirDadosNovoCard] = useState(FORMULARIO_CARD_INICIAL);
    const [erroNovoCard, definirErroNovoCard] = useState('');
    const [salvandoNovoCard, definirSalvandoNovoCard] = useState(false);
    const navegar = useNavigate();

    useEffect(() => {
        let estaMontado = true;

        async function carregarQuadros() {
            definirEstaCarregando(true);
            definirErroCarregamento('');

            try {
                const dados = await listarQuadrosKanban();
                if (!estaMontado) return;

                definirConfiguracoesQuadro(dados);
                definirCardsPorQuadro(
                    Object.fromEntries(
                        Object.entries(dados).map(([chave, configuracao]) => [chave, configuracao.cards || []])
                    )
                );
            } catch (erro) {
                if (!estaMontado) return;
                definirErroCarregamento(erro.message || 'Nao foi possivel carregar o kanban.');
            } finally {
                if (estaMontado) {
                    definirEstaCarregando(false);
                }
            }
        }

        carregarQuadros();
        return () => {
            estaMontado = false;
        };
    }, []);

    const colunasQuadro = useMemo(() => quadroAtual?.columns || [], [quadroAtual]);

    const cardsFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const cardsQuadro = cardsPorQuadro[chaveQuadroAtual] || [];
        if (!termo) return cardsQuadro;

        return cardsQuadro.filter((card) => {
            const textoBusca = [card.title, ...(card.lines || []), card.footer, card.seller]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return textoBusca.includes(termo);
        });
    }, [cardsPorQuadro, chaveQuadroAtual, busca]);

    const cardsAgrupados = useMemo(() => {
        return colunasQuadro.reduce((acumulador, coluna) => {
            acumulador[coluna.id] = cardsFiltrados.filter((card) => card.columnId === coluna.id);
            return acumulador;
        }, {});
    }, [colunasQuadro, cardsFiltrados]);

    if (!temAcessoKanban) {
        return <Navigate to="/dashboard" replace />;
    }

    if (estaCarregando) {
        return (
            <div className="kanban-page">
                <main className="kanban-main">
                    <header className="kanban-header">
                        <div>
                            <h1>Carregando kanban...</h1>
                            <p>Aguarde enquanto os dados sao preparados.</p>
                        </div>
                    </header>
                </main>
            </div>
        );
    }

    if (!quadroAtual) {
        return <Navigate to="/dashboard" replace />;
    }

    const aoSoltarNaColuna = async (idColuna) => {
        if (idArrastando === null) return;

        const idCardMovido = idArrastando;
        const dataAtualizacao = new Date().toISOString();
        definirCardsPorQuadro((anterior) => ({
            ...anterior,
            [chaveQuadroAtual]: (anterior[chaveQuadroAtual] || []).map((card) =>
                card.id === idCardMovido
                    ? {
                        ...card,
                        columnId: idColuna,
                        updatedByProfile: perfilAtor,
                        updatedAt: dataAtualizacao,
                    }
                    : card
            ),
        }));
        definirIdArrastando(null);

        await atualizarColunaCardKanban(chaveQuadroAtual, idCardMovido, idColuna, {
            updatedByProfile: perfilAtor,
            updatedAt: dataAtualizacao,
        });
    };

    const abrirFormularioNovoCard = () => {
        definirErroNovoCard('');
        definirDadosNovoCard({
            ...FORMULARIO_CARD_INICIAL,
            columnId: colunasQuadro[0]?.id || '',
        });
        definirMostrarFormularioNovoCard(true);
    };

    const fecharFormularioNovoCard = () => {
        definirMostrarFormularioNovoCard(false);
        definirErroNovoCard('');
        definirDadosNovoCard(FORMULARIO_CARD_INICIAL);
    };

    const aoAlterarNovoCard = (evento) => {
        const { name, value } = evento.target;
        definirDadosNovoCard((anterior) => ({ ...anterior, [name]: value }));
    };

    const obterProximoIdCard = () => {
        const idsExistentes = Object.values(cardsPorQuadro)
            .flat()
            .map((card) => Number(card.id))
            .filter((id) => Number.isFinite(id));

        return idsExistentes.length ? Math.max(...idsExistentes) + 1 : Date.now();
    };

    const aoSalvarNovoCard = async (evento) => {
        evento.preventDefault();
        definirErroNovoCard('');

        if (!dadosNovoCard.columnId) {
            definirErroNovoCard('Selecione a coluna inicial do card.');
            return;
        }

        if (!dadosNovoCard.title.trim()) {
            definirErroNovoCard('Informe o titulo do card.');
            return;
        }

        if (!dadosNovoCard.details.trim()) {
            definirErroNovoCard('Informe os detalhes do card.');
            return;
        }

        const linhasDetalhes = dadosNovoCard.details
            .split('\n')
            .map((linha) => linha.trim())
            .filter(Boolean);

        if (!linhasDetalhes.length) {
            definirErroNovoCard('Adicione pelo menos uma linha de detalhe.');
            return;
        }

        const idNovoCard = obterProximoIdCard();
        const novoCard = {
            id: idNovoCard,
            columnId: dadosNovoCard.columnId,
            title: dadosNovoCard.title.trim(),
            lines: linhasDetalhes,
            footer: dadosNovoCard.footer.trim(),
            seller: dadosNovoCard.seller.trim() || 'Nao informado',
            createdByProfile: perfilAtor,
            updatedByProfile: perfilAtor,
            updatedAt: new Date().toISOString(),
        };

        definirSalvandoNovoCard(true);
        definirCardsPorQuadro((anterior) => ({
            ...anterior,
            [chaveQuadroAtual]: [...(anterior[chaveQuadroAtual] || []), novoCard],
        }));

        const resposta = await criarCardKanban(chaveQuadroAtual, novoCard);
        if (resposta?.success === false) {
            definirCardsPorQuadro((anterior) => ({
                ...anterior,
                [chaveQuadroAtual]: (anterior[chaveQuadroAtual] || []).filter((card) => card.id !== idNovoCard),
            }));
            definirErroNovoCard(resposta.message || 'Nao foi possivel criar o card.');
            definirSalvandoNovoCard(false);
            return;
        }

        definirSalvandoNovoCard(false);
        fecharFormularioNovoCard();
    };

    const larguraMinimaColunas = Math.max(900, colunasQuadro.length * 220);

    return (
        <div className="kanban-page">
            <aside className="kanban-sidebar" aria-label="Acessos rapidos">
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
            </aside>

            <main className="kanban-main">
                <header className="kanban-header">
                    <div>
                        <h1>{quadroAtual.title}</h1>
                        <p>{quadroAtual.description}</p>
                    </div>

                    <div className="kanban-tools">
                        <button
                            type="button"
                            className="kanban-header-btn"
                            onClick={() => navegar('/alterar-senha')}
                        >
                            Alterar senha
                        </button>
                        <button
                            type="button"
                            className="kanban-header-btn kanban-header-btn-danger"
                            onClick={() => {
                                sair();
                                navegar('/');
                            }}
                        >
                            Sair
                        </button>
                        <label className="search-input" aria-label="Buscar ordem de servico">
                            <i className="fas fa-search" aria-hidden="true" />
                            <input
                                type="text"
                                value={busca}
                                placeholder="Buscar card..."
                                onChange={(evento) => definirBusca(evento.target.value)}
                            />
                        </label>
                        <button type="button" className="new-os-btn" onClick={abrirFormularioNovoCard}>
                            + Novo card
                        </button>
                    </div>
                </header>

                {erroCarregamento && (
                    <p role="alert" style={{ color: '#b42318', marginBottom: '16px' }}>
                        {erroCarregamento}
                    </p>
                )}

                {tipoLogin === 'administrador' && (
                    <div className="board-switcher" aria-label="Selecionar modelo de kanban">
                        {Object.entries(configuracoesQuadro).map(([chave, configuracao]) => (
                            <button
                                key={chave}
                                type="button"
                                className={`board-switch-btn ${chaveQuadroAtual === chave ? 'active' : ''}`}
                                onClick={() => {
                                    definirQuadroSelecionado(chave);
                                    definirBusca('');
                                }}
                            >
                                {configuracao.label}
                            </button>
                        ))}
                    </div>
                )}

                <section className="kanban-board" aria-label="Quadro kanban de producao">
                    <div
                        className="kanban-board-grid"
                        style={{
                            gridTemplateColumns: `repeat(${colunasQuadro.length}, minmax(200px, 1fr))`,
                            minWidth: `${larguraMinimaColunas}px`,
                        }}
                    >
                        {colunasQuadro.map((coluna) => (
                            <div
                                key={coluna.id}
                                className={`kanban-column kanban-column--${coluna.tone || 'neutral'}`}
                                onDragOver={(evento) => evento.preventDefault()}
                                onDrop={() => aoSoltarNaColuna(coluna.id)}
                            >
                                <div className="column-title-wrap">
                                    <h2>{coluna.title}</h2>
                                    <span>{cardsAgrupados[coluna.id]?.length || 0}</span>
                                </div>

                                <div className="column-cards">
                                    {(cardsAgrupados[coluna.id] || []).map((card) => (
                                        <article
                                            key={card.id}
                                            className="lead-card"
                                            draggable
                                            onDragStart={() => definirIdArrastando(card.id)}
                                            onDragEnd={() => definirIdArrastando(null)}
                                        >
                                            <h3>{card.title}</h3>
                                            {(card.lines || []).map((linha, indice) => (
                                                <p key={`${card.id}-${indice}`}>{linha}</p>
                                            ))}
                                            <p>Vendedor: {card.seller}</p>
                                            {(card.updatedByProfile || card.createdByProfile) && (
                                                <p>
                                                    Perfil da ultima alteracao: {card.updatedByProfile || card.createdByProfile}
                                                </p>
                                            )}
                                            {card.footer && <small>{card.footer}</small>}
                                        </article>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {mostrarFormularioNovoCard && (
                    <div className="kanban-modal-backdrop" role="presentation">
                        <div className="kanban-modal" role="dialog" aria-modal="true" aria-label="Criar novo card">
                            <h2>Novo card</h2>
                            <p>Preencha as informacoes necessarias para o quadro atual.</p>

                            <form className="kanban-modal-form" onSubmit={aoSalvarNovoCard}>
                                <label htmlFor="columnId">Coluna inicial</label>
                                <select
                                    id="columnId"
                                    name="columnId"
                                    value={dadosNovoCard.columnId}
                                    onChange={aoAlterarNovoCard}
                                    required
                                >
                                    <option value="" disabled>Selecione</option>
                                    {colunasQuadro.map((coluna) => (
                                        <option key={coluna.id} value={coluna.id}>{coluna.title}</option>
                                    ))}
                                </select>

                                <label htmlFor="title">Titulo</label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={dadosNovoCard.title}
                                    onChange={aoAlterarNovoCard}
                                    placeholder="Ex: OS: OS-1234"
                                    required
                                />

                                <label htmlFor="seller">Vendedor/Responsavel</label>
                                <input
                                    id="seller"
                                    name="seller"
                                    type="text"
                                    value={dadosNovoCard.seller}
                                    onChange={aoAlterarNovoCard}
                                    placeholder="Ex: Marcos Silva"
                                />

                                <label htmlFor="details">Detalhes (uma linha por item)</label>
                                <textarea
                                    id="details"
                                    name="details"
                                    rows="4"
                                    value={dadosNovoCard.details}
                                    onChange={aoAlterarNovoCard}
                                    placeholder="Cliente: Nome\nPeca: Produto\nData: 01/05/2026"
                                    required
                                />

                                <label htmlFor="footer">Rodape</label>
                                <input
                                    id="footer"
                                    name="footer"
                                    type="text"
                                    value={dadosNovoCard.footer}
                                    onChange={aoAlterarNovoCard}
                                    placeholder="Status: Aguardando"
                                />

                                {erroNovoCard && <p className="kanban-modal-error">{erroNovoCard}</p>}

                                <div className="kanban-modal-actions">
                                    <button type="button" className="kanban-header-btn" onClick={fecharFormularioNovoCard}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="new-os-btn" disabled={salvandoNovoCard}>
                                        {salvandoNovoCard ? 'Salvando...' : 'Salvar card'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
