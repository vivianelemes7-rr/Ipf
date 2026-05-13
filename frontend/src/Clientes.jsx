import { useState, useEffect } from 'react';
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

const FORM_VAZIO = { nome_contato: '', email: '', telefone: '', cidade: '', estado: 'RS', desde: '', pedidos: '', valor_total: '', nivel: 'Bronze' };

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
    const [clientes, setClientes] = useState([]);
    const [aba, setAba] = useState('lista');
    const [busca, setBusca] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('Todos');
    const [form, setForm] = useState(FORM_VAZIO);
    const [erros, setErros] = useState({});
    const [editandoId, setEditandoId] = useState(null);
    const [clienteParaExcluir, setClienteParaExcluir] = useState(null);

    useEffect(() => {
        carregarClientes();
    }, []);

    const carregarClientes = async () => {
        try {
            const res = await fetch('http://localhost:3000/leads');
            const dados = await res.json();
            setClientes(dados);
        } catch (err) {
            console.error("Erro ao carregar:", err);
        }
    };

    const clientesFiltrados = clientes
        .filter(c => filtroNivel === 'Todos' || c.nivel === filtroNivel)
        .filter(c => (c.nome_contato || '').toLowerCase().includes(busca.toLowerCase()) || (c.email || '').toLowerCase().includes(busca.toLowerCase()))
        .sort((a, b) => new Date(a.desde) - new Date(b.desde));

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
        if (!form.nome_contato?.trim()) e.nome_contato = 'Nome obrigatório';
        if (!form.email?.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'E-mail inválido';
        setErros(e);
        return Object.keys(e).length === 0;
    };

    const salvar = async () => {
        if (!validar()) return;
        const url = editandoId ? `http://localhost:3000/leads/${editandoId}` : 'http://localhost:3000/leads/cadastrar';
        const metodo = editandoId ? 'PUT' : 'POST';

        try {
            await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            carregarClientes();
            cancelarForm();
        } catch (err) {
            console.error(err);
        }
    };

    const iniciarEdicao = (c) => {
        setForm({ ...c });
        setEditandoId(c.id);
        setAba('cadastro');
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
            <div className="clientes-header">
                <div className="clientes-header-left">
                    <i className="fas fa-users clientes-header-icon" />
                    <div>
                        <h1>Gestão de Clientes</h1>
                        <p>Conectado ao Banco Aiven</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { sair(); navegar('/'); }} className="clientes-btn-voltar">Sair</button>
                    <button onClick={() => navegar('/dashboard')} className="clientes-btn-voltar">← Voltar</button>
                </div>
            </div>

            <div className="clientes-content">
                <div className="clientes-kpis">
                    {[
                        { label: 'Total', valor: clientes.length, icone: '👥', cor: '#2e7d32' },
                        { label: 'Receita', valor: `R$ ${clientes.reduce((s, c) => s + Number(c.valor_total || 0), 0).toLocaleString('pt-BR')}`, icone: '💰', cor: '#6a1b9a' },
                    ].map(kpi => (
                        <div key={kpi.label} className="clientes-kpi-card" style={{ borderLeft: `4px solid ${kpi.cor}` }}>
                            <div className="clientes-kpi-valor" style={{ color: kpi.cor }}>{kpi.valor}</div>
                            <div className="clientes-kpi-label">{kpi.label}</div>
                        </div>
                    ))}
                </div>

                <div className="clientes-abas">
                    <button onClick={() => setAba('lista')} className={`clientes-aba-btn${aba === 'lista' ? ' clientes-aba-btn--ativo' : ''}`}>📋 Lista</button>
                    <button onClick={() => setAba('cadastro')} className={`clientes-aba-btn${aba === 'cadastro' ? ' clientes-aba-btn--ativo' : ''}`}>➕ Novo</button>
                </div>

                {aba === 'lista' && (
                    <div>
                        <div className="clientes-busca-row">
                            <input placeholder="🔍 Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="clientes-busca-input" />
                        </div>
                        <div className="clientes-table-wrapper">
                            <table className="clientes-table">
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Contato</th>
                                        <th>Cidade/UF</th>
                                        <th>Valor Total</th>
                                        <th>Nível</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientesFiltrados.map((c) => (
                                        <tr key={c.id}>
                                            <td className="clientes-td-nome">{c.nome_contato}</td>
                                            <td className="clientes-td-contato">{c.email}</td>
                                            <td className="clientes-td-text">{c.cidade}/{c.estado}</td>
                                            <td className="clientes-td-valor">R$ {Number(c.valor_total || 0).toLocaleString('pt-BR')}</td>
                                            <td>
                                                <span className="clientes-nivel-badge" style={{ background: NIVEL_CONFIG[c.nivel]?.fundo, color: NIVEL_CONFIG[c.nivel]?.cor }}>
                                                    {NIVEL_CONFIG[c.nivel]?.icone} {c.nivel}
                                                </span>
                                            </td>
                                            <td>
                                                <button onClick={() => iniciarEdicao(c)} className="clientes-btn-editar">✏️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {aba === 'cadastro' && (
                    <div className="clientes-form-card">
                        <div className="clientes-form-grid">
                            <div className="clientes-form-full">
                                <label className="clientes-form-label">Nome *</label>
                                <input name="nome_contato" value={form.nome_contato} onChange={handleChange} className={inputClass('nome_contato')} />
                            </div>
                            <div>
                                <label className="clientes-form-label">E-mail *</label>
                                <input name="email" value={form.email} onChange={handleChange} className={inputClass('email')} />
                            </div>
                            <div>
                                <label className="clientes-form-label">Valor (R$)</label>
                                <input name="valor_total" type="number" value={form.valor_total} onChange={handleChange} className={inputClass('valor_total')} />
                            </div>
                        </div>
                        <div className="clientes-form-actions">
                            <button onClick={salvar} className="clientes-btn-salvar">Salvar</button>
                            <button onClick={cancelarForm} className="clientes-btn-cancelar">Cancelar</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

