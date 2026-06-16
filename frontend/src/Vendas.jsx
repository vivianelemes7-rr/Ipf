import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Vendas.css';
import { sair } from './services/authService';
import { requisicao } from './services/httpClient';
import { API_ENDPOINTS } from './config/apiContract';

const STATUS_COR = {
    'Entregue': '#28a745',
    'Finalizado': '#28a745',
    'Finalizado/Entregue': '#28a745',
    'Em andamento': '#007bff',
    'Em Processamento': '#007bff',
    'Arquitetura': '#6f42c1',
    'Producao': '#17a2b8',
    'Produção': '#17a2b8',
    'Pendente': '#ffc107',
    'Cancelado': '#dc3545',
};

function normalizarCliente(cliente) {
    return {
        id: cliente.id,
        nome: cliente.empresa || cliente.nome_contato || 'Cliente sem nome',
        desde: cliente.data_cadastro,
        pedidos: Number(cliente.total_pedidos || 0),
        valorTotal: Number(cliente.valor_total_comprado || 0),
    };
}

function normalizarPedido(pedido) {
    return {
        id: pedido.numero_pedido || pedido.id,
        idInterno: pedido.id,
        clienteId: pedido.lead_id,
        clienteNome: pedido.cliente_nome || pedido.empresa || pedido.cliente_contato || '—',
        data: pedido.data_pedido,
        valor: Number(pedido.valor_total_fechado || 0),
        status: pedido.status_pedido || 'Sem status',
    };
}

function formatarData(data) {
    if (!data) return '—';

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
        return '—';
    }

    return dataFormatada.toLocaleDateString('pt-BR');
}

function calcularNivelCliente(cliente) {
    const agora = new Date();
    const desde = cliente.desde ? new Date(cliente.desde) : agora;

    const meses = (agora.getFullYear() - desde.getFullYear()) * 12 + (agora.getMonth() - desde.getMonth());

    const scoreSenioridade = Math.min(meses / 96, 1);
    const scorePedidos = Math.min(cliente.pedidos / 200, 1);
    const score = scoreSenioridade * 0.6 + scorePedidos * 0.4;

    if (score >= 0.75) return 'Diamante';
    if (score >= 0.50) return 'Ouro';
    if (score >= 0.25) return 'Prata';
    return 'Bronze';
}

const NIVEL_CONFIG = {
    Diamante: { cor: '#00bcd4', fundo: '#e0f7fa', icone: '💎' },
    Ouro: { cor: '#f9a825', fundo: '#fff8e1', icone: '🥇' },
    Prata: { cor: '#78909c', fundo: '#eceff1', icone: '🥈' },
    Bronze: { cor: '#bf8650', fundo: '#fbe9e7', icone: '🥉' },
};

