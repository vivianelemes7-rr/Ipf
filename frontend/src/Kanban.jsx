
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import './Kanban.css';
import { PAPEIS_PERMITIDOS, QUADRO_PADRAO_POR_PAPEL } from './config/roles';
<<<<<<< HEAD
import { API_ENDPOINTS } from './config/apiContract';
=======
>>>>>>> f95ee95a233b645bb4f881cfe14ebc2f4656b1da
import {
    listarQuadrosKanban,
    atualizarColunaCardKanban,
    criarCardKanban,
    atualizarCardKanban,
    excluirCardKanban,
} from './services/kanbanService';
<<<<<<< HEAD
import { requisicao } from './services/httpClient';
=======
>>>>>>> f95ee95a233b645bb4f881cfe14ebc2f4656b1da
import {
    obterPapeisComAcessoAoQuadro,
    registrarNotificacaoMudancaEstado,
    verificarNotificacoesInatividade,
    verificarAlertasSlaComercial,
} from './services/notificacaoKanbanService';
import { obterPapelUsuarioAtual } from './services/sessionService';
import { sair } from './services/authService';

const FORMULARIO_CARD_INICIAL = {
    columnId: '',
    title: '',
    seller: '',
    details: '',
    footer: '',
    processTag: 'especial',
    budgetFileName: '',
    clientDocument: '',
    clientAddress: '',
    homologadoCliente: false,
};

const FORMULARIO_EDICAO_CARD_INICIAL = {
    id: null,
    columnId: '',
    title: '',
    seller: '',
    details: '',
    footer: '',
    processTag: 'especial',
    budgetFileName: '',
    clientDocument: '',
    clientAddress: '',
    homologadoCliente: false,
};

