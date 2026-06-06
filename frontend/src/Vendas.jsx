import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Vendas.css';
import { sair } from './services/authService';

const CLIENTES_MOCK = [
    { id: 1, nome: 'Empresa Alpha Ltda', desde: '2018-03-10', pedidos: 142, valorTotal: 98500 },
    { id: 2, nome: 'Comércio Beta S/A', desde: '2019-07-22', pedidos: 87, valorTotal: 61200 },
    { id: 3, nome: 'Indústrias Gama', desde: '2020-01-15', pedidos: 53, valorTotal: 37800 },
    { id: 4, nome: 'Distribuidora Delta', desde: '2021-05-08', pedidos: 34, valorTotal: 22100 },
    { id: 5, nome: 'Loja Épsilon ME', desde: '2022-09-30', pedidos: 18, valorTotal: 11400 },
    { id: 6, nome: 'Serviços Zeta', desde: '2023-02-14', pedidos: 9, valorTotal: 5600 },
    { id: 7, nome: 'Grupo Eta Corp', desde: '2018-11-01', pedidos: 210, valorTotal: 175000 },
    { id: 8, nome: 'Theta Atacado', desde: '2019-04-20', pedidos: 76, valorTotal: 52300 },
    { id: 9, nome: 'Iota Varejo', desde: '2023-08-05', pedidos: 5, valorTotal: 2900 },
    { id: 10, nome: 'Kappa Soluções', desde: '2020-12-11', pedidos: 41, valorTotal: 28700 },
];

const PEDIDOS_MOCK = [
    { id: 1001, clienteId: 1, data: '2026-04-15', valor: 4800, status: 'Entregue' },
    { id: 1002, clienteId: 7, data: '2026-04-16', valor: 12300, status: 'Em andamento' },
    { id: 1003, clienteId: 3, data: '2026-04-16', valor: 2100, status: 'Pendente' },
    { id: 1004, clienteId: 2, data: '2026-04-17', valor: 7500, status: 'Entregue' },
    { id: 1005, clienteId: 5, data: '2026-04-17', valor: 980, status: 'Cancelado' },
    { id: 1006, clienteId: 8, data: '2026-04-18', valor: 3300, status: 'Em andamento' },
    { id: 1007, clienteId: 4, data: '2026-04-18', valor: 1750, status: 'Pendente' },
    { id: 1008, clienteId: 1, data: '2026-04-18', valor: 6200, status: 'Em andamento' },
];

const STATUS_COR = {
    'Entregue': '#28a745',
    'Em andamento': '#007bff',
    'Pendente': '#ffc107',
    'Cancelado': '#dc3545',
};

function calcularNivelCliente(cliente) {
    const agora = new Date();
    const desde = new Date(cliente.desde);
    const meses = (agora.getFullYear() - desde.getFullYear()) * 12 + (agora.getMonth() - desde.getMonth());
    // Score: meses de relacionamento (peso 60%) + pedidos (peso 40%), normalizado
    const scoreSenioridade = Math.min(meses / 96, 1); // máx ~8 anos
    const scorePedidos = Math.min(cliente.pedidos / 200, 1); // máx 200 pedidos
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

const clientesComNivel = CLIENTES_MOCK.map(c => ({ ...c, nivel: calcularNivelCliente(c) }))
    .sort((a, b) => new Date(a.desde) - new Date(b.desde));

export default function Vendas() {
    const navegar = useNavigate();
    const [filtroNivel, setFiltroNivel] = useState('Todos');
    const [abaSelecionada, setAbaSelecionada] = useState('clientes');

    const clientesFiltrados = filtroNivel === 'Todos'
        ? clientesComNivel
        : clientesComNivel.filter(c => c.nivel === filtroNivel);

    const totalVendas = PEDIDOS_MOCK.filter(p => p.status !== 'Cancelado').reduce((s, p) => s + p.valor, 0);
    const totalPedidos = PEDIDOS_MOCK.length;
    const pedidosEntregues = PEDIDOS_MOCK.filter(p => p.status === 'Entregue').length;

    const clienteNome = (id) => CLIENTES_MOCK.find(c => c.id === id)?.nome || '—';

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
                        { label: 'Total de Clientes', valor: CLIENTES_MOCK.length, icone: '👥', cor: '#3f51b5' },
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
                                                <td className="vendas-td-data">{new Date(c.desde).toLocaleDateString('pt-BR')}</td>
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
                                    {clientesFiltrados.length === 0 && (
                                        <tr><td colSpan={5} className="vendas-table-empty">Nenhum cliente neste nível.</td></tr>
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
                                {PEDIDOS_MOCK.map((p) => (
                                    <tr key={p.id}>
                                        <td className="vendas-td-numero">#{p.id}</td>
                                        <td className="vendas-td-cliente">{clienteNome(p.clienteId)}</td>
                                        <td className="vendas-td-data">{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                                        <td className="vendas-td-valor">R$ {p.valor.toLocaleString('pt-BR')}</td>
                                        <td>
                                            <span
                                                className="vendas-status-badge"
                                                style={{
                                                    background: STATUS_COR[p.status] + '22',
                                                    color: STATUS_COR[p.status],
                                                    border: `1px solid ${STATUS_COR[p.status]}55`,
                                                }}
                                            >
                                                {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