export default function Vendas() {
    const navegar = useNavigate();
    const [filtroNivel, setFiltroNivel] = useState('Todos');
    const [abaSelecionada, setAbaSelecionada] = useState('clientes');
    const [clientes, setClientes] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        async function carregarDados() {
            try {
                setCarregando(true);
                setErro('');

                const [clientesApi, pedidosApi] = await Promise.all([
                    requisicao(API_ENDPOINTS.clientes.listar),
                    requisicao(API_ENDPOINTS.pedidos.listar),
                ]);

                setClientes(Array.isArray(clientesApi) ? clientesApi.map(normalizarCliente) : []);
                setPedidos(Array.isArray(pedidosApi) ? pedidosApi.map(normalizarPedido) : []);
            } catch (error) {
                console.error('Erro ao carregar dados de vendas:', error);
                setErro(error.message || 'Erro ao carregar dados de vendas.');
            } finally {
                setCarregando(false);
            }
        }

        carregarDados();
    }, []);

    const clientesComNivel = useMemo(() => (
        clientes
            .map(c => ({ ...c, nivel: calcularNivelCliente(c) }))
            .sort((a, b) => new Date(a.desde || 0) - new Date(b.desde || 0))
    ), [clientes]);

    const clientesFiltrados = filtroNivel === 'Todos'
        ? clientesComNivel
        : clientesComNivel.filter(c => c.nivel === filtroNivel);

    const totalVendas = pedidos
        .filter(p => p.status !== 'Cancelado')
        .reduce((s, p) => s + p.valor, 0);

    const totalPedidos = pedidos.length;

    const pedidosEntregues = pedidos.filter(p =>
        ['Entregue', 'Finalizado', 'Finalizado/Entregue'].includes(p.status)
    ).length;

    const clienteNome = (pedido) =>
        pedido.clienteNome || clientes.find(c => c.id === pedido.clienteId)?.nome || '—';

    return (
        <div className="vendas-page">
            {/* Header */}
            <div className="vendas-header">
                <div className="vendas-header-left">
                    <i className="fas fa-shopping-cart vendas-header-icon" />
                    <div>
                        <h1>Painel de Vendas e Pedidos</h1>
                        <p>Gestão completa de clientes e pedidos</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => {
                            sair();
                            navegar('/');
                        }}
                        className="vendas-btn-voltar"
                    >
                        Sair
                    </button>
                    <button onClick={() => navegar('/alterar-senha')} className="vendas-btn-voltar">
                        Alterar senha
                    </button>
                    <button onClick={() => navegar('/dashboard')} className="vendas-btn-voltar">
                        ← Voltar
                    </button>
                </div>
            </div>

            <div className="vendas-content">
                {/* KPIs */}
                <div className="vendas-kpis">
                    {[
                        { label: 'Total de Clientes', valor: clientes.length, icone: '👥', cor: '#3f51b5' },
                        { label: 'Total de Pedidos', valor: totalPedidos, icone: '📦', cor: '#009688' },
                        { label: 'Pedidos Entregues', valor: pedidosEntregues, icone: '✅', cor: '#43a047' },
                        { label: 'Faturamento (mês)', valor: `R$ ${totalVendas.toLocaleString('pt-BR')}`, icone: '💰', cor: '#f9a825' },
                    ].map(kpi => (
                        <div key={kpi.label} className="vendas-kpi-card" style={{ borderLeft: `4px solid ${kpi.cor}` }}>
                            <div className="vendas-kpi-icone">{kpi.icone}</div>
                            <div className="vendas-kpi-valor" style={{ color: kpi.cor }}>{kpi.valor}</div>
                            <div className="vendas-kpi-label">{kpi.label}</div>
                        </div>
                    ))}
                </div>

                {carregando && (
                    <div className="vendas-legenda">
                        Carregando dados reais de clientes e pedidos...
                    </div>
                )}

                {erro && (
                    <div className="vendas-legenda" style={{ color: '#dc3545' }}>
                        {erro}
                    </div>
                )}

                {/* Abas */}
                <div className="vendas-abas">
                    {['clientes', 'pedidos'].map(aba => (
                        <button
                            key={aba}
                            onClick={() => setAbaSelecionada(aba)}
                            className={`vendas-aba-btn${abaSelecionada === aba ? ' vendas-aba-btn--ativo' : ''}`}
                        >
                            {aba === 'clientes' ? '👥 Clientes' : '📦 Pedidos'}
                        </button>
                    ))}
                </div>

                {/* ABA CLIENTES */}
                {abaSelecionada === 'clientes' && (
                    <div>
                        {/* Filtro de níveis */}
                        <div className="vendas-filtro-row">
                            <span className="vendas-filtro-label">Filtrar por nível:</span>
                            {['Todos', 'Diamante', 'Ouro', 'Prata', 'Bronze'].map(n => {
                                const cfg = n === 'Todos' ? { cor: '#555', fundo: '#eee', icone: '🔍' } : NIVEL_CONFIG[n];
                                const ativo = filtroNivel === n;
                                return (
                                    <button
                                        key={n}
                                        onClick={() => setFiltroNivel(n)}
                                        className="vendas-filtro-btn"
                                        style={{
                                            borderColor: ativo ? cfg.cor : 'transparent',
                                            background: ativo ? cfg.fundo : '#fff',
                                            color: cfg.cor,
                                        }}
                                    >
                                        <span>{cfg.icone}</span> {n}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legenda explicativa */}
                        <div className="vendas-legenda">
                            {Object.entries(NIVEL_CONFIG).map(([nivel, cfg]) => (
                                <div key={nivel} className="vendas-legenda-item">
                                    <span className="vendas-legenda-icone">{cfg.icone}</span>
                                    <span className="vendas-legenda-nome" style={{ color: cfg.cor }}>{nivel}</span>
                                    <span className="vendas-legenda-desc">
                                        {nivel === 'Diamante' && '— Clientes mais antigos e ativos'}
                                        {nivel === 'Ouro' && '— Alta fidelidade'}
                                        {nivel === 'Prata' && '— Relacionamento médio'}
                                        {nivel === 'Bronze' && '— Clientes recentes'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Tabela de clientes */}
                        <div className="vendas-table-wrapper">
                            <table className="vendas-table">
                                <thead>
                                    <tr>
                                        {['Cliente', 'Cliente desde', 'Pedidos', 'Valor Total', 'Nível'].map(h => (
                                            <th key={h}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientesFiltrados.map((c) => {
                                        const cfg = NIVEL_CONFIG[c.nivel];
                                        return (
                                            <tr key={c.id}>
                                                <td className="vendas-td-nome">{c.nome}</td>
                                                <td className="vendas-td-data">{formatarData(c.desde)}</td>
                                                <td className="vendas-td-pedidos">{c.pedidos}</td>
                                                <td className="vendas-td-valor">R$ {c.valorTotal.toLocaleString('pt-BR')}</td>
                                                <td>
                                                    <span
                                                        className="vendas-nivel-badge"
                                                        style={{ background: cfg.fundo, color: cfg.cor, border: `1px solid ${cfg.cor}33` }}
                                                    >
                                                        {cfg.icone} {c.nivel}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {clientesFiltrados.length === 0 && !carregando && (
                                        <tr><td colSpan={5} className="vendas-table-empty">Nenhum cliente encontrado.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ABA PEDIDOS */}
                {abaSelecionada === 'pedidos' && (
                    <div className="vendas-table-wrapper">
                        <table className="vendas-table">
                            <thead>
                                <tr>
                                    {['Nº Pedido', 'Cliente', 'Data', 'Valor', 'Status'].map(h => (
                                        <th key={h}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pedidos.map((p) => {
                                    const corStatus = STATUS_COR[p.status] || '#6c757d';

                                    return (
                                        <tr key={p.idInterno || p.id}>
                                            <td className="vendas-td-numero">#{p.id}</td>
                                            <td className="vendas-td-cliente">{clienteNome(p)}</td>
                                            <td className="vendas-td-data">{formatarData(p.data)}</td>
                                            <td className="vendas-td-valor">R$ {p.valor.toLocaleString('pt-BR')}</td>
                                            <td>
                                                <span
                                                    className="vendas-status-badge"
                                                    style={{
                                                        background: `${corStatus}22`,
                                                        color: corStatus,
                                                        border: `1px solid ${corStatus}55`,
                                                    }}
                                                >
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {pedidos.length === 0 && !carregando && (
                                    <tr><td colSpan={5} className="vendas-table-empty">Nenhum pedido encontrado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
