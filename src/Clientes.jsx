import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Clientes.css';
import { sair } from './services/authService';

const NIVEIS = ['Diamante', 'Ouro', 'Prata', 'Bronze'];
const NIVEL_CONFIG = {
    Diamante: { cor: '#00bcd4', fundo: '#e0f7fa', icone: '💎' },
    Ouro: { cor: '#f9a825', fundo: '#fff8e1', icone: '🥇' },
    Prata: { cor: '#78909c', fundo: '#eceff1', icone: '🥈' },
    Bronze: { cor: '#bf8650', fundo: '#fbe9e7', icone: '🥉' },
};

const ESTADOS_BR = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const CLIENTES_INICIAIS = [
    { id: 1, nome: 'Empresa Alpha Ltda', email: 'alpha@alpha.com.br', telefone: '(11) 98765-4321', cidade: 'São Paulo', estado: 'SP', desde: '2018-03-10', pedidos: 142, valorTotal: 98500, nivel: 'Diamante' },
    { id: 2, nome: 'Comércio Beta S/A', email: 'beta@beta.com.br', telefone: '(21) 97654-3210', cidade: 'Rio de Janeiro', estado: 'RJ', desde: '2019-07-22', pedidos: 87, valorTotal: 61200, nivel: 'Ouro' },
    { id: 3, nome: 'Indústrias Gama', email: 'gama@gama.ind.br', telefone: '(31) 96543-2109', cidade: 'Belo Horizonte', estado: 'MG', desde: '2020-01-15', pedidos: 53, valorTotal: 37800, nivel: 'Prata' },
    { id: 4, nome: 'Distribuidora Delta', email: 'delta@delta.com', telefone: '(41) 95432-1098', cidade: 'Curitiba', estado: 'PR', desde: '2021-05-08', pedidos: 34, valorTotal: 22100, nivel: 'Prata' },
    { id: 5, nome: 'Loja Épsilon ME', email: 'epsilon@loja.com', telefone: '(51) 94321-0987', cidade: 'Porto Alegre', estado: 'RS', desde: '2022-09-30', pedidos: 18, valorTotal: 11400, nivel: 'Bronze' },
    { id: 6, nome: 'Serviços Zeta', email: 'zeta@zeta.srv.br', telefone: '(71) 93210-9876', cidade: 'Salvador', estado: 'BA', desde: '2023-02-14', pedidos: 9, valorTotal: 5600, nivel: 'Bronze' },
    { id: 7, nome: 'Grupo Eta Corp', email: 'eta@eta.corp.br', telefone: '(11) 92109-8765', cidade: 'Campinas', estado: 'SP', desde: '2018-11-01', pedidos: 210, valorTotal: 175000, nivel: 'Diamante' },
    { id: 8, nome: 'Theta Atacado', email: 'theta@atacado.com', telefone: '(81) 91098-7654', cidade: 'Recife', estado: 'PE', desde: '2019-04-20', pedidos: 76, valorTotal: 52300, nivel: 'Ouro' },
    { id: 9, nome: 'Iota Varejo', email: 'iota@varejo.com.br', telefone: '(62) 90987-6543', cidade: 'Goiânia', estado: 'GO', desde: '2023-08-05', pedidos: 5, valorTotal: 2900, nivel: 'Bronze' },
    { id: 10, nome: 'Kappa Soluções', email: 'kappa@solucoes.com', telefone: '(85) 89876-5432', cidade: 'Fortaleza', estado: 'CE', desde: '2020-12-11', pedidos: 41, valorTotal: 28700, nivel: 'Prata' },
];

const FORM_VAZIO = { nome: '', email: '', telefone: '', cidade: '', estado: 'SP', desde: '', pedidos: '', valorTotal: '', nivel: 'Bronze' };

function calcularNivel(desde, pedidos) {
    const meses = (new Date().getFullYear() - new Date(desde).getFullYear()) * 12 + (new Date().getMonth() - new Date(desde).getMonth());
    const score = Math.min(meses / 96, 1) * 0.6 + Math.min(pedidos / 200, 1) * 0.4;
    if (score >= 0.75) return 'Diamante';
    if (score >= 0.50) return 'Ouro';
    if (score >= 0.25) return 'Prata';
    return 'Bronze';
}