const CHAVE_QUADRO_ARQUITETURA = 'arquitetura';
const CHAVE_QUADRO_PRODUCAO = 'producao';
const CHAVE_QUADRO_VENDEDOR = 'vendedor';
const CHAVE_QUADRO_FINANCEIRO = 'financeiro';
const CHAVE_QUADRO_LOGISTICA = 'logistica';
const COLUNA_CONCLUSAO_ARQUITETURA = 'producao';
const COLUNA_PEDIDO_VENDAS = 'pedido';
const COLUNA_CONFIRMADO_FINANCEIRO = 'confirmado';
const COLUNA_FINALIZADO_PRODUCAO = 'finalizado';
const COLUNA_NF_FINANCEIRO = 'nf';

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
    const [mostrarFormularioEdicaoCard, definirMostrarFormularioEdicaoCard] = useState(false);
    const [dadosEdicaoCard, definirDadosEdicaoCard] = useState(FORMULARIO_EDICAO_CARD_INICIAL);
    const [erroEdicaoCard, definirErroEdicaoCard] = useState('');
    const [salvandoEdicaoCard, definirSalvandoEdicaoCard] = useState(false);
    const [excluindoCardId, definirExcluindoCardId] = useState(null);
    const [erroAcaoCard, definirErroAcaoCard] = useState('');
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

    const mapaTitulosColunas = useMemo(
        () => Object.fromEntries(colunasQuadro.map((coluna) => [coluna.id, coluna.title])),
        [colunasQuadro]
    );

    useEffect(() => {
        if (!chaveQuadroAtual || !quadroAtual) return;

        const cardsQuadro = cardsPorQuadro[chaveQuadroAtual] || [];
        const papeisDestino = obterPapeisComAcessoAoQuadro(chaveQuadroAtual);

        verificarNotificacoesInatividade({
            chaveQuadro: chaveQuadroAtual,
            tituloQuadro: quadroAtual.title,
            cards: cardsQuadro,
            papeisDestino,
        });

        if (chaveQuadroAtual === CHAVE_QUADRO_VENDEDOR) {
            verificarAlertasSlaComercial({
                cards: cardsQuadro,
                papeisDestino,
            });
        }
    }, [cardsPorQuadro, chaveQuadroAtual, quadroAtual]);

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

    const deveTransferirParaProducao = (chaveQuadro, idColuna) => (
        chaveQuadro === CHAVE_QUADRO_ARQUITETURA && idColuna === COLUNA_CONCLUSAO_ARQUITETURA
    );

    const obterPrimeiraColunaDoQuadro = (chaveQuadro) => configuracoesQuadro[chaveQuadro]?.columns?.[0]?.id || '';

    const marcarFlagCard = async (chaveQuadro, idCard, nomeFlag) => {
        const dataAtualizacao = new Date().toISOString();
        definirCardsPorQuadro((anterior) => ({
            ...anterior,
            [chaveQuadro]: (anterior[chaveQuadro] || []).map((card) => (
                card.id === idCard
                    ? {
                        ...card,
                        [nomeFlag]: true,
                        updatedByProfile: perfilAtor,
                        updatedAt: dataAtualizacao,
                    }
                    : card
            )),
        }));

        await atualizarCardKanban(chaveQuadro, idCard, {
            [nomeFlag]: true,
            updatedByProfile: perfilAtor,
            updatedAt: dataAtualizacao,
        });
    };

    const adicionarCardAoQuadro = async (chaveQuadroDestino, cardNovo) => {
        const cardsDestinoOriginais = cardsPorQuadro[chaveQuadroDestino] || [];
        definirCardsPorQuadro((anterior) => ({
            ...anterior,
            [chaveQuadroDestino]: [...(anterior[chaveQuadroDestino] || []), cardNovo],
        }));

        const respostaCriacao = await criarCardKanban(chaveQuadroDestino, cardNovo);
        if (respostaCriacao?.success === false) {
            definirCardsPorQuadro((anterior) => ({
                ...anterior,
                [chaveQuadroDestino]: cardsDestinoOriginais,
            }));
            definirErroAcaoCard(respostaCriacao.message || 'Nao foi possivel criar card automatico.');
            return false;
        }

        return true;
    };

    const transferirCardArquiteturaParaProducao = async (cardArquitetura) => {
        const colunaDestinoProducao = obterPrimeiraColunaDoQuadro(CHAVE_QUADRO_PRODUCAO);
        if (!colunaDestinoProducao) {
            definirErroAcaoCard('Nao foi possivel localizar a coluna inicial do quadro de Producao.');
            return { success: false };
        }

        const dataAtualizacao = new Date().toISOString();
        const cardTransferido = {
            ...cardArquitetura,
            id: obterProximoIdCard(),
            columnId: colunaDestinoProducao,
            updatedByProfile: perfilAtor,
            updatedAt: dataAtualizacao,
        };

        const cardsArquiteturaOriginais = cardsPorQuadro[CHAVE_QUADRO_ARQUITETURA] || [];
        const cardsProducaoOriginais = cardsPorQuadro[CHAVE_QUADRO_PRODUCAO] || [];

        definirCardsPorQuadro((anterior) => ({
            ...anterior,
            [CHAVE_QUADRO_ARQUITETURA]: (anterior[CHAVE_QUADRO_ARQUITETURA] || []).filter(
                (card) => card.id !== cardArquitetura.id
            ),
            [CHAVE_QUADRO_PRODUCAO]: [...(anterior[CHAVE_QUADRO_PRODUCAO] || []), cardTransferido],
        }));

        const respostaCriacao = await criarCardKanban(CHAVE_QUADRO_PRODUCAO, cardTransferido);
        if (respostaCriacao?.success === false) {
            definirCardsPorQuadro((anterior) => ({
                ...anterior,
                [CHAVE_QUADRO_ARQUITETURA]: cardsArquiteturaOriginais,
                [CHAVE_QUADRO_PRODUCAO]: cardsProducaoOriginais,
            }));
            definirErroAcaoCard(respostaCriacao.message || 'Nao foi possivel mover o card para Producao.');
            return { success: false };
        }

        const respostaExclusao = await excluirCardKanban(CHAVE_QUADRO_ARQUITETURA, cardArquitetura.id);
        if (respostaExclusao?.success === false) {
            definirCardsPorQuadro((anterior) => ({
                ...anterior,
                [CHAVE_QUADRO_ARQUITETURA]: cardsArquiteturaOriginais,
                [CHAVE_QUADRO_PRODUCAO]: cardsProducaoOriginais,
            }));
            await excluirCardKanban(CHAVE_QUADRO_PRODUCAO, cardTransferido.id);
            definirErroAcaoCard(
                respostaExclusao.message || 'Nao foi possivel concluir a transferencia para Producao.'
            );
            return { success: false };
        }

        return { success: true };
    };

    const criarNotificacaoFinanceiroPedido = async (cardOrigem) => {
        const colunaDestinoFinanceiro = 'notificacao';
        const dataAtualizacao = new Date().toISOString();
        const cardFinanceiro = {
            id: obterProximoIdCard(),
            columnId: colunaDestinoFinanceiro,
            title: cardOrigem.title,
            lines: [
                ...(cardOrigem.lines || []),
                `Origem: ${cardOrigem.originBoardTitle || 'Vendas'}`,
                `Tag: ${(cardOrigem.processTag || 'especial').toUpperCase()}`,
            ],
            footer: 'Status: Aguardando validacao financeira',
            seller: cardOrigem.seller || 'Nao informado',
            processTag: cardOrigem.processTag || 'especial',
            sourceCardId: cardOrigem.id,
            sourceBoard: cardOrigem.sourceBoard || CHAVE_QUADRO_VENDEDOR,
            createdByProfile: perfilAtor,
            updatedByProfile: perfilAtor,
            updatedAt: dataAtualizacao,
        };

        return adicionarCardAoQuadro(CHAVE_QUADRO_FINANCEIRO, cardFinanceiro);
    };

    const criarCardExecucaoPosFinanceiro = async (cardFinanceiro) => {
        const destinoEhProducao = (cardFinanceiro.processTag || 'especial') === 'normal';
        const chaveDestino = destinoEhProducao ? CHAVE_QUADRO_PRODUCAO : CHAVE_QUADRO_ARQUITETURA;
        const colunaDestino = obterPrimeiraColunaDoQuadro(chaveDestino);
        if (!colunaDestino) {
            definirErroAcaoCard('Nao foi possivel localizar coluna inicial do fluxo de execucao.');
            return false;
        }

        const dataAtualizacao = new Date().toISOString();
        const cardExecucao = {
            id: obterProximoIdCard(),
            columnId: colunaDestino,
            title: cardFinanceiro.title,
            lines: [
                ...(cardFinanceiro.lines || []),
                `Liberacao Financeira: ${new Date(dataAtualizacao).toLocaleString('pt-BR')}`,
            ],
            footer: destinoEhProducao
                ? 'Fluxo normal: liberado direto para Producao'
                : 'Fluxo especial: encaminhado para Arquitetura',
            seller: cardFinanceiro.seller || 'Nao informado',
            processTag: cardFinanceiro.processTag || 'especial',
            sourceCardId: cardFinanceiro.id,
            sourceBoard: CHAVE_QUADRO_FINANCEIRO,
            createdByProfile: perfilAtor,
            updatedByProfile: perfilAtor,
            updatedAt: dataAtualizacao,
        };

        return adicionarCardAoQuadro(chaveDestino, cardExecucao);
    };

    const criarAlertaFiscalDeProducao = async (cardProducao) => {
        const dataAtualizacao = new Date().toISOString();
        const alertaFiscal = {
            id: obterProximoIdCard(),
            columnId: 'alerta',
            title: `Alerta: ${cardProducao.title}`,
            lines: [
                ...(cardProducao.lines || []),
                'Status: Produzido - aguardando emissao de NF',
            ],
            footer: 'Check-out de producao concluido',
            seller: cardProducao.seller || 'Nao informado',
            processTag: cardProducao.processTag || 'especial',
            sourceCardId: cardProducao.id,
            sourceBoard: CHAVE_QUADRO_PRODUCAO,
            createdByProfile: perfilAtor,
            updatedByProfile: perfilAtor,
            updatedAt: dataAtualizacao,
        };

        return adicionarCardAoQuadro(CHAVE_QUADRO_FINANCEIRO, alertaFiscal);
    };

    const criarCardLogisticaAPartirDaNf = async (cardFinanceiro) => {
        const colunaDestino = obterPrimeiraColunaDoQuadro(CHAVE_QUADRO_LOGISTICA);
        if (!colunaDestino) {
            definirErroAcaoCard('Nao foi possivel localizar coluna inicial da Logistica.');
            return false;
        }

        const dataAtualizacao = new Date().toISOString();
        const cardLogistica = {
            id: obterProximoIdCard(),
            columnId: colunaDestino,
            title: `Expedicao: ${cardFinanceiro.title.replace('NF-e Emitida', 'Pedido')}`,
            lines: [
                ...(cardFinanceiro.lines || []),
                'Aviso final ao cliente pendente',
            ],
            footer: 'Aguardando expedicao da mercadoria',
            seller: cardFinanceiro.seller || 'Nao informado',
            sourceCardId: cardFinanceiro.id,
            sourceBoard: CHAVE_QUADRO_FINANCEIRO,
            createdByProfile: perfilAtor,
            updatedByProfile: perfilAtor,
            updatedAt: dataAtualizacao,
        };

        return adicionarCardAoQuadro(CHAVE_QUADRO_LOGISTICA, cardLogistica);
    };

    const executarAutomacoesPosMovimento = async ({ chaveQuadro, colunaDestino, cardAtualizado }) => {
        if (chaveQuadro === CHAVE_QUADRO_VENDEDOR && colunaDestino === COLUNA_PEDIDO_VENDAS && !cardAtualizado.financeiroNotificado) {
            const sucesso = await criarNotificacaoFinanceiroPedido({
                ...cardAtualizado,
                originBoardTitle: quadroAtual?.title,
                sourceBoard: CHAVE_QUADRO_VENDEDOR,
            });
            if (sucesso) {
                await marcarFlagCard(CHAVE_QUADRO_VENDEDOR, cardAtualizado.id, 'financeiroNotificado');
            }
        }

        if (chaveQuadro === CHAVE_QUADRO_FINANCEIRO && colunaDestino === COLUNA_CONFIRMADO_FINANCEIRO && !cardAtualizado.liberadoParaExecucao) {
            const sucesso = await criarCardExecucaoPosFinanceiro(cardAtualizado);
            if (sucesso) {
                await marcarFlagCard(CHAVE_QUADRO_FINANCEIRO, cardAtualizado.id, 'liberadoParaExecucao');
            }
        }

        if (chaveQuadro === CHAVE_QUADRO_PRODUCAO && colunaDestino === COLUNA_FINALIZADO_PRODUCAO && !cardAtualizado.alertaFiscalGerado) {
            const sucesso = await criarAlertaFiscalDeProducao(cardAtualizado);
            if (sucesso) {
                await marcarFlagCard(CHAVE_QUADRO_PRODUCAO, cardAtualizado.id, 'alertaFiscalGerado');
            }
        }

        if (chaveQuadro === CHAVE_QUADRO_FINANCEIRO && colunaDestino === COLUNA_NF_FINANCEIRO && !cardAtualizado.logisticaGerada) {
            const sucesso = await criarCardLogisticaAPartirDaNf(cardAtualizado);
            if (sucesso) {
                await marcarFlagCard(CHAVE_QUADRO_FINANCEIRO, cardAtualizado.id, 'logisticaGerada');
            }
        }
    };

    const aoSoltarNaColuna = async (idColuna) => {
        if (idArrastando === null) return;

        const idCardMovido = idArrastando;
        const cardsQuadroAtual = cardsPorQuadro[chaveQuadroAtual] || [];
        const cardMovido = cardsQuadroAtual.find((card) => card.id === idCardMovido);
        if (!cardMovido) {
            definirIdArrastando(null);
            return;
        }

        if (cardMovido.columnId === idColuna) {
            definirIdArrastando(null);
            return;
        }

        const colunaOrigem = cardMovido.columnId;
        if (deveTransferirParaProducao(chaveQuadroAtual, idColuna)) {
            const dataAtualizacao = new Date().toISOString();
            definirIdArrastando(null);

            const cardAtualizado = {
                ...cardMovido,
                columnId: idColuna,
                updatedByProfile: perfilAtor,
                updatedAt: dataAtualizacao,
            };

            const papeisDestino = obterPapeisComAcessoAoQuadro(chaveQuadroAtual);
            registrarNotificacaoMudancaEstado({
                chaveQuadro: chaveQuadroAtual,
                tituloQuadro: quadroAtual.title,
                card: cardAtualizado,
                colunaOrigem,
                colunaDestino: idColuna,
                mapaColunas: mapaTitulosColunas,
                perfilAtor,
                papeisDestino,
            });

            await transferirCardArquiteturaParaProducao(cardAtualizado);
            return;
        }

        const dataAtualizacao = new Date().toISOString();
        const cardAtualizado = {
            ...cardMovido,
            columnId: idColuna,
            updatedByProfile: perfilAtor,
            updatedAt: dataAtualizacao,
        };

        definirCardsPorQuadro((anterior) => ({
            ...anterior,
            [chaveQuadroAtual]: (anterior[chaveQuadroAtual] || []).map((card) =>
                card.id === idCardMovido
                    ? cardAtualizado
                    : card
            ),
        }));
        definirIdArrastando(null);

        const papeisDestino = obterPapeisComAcessoAoQuadro(chaveQuadroAtual);
        registrarNotificacaoMudancaEstado({
            chaveQuadro: chaveQuadroAtual,
            tituloQuadro: quadroAtual.title,
            card: cardAtualizado,
            colunaOrigem,
            colunaDestino: idColuna,
            mapaColunas: mapaTitulosColunas,
            perfilAtor,
            papeisDestino,
        });

        await atualizarColunaCardKanban(chaveQuadroAtual, idCardMovido, idColuna, {
            updatedByProfile: perfilAtor,
            updatedAt: dataAtualizacao,
        });

        await executarAutomacoesPosMovimento({
            chaveQuadro: chaveQuadroAtual,
            colunaDestino: idColuna,
            cardAtualizado,
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
        const { name, value, type, checked, files } = evento.target;
        if (type === 'checkbox') {
            definirDadosNovoCard((anterior) => ({ ...anterior, [name]: checked }));
            return;
        }

        if (type === 'file') {
            const arquivo = files?.[0];
            definirDadosNovoCard((anterior) => ({ ...anterior, budgetFileName: arquivo?.name || '' }));
            return;
        }

        definirDadosNovoCard((anterior) => ({ ...anterior, [name]: value }));
    };

    const obterProximoIdCard = () => {
        const idsExistentes = Object.values(cardsPorQuadro)
            .flat()
            .map((card) => Number(card.id))
            .filter((id) => Number.isFinite(id));

        return idsExistentes.length ? Math.max(...idsExistentes) + 1 : Date.now();
    };

<<<<<<< HEAD
    const extrairCidadeEstado = (textoEndereco = '') => {
        const enderecoNormalizado = String(textoEndereco || '').trim();
        if (!enderecoNormalizado) {
            return { cidade: null, estado: null };
        }

        const partes = enderecoNormalizado.split('-').map((parte) => parte.trim()).filter(Boolean);
        if (partes.length < 2) {
            return { cidade: enderecoNormalizado, estado: null };
        }

        const estado = partes[partes.length - 1].toUpperCase();
        const cidade = partes.slice(0, -1).join(' - ').trim();
        const estadoValido = /^[A-Z]{2}$/.test(estado) ? estado : null;

        return {
            cidade: cidade || null,
            estado: estadoValido,
        };
    };

    const extrairNomeContatoCard = (tituloCard = '', linhasDetalhes = []) => {
        const tituloSemPrefixo = String(tituloCard).replace(/^Lead\s*:\s*/i, '').trim();
        if (tituloSemPrefixo) {
            return tituloSemPrefixo;
        }

        const linhaContato = linhasDetalhes.find((linha) => /^Contato\s*:/i.test(linha || ''));
        if (linhaContato) {
            return linhaContato.replace(/^Contato\s*:/i, '').trim();
        }

        return 'Lead sem nome';
    };

    const extrairOrigemCard = (rodape = '') => {
        const texto = String(rodape || '').trim();
        if (!texto) return 'Vendas';

        const correspondencia = texto.match(/Origem\s*:\s*(.+)$/i);
        return correspondencia?.[1]?.trim() || 'Vendas';
    };

    const criarLeadParaCardVendas = async ({ tituloCard, linhasDetalhes, rodapeCard, enderecoCliente, documentoCliente }) => {
        const nomeContato = extrairNomeContatoCard(tituloCard, linhasDetalhes);
        const { cidade, estado } = extrairCidadeEstado(enderecoCliente);
        const origem = extrairOrigemCard(rodapeCard);

        const payloadLead = {
            nome_contato: nomeContato,
            empresa: nomeContato,
            cpf_cnpj: documentoCliente || null,
            telefone: null,
            email: null,
            endereco_completo: enderecoCliente || null,
            cidade,
            estado,
            origem: 'Kanban',
            instagram: null,
            site: null,
            indicacao: null,
            status_lead: 'Novo',
            convertido: false,
            notas: [
                `Criado automaticamente no Kanban de vendas por ${perfilAtor}.`,
                ...linhasDetalhes,
                rodapeCard,
            ].filter(Boolean).join(' | '),
        };

        const respostaLead = await requisicao(API_ENDPOINTS.leads.criar, {
            metodo: 'POST',
            corpo: payloadLead,
        });

        const leadId = respostaLead?.id
            ?? respostaLead?.lead_id
            ?? respostaLead?.leadId
            ?? respostaLead?.lead?.id
            ?? null;

        if (!leadId) {
            throw new Error('O backend nao retornou o id do lead criado.');
        }

        return leadId;
    };
=======
>>>>>>> f95ee95a233b645bb4f881cfe14ebc2f4656b1da
    const aoSalvarNovoCard = async (evento) => {
        evento.preventDefault();
        definirErroNovoCard('');
        definirErroAcaoCard('');

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

<<<<<<< HEAD
        let leadId = null;
        if (chaveQuadroAtual === CHAVE_QUADRO_VENDEDOR) {
            try {
                leadId = await criarLeadParaCardVendas({
                    tituloCard: dadosNovoCard.title.trim(),
                    linhasDetalhes,
                    rodapeCard: dadosNovoCard.footer.trim(),
                    enderecoCliente: dadosNovoCard.clientAddress.trim(),
                    documentoCliente: dadosNovoCard.clientDocument.trim(),
                });
            } catch (erro) {
                definirErroNovoCard(erro.message || 'Nao foi possivel criar o lead antes do card.');
                return;
            }
        }
=======
>>>>>>> f95ee95a233b645bb4f881cfe14ebc2f4656b1da
        const idNovoCard = obterProximoIdCard();
        const novoCard = {
            id: idNovoCard,
            columnId: dadosNovoCard.columnId,
            title: dadosNovoCard.title.trim(),
            lines: linhasDetalhes,
            footer: dadosNovoCard.footer.trim(),
            seller: dadosNovoCard.seller.trim() || 'Nao informado',
            processTag: dadosNovoCard.processTag || 'especial',
            budgetFileName: dadosNovoCard.budgetFileName || '',
            clientDocument: dadosNovoCard.clientDocument.trim(),
            clientAddress: dadosNovoCard.clientAddress.trim(),
            homologadoCliente: Boolean(dadosNovoCard.homologadoCliente),
            createdByProfile: perfilAtor,
            updatedByProfile: perfilAtor,
            updatedAt: new Date().toISOString(),
<<<<<<< HEAD
            ...(leadId ? { lead_id: leadId } : {}),
=======
>>>>>>> f95ee95a233b645bb4f881cfe14ebc2f4656b1da
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

        await executarAutomacoesPosMovimento({
            chaveQuadro: chaveQuadroAtual,
            colunaDestino: novoCard.columnId,
            cardAtualizado: novoCard,
        });
    };

    const abrirFormularioEdicaoCard = (card) => {
        definirErroEdicaoCard('');
        definirErroAcaoCard('');
        definirDadosEdicaoCard({
            id: card.id,
            columnId: card.columnId || colunasQuadro[0]?.id || '',
            title: card.title || '',
            seller: card.seller || '',
            details: (card.lines || []).join('\n'),
            footer: card.footer || '',
            processTag: card.processTag || 'especial',
            budgetFileName: card.budgetFileName || '',
            clientDocument: card.clientDocument || '',
            clientAddress: card.clientAddress || '',
            homologadoCliente: Boolean(card.homologadoCliente),
        });
        definirMostrarFormularioEdicaoCard(true);
    };

    const fecharFormularioEdicaoCard = () => {
        definirMostrarFormularioEdicaoCard(false);
        definirErroEdicaoCard('');
        definirDadosEdicaoCard(FORMULARIO_EDICAO_CARD_INICIAL);
    };

    const aoAlterarEdicaoCard = (evento) => {
        const { name, value, type, checked, files } = evento.target;
        if (type === 'checkbox') {
            definirDadosEdicaoCard((anterior) => ({ ...anterior, [name]: checked }));
            return;
        }

        if (type === 'file') {
            const arquivo = files?.[0];
            definirDadosEdicaoCard((anterior) => ({ ...anterior, budgetFileName: arquivo?.name || '' }));
            return;
        }

        definirDadosEdicaoCard((anterior) => ({ ...anterior, [name]: value }));
    };

    const aoSalvarEdicaoCard = async (evento) => {
        evento.preventDefault();
        definirErroEdicaoCard('');
        definirErroAcaoCard('');

        if (!dadosEdicaoCard.id) {
            definirErroEdicaoCard('Card invalido para edicao.');
            return;
        }

        if (!dadosEdicaoCard.columnId) {
            definirErroEdicaoCard('Selecione a coluna do card.');
            return;
        }

        if (!dadosEdicaoCard.title.trim()) {
            definirErroEdicaoCard('Informe o titulo do card.');
            return;
        }

        const linhasDetalhes = dadosEdicaoCard.details
            .split('\n')
            .map((linha) => linha.trim())
            .filter(Boolean);

        if (!linhasDetalhes.length) {
            definirErroEdicaoCard('Adicione pelo menos uma linha de detalhe.');
            return;
        }

        const cardsQuadroAtual = cardsPorQuadro[chaveQuadroAtual] || [];
        const cardOriginal = cardsQuadroAtual.find((card) => card.id === dadosEdicaoCard.id);
        if (!cardOriginal) {
            definirErroEdicaoCard('Card nao encontrado para edicao.');
            return;
        }

        const dataAtualizacao = new Date().toISOString();
        const cardAtualizado = {
            ...cardOriginal,
            columnId: dadosEdicaoCard.columnId,
            title: dadosEdicaoCard.title.trim(),
            seller: dadosEdicaoCard.seller.trim() || 'Nao informado',
            lines: linhasDetalhes,
            footer: dadosEdicaoCard.footer.trim(),
            processTag: dadosEdicaoCard.processTag || 'especial',
            budgetFileName: dadosEdicaoCard.budgetFileName || '',
            clientDocument: dadosEdicaoCard.clientDocument.trim(),
            clientAddress: dadosEdicaoCard.clientAddress.trim(),
            homologadoCliente: Boolean(dadosEdicaoCard.homologadoCliente),
            updatedByProfile: perfilAtor,
            updatedAt: dataAtualizacao,
        };

        if (deveTransferirParaProducao(chaveQuadroAtual, cardAtualizado.columnId)) {
            const papeisDestino = obterPapeisComAcessoAoQuadro(chaveQuadroAtual);
            registrarNotificacaoMudancaEstado({
                chaveQuadro: chaveQuadroAtual,
                tituloQuadro: quadroAtual.title,
                card: cardAtualizado,
                colunaOrigem: cardOriginal.columnId,
                colunaDestino: cardAtualizado.columnId,
                mapaColunas: mapaTitulosColunas,
                perfilAtor,
                papeisDestino,
            });

            definirSalvandoEdicaoCard(true);
            const transferencia = await transferirCardArquiteturaParaProducao(cardAtualizado);
            definirSalvandoEdicaoCard(false);

            if (!transferencia.success) {
                definirErroEdicaoCard('Nao foi possivel concluir a transferencia para Producao.');
                return;
            }

            fecharFormularioEdicaoCard();
            return;
        }

        definirSalvandoEdicaoCard(true);
        definirCardsPorQuadro((anterior) => ({
            ...anterior,
            [chaveQuadroAtual]: (anterior[chaveQuadroAtual] || []).map((card) =>
                card.id === cardOriginal.id ? cardAtualizado : card
            ),
        }));

        const resposta = await atualizarCardKanban(chaveQuadroAtual, cardOriginal.id, {
            columnId: cardAtualizado.columnId,
            title: cardAtualizado.title,
            seller: cardAtualizado.seller,
            lines: cardAtualizado.lines,
            footer: cardAtualizado.footer,
            processTag: cardAtualizado.processTag,
            budgetFileName: cardAtualizado.budgetFileName,
            clientDocument: cardAtualizado.clientDocument,
            clientAddress: cardAtualizado.clientAddress,
            homologadoCliente: cardAtualizado.homologadoCliente,
<<<<<<< HEAD
            ...(cardAtualizado.lead_id ? { lead_id: cardAtualizado.lead_id } : {}),
=======
>>>>>>> f95ee95a233b645bb4f881cfe14ebc2f4656b1da
            updatedByProfile: cardAtualizado.updatedByProfile,
            updatedAt: cardAtualizado.updatedAt,
        });

        if (resposta?.success === false) {
            definirCardsPorQuadro((anterior) => ({
                ...anterior,
                [chaveQuadroAtual]: (anterior[chaveQuadroAtual] || []).map((card) =>
                    card.id === cardOriginal.id ? cardOriginal : card
                ),
            }));
            definirErroEdicaoCard(resposta.message || 'Nao foi possivel salvar as alteracoes do card.');
            definirSalvandoEdicaoCard(false);
            return;
        }

        definirSalvandoEdicaoCard(false);
        fecharFormularioEdicaoCard();

        await executarAutomacoesPosMovimento({
            chaveQuadro: chaveQuadroAtual,
            colunaDestino: cardAtualizado.columnId,
            cardAtualizado,
        });
    };

    const aoGerarPedido = async (card) => {
        if (chaveQuadroAtual !== CHAVE_QUADRO_VENDEDOR) return;
        if (!card.homologadoCliente) {
            definirErroAcaoCard('Homologue os dados do cliente antes de gerar o pedido.');
            return;
        }

        const dataAtualizacao = new Date().toISOString();
        const cardAtualizado = {
            ...card,
            columnId: COLUNA_PEDIDO_VENDAS,
            updatedByProfile: perfilAtor,
            updatedAt: dataAtualizacao,
        };

        definirCardsPorQuadro((anterior) => ({
            ...anterior,
            [CHAVE_QUADRO_VENDEDOR]: (anterior[CHAVE_QUADRO_VENDEDOR] || []).map((item) =>
                item.id === card.id ? cardAtualizado : item
            ),
        }));

        await atualizarCardKanban(CHAVE_QUADRO_VENDEDOR, card.id, {
            columnId: COLUNA_PEDIDO_VENDAS,
            updatedByProfile: perfilAtor,
            updatedAt: dataAtualizacao,
        });

        await executarAutomacoesPosMovimento({
            chaveQuadro: CHAVE_QUADRO_VENDEDOR,
            colunaDestino: COLUNA_PEDIDO_VENDAS,
            cardAtualizado,
        });
    };

    const aoExcluirCard = async (cardId) => {
        definirErroAcaoCard('');

        const cardsQuadroAtual = cardsPorQuadro[chaveQuadroAtual] || [];
        const cardExcluido = cardsQuadroAtual.find((card) => card.id === cardId);
        if (!cardExcluido) {
            definirErroAcaoCard('Card nao encontrado para exclusao.');
            return;
        }

        const confirmarExclusao = window.confirm(`Deseja excluir o card \"${cardExcluido.title}\"?`);
        if (!confirmarExclusao) return;

        definirExcluindoCardId(cardId);
        definirCardsPorQuadro((anterior) => ({
            ...anterior,
            [chaveQuadroAtual]: (anterior[chaveQuadroAtual] || []).filter((card) => card.id !== cardId),
        }));

        const resposta = await excluirCardKanban(chaveQuadroAtual, cardId);
        if (resposta?.success === false) {
            definirCardsPorQuadro((anterior) => ({
                ...anterior,
                [chaveQuadroAtual]: [...(anterior[chaveQuadroAtual] || []), cardExcluido],
            }));
            definirErroAcaoCard(resposta.message || 'Nao foi possivel excluir o card.');
        }

        definirExcluindoCardId(null);
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
                <button
                    type="button"
                    className="sidebar-action"
                    title="Notificacoes"
                    aria-label="Ir para notificacoes do kanban"
                    onClick={() => navegar('/notificacao-kanban')}
                >
                    <i className="fas fa-bell" aria-hidden="true" />
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

                {erroAcaoCard && (
                    <p role="alert" style={{ color: '#b42318', marginBottom: '16px' }}>
                        {erroAcaoCard}
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
                                            {card.processTag && <p>Tag: {card.processTag}</p>}
                                            {card.budgetFileName && <p>Orcamento PDF: {card.budgetFileName}</p>}
                                            {card.clientDocument && <p>Documento cliente: {card.clientDocument}</p>}
                                            {card.clientAddress && <p>Endereco cliente: {card.clientAddress}</p>}
                                            {typeof card.homologadoCliente === 'boolean' && (
                                                <p>Cliente homologado: {card.homologadoCliente ? 'Sim' : 'Nao'}</p>
                                            )}
                                            {(card.updatedByProfile || card.createdByProfile) && (
                                                <p>
                                                    Perfil da ultima alteracao: {card.updatedByProfile || card.createdByProfile}
                                                </p>
                                            )}
                                            {card.footer && <small>{card.footer}</small>}
                                            <div className="lead-card-actions">
                                                <button
                                                    type="button"
                                                    className="lead-card-action-btn"
                                                    onClick={(evento) => {
                                                        evento.preventDefault();
                                                        evento.stopPropagation();
                                                        abrirFormularioEdicaoCard(card);
                                                    }}
                                                >
                                                    Alterar
                                                </button>
                                                {chaveQuadroAtual === CHAVE_QUADRO_VENDEDOR
                                                    && card.columnId === 'cadastro'
                                                    && card.homologadoCliente && (
                                                        <button
                                                            type="button"
                                                            className="lead-card-action-btn"
                                                            onClick={(evento) => {
                                                                evento.preventDefault();
                                                                evento.stopPropagation();
                                                                aoGerarPedido(card);
                                                            }}
                                                        >
                                                            Gerar Pedido
                                                        </button>
                                                    )}
                                                <button
                                                    type="button"
                                                    className="lead-card-action-btn lead-card-action-btn-danger"
                                                    disabled={excluindoCardId === card.id}
                                                    onClick={(evento) => {
                                                        evento.preventDefault();
                                                        evento.stopPropagation();
                                                        aoExcluirCard(card.id);
                                                    }}
                                                >
                                                    {excluindoCardId === card.id ? 'Excluindo...' : 'Excluir'}
                                                </button>
                                            </div>
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

                                <label htmlFor="processTag">Tag do fluxo</label>
                                <select
                                    id="processTag"
                                    name="processTag"
                                    value={dadosNovoCard.processTag}
                                    onChange={aoAlterarNovoCard}
                                >
                                    <option value="especial">Especial</option>
                                    <option value="normal">Normal</option>
                                </select>

                                <label htmlFor="budgetFile">Orcamento PDF</label>
                                <input
                                    id="budgetFile"
                                    name="budgetFile"
                                    type="file"
                                    accept="application/pdf"
                                    onChange={aoAlterarNovoCard}
                                />
                                {dadosNovoCard.budgetFileName && <small>Arquivo anexado: {dadosNovoCard.budgetFileName}</small>}

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

                                {chaveQuadroAtual === CHAVE_QUADRO_VENDEDOR && (
                                    <>
                                        <label htmlFor="clientDocument">Documento cliente (CNPJ/CPF)</label>
                                        <input
                                            id="clientDocument"
                                            name="clientDocument"
                                            type="text"
                                            value={dadosNovoCard.clientDocument}
                                            onChange={aoAlterarNovoCard}
                                            placeholder="00.000.000/0000-00"
                                        />

                                        <label htmlFor="clientAddress">Endereco cliente</label>
                                        <input
                                            id="clientAddress"
                                            name="clientAddress"
                                            type="text"
                                            value={dadosNovoCard.clientAddress}
                                            onChange={aoAlterarNovoCard}
                                            placeholder="Rua, numero, cidade"
                                        />

                                        <label htmlFor="homologadoCliente" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input
                                                id="homologadoCliente"
                                                name="homologadoCliente"
                                                type="checkbox"
                                                checked={dadosNovoCard.homologadoCliente}
                                                onChange={aoAlterarNovoCard}
                                            />
                                            Cliente homologado
                                        </label>
                                    </>
                                )}

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

                {mostrarFormularioEdicaoCard && (
                    <div className="kanban-modal-backdrop" role="presentation">
                        <div className="kanban-modal" role="dialog" aria-modal="true" aria-label="Editar card">
                            <h2>Editar card</h2>
                            <p>Altere os campos necessarios e salve para atualizar o card.</p>

                            <form className="kanban-modal-form" onSubmit={aoSalvarEdicaoCard}>
                                <label htmlFor="edit-columnId">Coluna</label>
                                <select
                                    id="edit-columnId"
                                    name="columnId"
                                    value={dadosEdicaoCard.columnId}
                                    onChange={aoAlterarEdicaoCard}
                                    required
                                >
                                    <option value="" disabled>Selecione</option>
                                    {colunasQuadro.map((coluna) => (
                                        <option key={coluna.id} value={coluna.id}>{coluna.title}</option>
                                    ))}
                                </select>

                                <label htmlFor="edit-title">Titulo</label>
                                <input
                                    id="edit-title"
                                    name="title"
                                    type="text"
                                    value={dadosEdicaoCard.title}
                                    onChange={aoAlterarEdicaoCard}
                                    required
                                />

                                <label htmlFor="edit-seller">Vendedor/Responsavel</label>
                                <input
                                    id="edit-seller"
                                    name="seller"
                                    type="text"
                                    value={dadosEdicaoCard.seller}
                                    onChange={aoAlterarEdicaoCard}
                                />

                                <label htmlFor="edit-processTag">Tag do fluxo</label>
                                <select
                                    id="edit-processTag"
                                    name="processTag"
                                    value={dadosEdicaoCard.processTag}
                                    onChange={aoAlterarEdicaoCard}
                                >
                                    <option value="especial">Especial</option>
                                    <option value="normal">Normal</option>
                                </select>

                                <label htmlFor="edit-budgetFile">Orcamento PDF</label>
                                <input
                                    id="edit-budgetFile"
                                    name="edit-budgetFile"
                                    type="file"
                                    accept="application/pdf"
                                    onChange={aoAlterarEdicaoCard}
                                />
                                {dadosEdicaoCard.budgetFileName && <small>Arquivo anexado: {dadosEdicaoCard.budgetFileName}</small>}

                                <label htmlFor="edit-details">Detalhes (uma linha por item)</label>
                                <textarea
                                    id="edit-details"
                                    name="details"
                                    rows="4"
                                    value={dadosEdicaoCard.details}
                                    onChange={aoAlterarEdicaoCard}
                                    required
                                />

                                <label htmlFor="edit-footer">Rodape</label>
                                <input
                                    id="edit-footer"
                                    name="footer"
                                    type="text"
                                    value={dadosEdicaoCard.footer}
                                    onChange={aoAlterarEdicaoCard}
                                />

                                {chaveQuadroAtual === CHAVE_QUADRO_VENDEDOR && (
                                    <>
                                        <label htmlFor="edit-clientDocument">Documento cliente (CNPJ/CPF)</label>
                                        <input
                                            id="edit-clientDocument"
                                            name="clientDocument"
                                            type="text"
                                            value={dadosEdicaoCard.clientDocument}
                                            onChange={aoAlterarEdicaoCard}
                                        />

                                        <label htmlFor="edit-clientAddress">Endereco cliente</label>
                                        <input
                                            id="edit-clientAddress"
                                            name="clientAddress"
                                            type="text"
                                            value={dadosEdicaoCard.clientAddress}
                                            onChange={aoAlterarEdicaoCard}
                                        />

                                        <label htmlFor="edit-homologadoCliente" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input
                                                id="edit-homologadoCliente"
                                                name="homologadoCliente"
                                                type="checkbox"
                                                checked={dadosEdicaoCard.homologadoCliente}
                                                onChange={aoAlterarEdicaoCard}
                                            />
                                            Cliente homologado
                                        </label>
                                    </>
                                )}

                                {erroEdicaoCard && <p className="kanban-modal-error">{erroEdicaoCard}</p>}

                                <div className="kanban-modal-actions">
                                    <button type="button" className="kanban-header-btn" onClick={fecharFormularioEdicaoCard}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="new-os-btn" disabled={salvandoEdicaoCard}>
                                        {salvandoEdicaoCard ? 'Salvando...' : 'Salvar alteracoes'}
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