export default function Clientes() {
    const navegar = useNavigate();
    const [clientes, setClientes] = useState(CLIENTES_INICIAIS);
    const [aba, setAba] = useState('lista');
    const [busca, setBusca] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('Todos');
    const [form, setForm] = useState(FORM_VAZIO);
    const [erros, setErros] = useState({});
    const [editandoId, setEditandoId] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    const [clienteParaExcluir, setClienteParaExcluir] = useState(null);

    // --- LISTA FILTRADA ---
    const clientesFiltrados = clientes
        .filter(c => filtroNivel === 'Todos' || c.nivel === filtroNivel)
        .filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || c.email.toLowerCase().includes(busca.toLowerCase()))
        .sort((a, b) => new Date(a.desde) - new Date(b.desde));

    // --- FORMULÁRIO ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        const atualizado = { ...form, [name]: value };
        if (name === 'desde' || name === 'pedidos') {
            atualizado.nivel = calcularNivel(atualizado.desde || new Date().toISOString().slice(0, 10), Number(atualizado.pedidos) || 0);
        }
        setForm(atualizado);
    };

    const validar = () => {
        const e = {};
        if (!form.nome.trim()) e.nome = 'Nome obrigatório';
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'E-mail inválido';
        if (!form.telefone.trim()) e.telefone = 'Telefone obrigatório';
        if (!form.cidade.trim()) e.cidade = 'Cidade obrigatória';
        if (!form.desde) e.desde = 'Data obrigatória';
        if (!form.pedidos || isNaN(Number(form.pedidos)) || Number(form.pedidos) < 0) e.pedidos = 'Número de pedidos inválido';
        if (!form.valorTotal || isNaN(Number(form.valorTotal)) || Number(form.valorTotal) < 0) e.valorTotal = 'Valor inválido';
        setErros(e);
        return Object.keys(e).length === 0;
    };

    const salvar = () => {
        if (!validar()) return;
        const nivel = calcularNivel(form.desde, Number(form.pedidos));
        if (editandoId !== null) {
            setClientes(cs => cs.map(c => c.id === editandoId ? { ...form, id: editandoId, pedidos: Number(form.pedidos), valorTotal: Number(form.valorTotal), nivel } : c));
        } else {
            setClientes(cs => [...cs, { ...form, id: Date.now(), pedidos: Number(form.pedidos), valorTotal: Number(form.valorTotal), nivel }]);
        }
        setForm(FORM_VAZIO);
        setErros({});
        setEditandoId(null);
        setAba('lista');
    };

    const iniciarEdicao = (c) => {
        setForm({ ...c, pedidos: String(c.pedidos), valorTotal: String(c.valorTotal) });
        setEditandoId(c.id);
        setAba('cadastro');
    };

    const confirmarExclusao = () => {
        setClientes(cs => cs.filter(c => c.id !== clienteParaExcluir));
        setClienteParaExcluir(null);
    };

    const cancelarForm = () => {
        setForm(FORM_VAZIO);
        setErros({});
        setEditandoId(null);
        setAba('lista');
    };

    const inputClass = (campo) =>
        `clientes-form-input${erros[campo] ? ' clientes-form-input--erro' : ''}`;

    return (
        <div className="clientes-page">
            {/* Header */}
            <div className="clientes-header">
                <div className="clientes-header-left">
                    <i className="fas fa-users clientes-header-icon" />
                    <div>
                        <h1>Gestão de Clientes</h1>
                        <p>Cadastro, consulta e análise de clientes</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => {
                            sair();
                            navegar('/');
                        }}
                        className="clientes-btn-voltar"
                    >
                        Sair
                    </button>
                    <button onClick={() => navegar('/alterar-senha')} className="clientes-btn-voltar">
                        Alterar senha
                    </button>
                    <button onClick={() => navegar('/dashboard')} className="clientes-btn-voltar">
                        ← Voltar
                    </button>
                </div>
            </div>

            <div className="clientes-content">
                {/* KPIs */}
                <div className="clientes-kpis">
                    {[
                        { label: 'Total de Clientes', valor: clientes.length, icone: '👥', cor: '#2e7d32' },
                        { label: 'Clientes Diamante', valor: clientes.filter(c => c.nivel === 'Diamante').length, icone: '💎', cor: '#00bcd4' },
                        { label: 'Clientes Ouro', valor: clientes.filter(c => c.nivel === 'Ouro').length, icone: '🥇', cor: '#f9a825' },
                        { label: 'Receita Total', valor: `R$ ${clientes.reduce((s, c) => s + c.valorTotal, 0).toLocaleString('pt-BR')}`, icone: '💰', cor: '#6a1b9a' },
                    ].map(kpi => (
                        <div key={kpi.label} className="clientes-kpi-card" style={{ borderLeft: `4px solid ${kpi.cor}` }}>
                            <div className="clientes-kpi-icone">{kpi.icone}</div>
                            <div className="clientes-kpi-valor" style={{ color: kpi.cor }}>{kpi.valor}</div>
                            <div className="clientes-kpi-label">{kpi.label}</div>
                        </div>
                    ))}
                </div>

                {/* Abas */}
                <div className="clientes-abas">
                    {[
                        { key: 'lista', label: '📋 Lista de Clientes' },
                        { key: 'cadastro', label: editandoId ? '✏️ Editar Cliente' : '➕ Novo Cliente' },
                    ].map(a => (
                        <button
                            key={a.key}
                            onClick={() => { setAba(a.key); if (a.key !== 'cadastro') cancelarForm(); }}
                            className={`clientes-aba-btn${aba === a.key ? ' clientes-aba-btn--ativo' : ''}`}
                        >
                            {a.label}
                        </button>
                    ))}
                </div>

                {/* ===== ABA LISTA ===== */}
                {aba === 'lista' && (
                    <div>
                        <div className="clientes-busca-row">
                            <input
                                placeholder="🔍 Buscar por nome ou e-mail..."
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                                className="clientes-busca-input"
                            />
                            {['Todos', ...NIVEIS].map(n => {
                                const cfg = n === 'Todos' ? { cor: '#555', fundo: '#eee', icone: '🔍' } : NIVEL_CONFIG[n];
                                const ativo = filtroNivel === n;
                                return (
                                    <button
                                        key={n}
                                        onClick={() => setFiltroNivel(n)}
                                        className="clientes-filtro-btn"
                                        style={{
                                            borderColor: ativo ? cfg.cor : 'transparent',
                                            background: ativo ? cfg.fundo : '#fff',
                                            color: cfg.cor,
                                        }}
                                    >
                                        {cfg.icone} {n}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="clientes-table-wrapper">
                            <table className="clientes-table">
                                <thead>
                                    <tr>
                                        {['Cliente', 'Contato', 'Cidade/UF', 'Desde', 'Pedidos', 'Valor Total', 'Nível', 'Ações'].map(h => (
                                            <th key={h}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientesFiltrados.map((c) => {
                                        const cfg = NIVEL_CONFIG[c.nivel];
                                        return (
                                            <tr key={c.id}>
                                                <td className="clientes-td-nome">{c.nome}</td>
                                                <td className="clientes-td-contato">
                                                    <div>{c.email}</div>
                                                    <div className="clientes-td-telefone">{c.telefone}</div>
                                                </td>
                                                <td className="clientes-td-text">{c.cidade}/{c.estado}</td>
                                                <td className="clientes-td-text">{new Date(c.desde).toLocaleDateString('pt-BR')}</td>
                                                <td className="clientes-td-pedidos">{c.pedidos}</td>
                                                <td className="clientes-td-valor">R$ {c.valorTotal.toLocaleString('pt-BR')}</td>
                                                <td>
                                                    <span
                                                        className="clientes-nivel-badge"
                                                        style={{ background: cfg.fundo, color: cfg.cor, border: `1px solid ${cfg.cor}33` }}
                                                    >
                                                        {cfg.icone} {c.nivel}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="clientes-acoes">
                                                        <button onClick={() => iniciarEdicao(c)} className="clientes-btn-editar">✏️ Editar</button>
                                                        <button onClick={() => setClienteParaExcluir(c.id)} className="clientes-btn-excluir">🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {clientesFiltrados.length === 0 && (
                                        <tr><td colSpan={8} className="clientes-table-empty">Nenhum cliente encontrado.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ===== ABA CADASTRO ===== */}
                {aba === 'cadastro' && (
                    <div className="clientes-form-card">
                        <h2>{editandoId ? '✏️ Editar Cliente' : '➕ Cadastrar Novo Cliente'}</h2>

                        <div className="clientes-form-grid">
                            <div className="clientes-form-full">
                                <label className="clientes-form-label">Nome / Razão Social *</label>
                                <input name="nome" value={form.nome} onChange={handleChange} className={inputClass('nome')} placeholder="Ex: Empresa XYZ Ltda" />
                                {erros.nome && <span className="clientes-form-erro">{erros.nome}</span>}
                            </div>

                            <div>
                                <label className="clientes-form-label">E-mail *</label>
                                <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass('email')} placeholder="contato@empresa.com" />
                                {erros.email && <span className="clientes-form-erro">{erros.email}</span>}
                            </div>

                            <div>
                                <label className="clientes-form-label">Telefone *</label>
                                <input name="telefone" value={form.telefone} onChange={handleChange} className={inputClass('telefone')} placeholder="(00) 00000-0000" />
                                {erros.telefone && <span className="clientes-form-erro">{erros.telefone}</span>}
                            </div>

                            <div>
                                <label className="clientes-form-label">Cidade *</label>
                                <input name="cidade" value={form.cidade} onChange={handleChange} className={inputClass('cidade')} placeholder="Ex: São Paulo" />
                                {erros.cidade && <span className="clientes-form-erro">{erros.cidade}</span>}
                            </div>

                            <div>
                                <label className="clientes-form-label">Estado *</label>
                                <select name="estado" value={form.estado} onChange={handleChange} className={`${inputClass('estado')} clientes-form-select`}>
                                    {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="clientes-form-label">Cliente desde *</label>
                                <input name="desde" type="date" value={form.desde} onChange={handleChange} className={inputClass('desde')} />
                                {erros.desde && <span className="clientes-form-erro">{erros.desde}</span>}
                            </div>

                            <div>
                                <label className="clientes-form-label">Número de Pedidos *</label>
                                <input name="pedidos" type="number" min="0" value={form.pedidos} onChange={handleChange} className={inputClass('pedidos')} placeholder="0" />
                                {erros.pedidos && <span className="clientes-form-erro">{erros.pedidos}</span>}
                            </div>

                            <div>
                                <label className="clientes-form-label">Valor Total (R$) *</label>
                                <input name="valorTotal" type="number" min="0" value={form.valorTotal} onChange={handleChange} className={inputClass('valorTotal')} placeholder="0" />
                                {erros.valorTotal && <span className="clientes-form-erro">{erros.valorTotal}</span>}
                            </div>

                            {form.desde && form.pedidos !== '' && (
                                <div className="clientes-form-full">
                                    <label className="clientes-form-label">Nível calculado automaticamente</label>
                                    <div
                                        className="clientes-nivel-preview"
                                        style={{
                                            background: NIVEL_CONFIG[form.nivel]?.fundo,
                                            color: NIVEL_CONFIG[form.nivel]?.cor,
                                            border: `1px solid ${NIVEL_CONFIG[form.nivel]?.cor}55`,
                                        }}
                                    >
                                        {NIVEL_CONFIG[form.nivel]?.icone} {form.nivel}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="clientes-form-actions">
                            <button onClick={salvar} className="clientes-btn-salvar">
                                {editandoId ? '💾 Salvar Alterações' : '✅ Cadastrar Cliente'}
                            </button>
                            <button onClick={cancelarForm} className="clientes-btn-cancelar">Cancelar</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de confirmação de exclusão */}
            {clienteParaExcluir && (
                <div className="clientes-modal-overlay">
                    <div className="clientes-modal">
                        <div className="clientes-modal-icone">⚠️</div>
                        <h3>Confirmar exclusão</h3>
                        <p>Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</p>
                        <div className="clientes-modal-acoes">
                            <button onClick={confirmarExclusao} className="clientes-modal-btn-excluir">Excluir</button>
                            <button onClick={() => setClienteParaExcluir(null)} className="clientes-modal-btn-cancelar">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
