import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Clientes.css';
import { sair } from './services/authService';
import { requisicao } from './services/httpClient';
import { API_ENDPOINTS } from './config/apiContract';

const NIVEIS = ['Diamante', 'Ouro', 'Prata', 'Bronze'];

const NIVEL_CONFIG = {
    Diamante: { cor: '#00bcd4', fundo: '#e0f7fa', icone: '💎' },
    Ouro: { cor: '#f9a825', fundo: '#fff8e1', icone: '🥇' },
    Prata: { cor: '#78909c', fundo: '#eceff1', icone: '🥈' },
    Bronze: { cor: '#bf8650', fundo: '#fbe9e7', icone: '🥉' },
};

const ESTADOS_BR = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const FORM_VAZIO = {
    nome: '',
    email: '',
    telefone: '',
    cidade: '',
    estado: 'SP',
    cpf_cnpj: '',
    endereco_completo: '',
    origem: 'Vendas',
    instagram: '',
    site: '',
    indicacao: '',
    status_lead: 'Novo',
    notas: '',
    desde: '',
    pedidos: '',
    valorTotal: '',
    nivel: 'Bronze',
};

function calcularNivel(desde, pedidos) {
    if (!desde) return 'Bronze';

    const dataDesde = new Date(desde);
    if (Number.isNaN(dataDesde.getTime())) return 'Bronze';

    const agora = new Date();
    const meses =
        (agora.getFullYear() - dataDesde.getFullYear()) * 12 +
        (agora.getMonth() - dataDesde.getMonth());

    const score =
        Math.min(meses / 96, 1) * 0.6 +
        Math.min(Number(pedidos || 0) / 200, 1) * 0.4;

    if (score >= 0.75) return 'Diamante';
    if (score >= 0.50) return 'Ouro';
    if (score >= 0.25) return 'Prata';
    return 'Bronze';
}

function extrairCidadeEstado(enderecoCompleto) {
    if (!enderecoCompleto) {
        return { cidade: '', estado: '' };
    }

    const partes = String(enderecoCompleto).split(',');
    const ultimaParte = partes[partes.length - 1]?.trim() || '';

    const match = ultimaParte.match(/^(.+?)\s*-\s*([A-Z]{2})$/);

    if (!match) {
        return { cidade: '', estado: '' };
    }

    return {
        cidade: match[1].trim(),
        estado: match[2].trim(),
    };
}

function formatarCidadeEstado(cidade, estado) {
    if (cidade && estado) return `${cidade}/${estado}`;
    if (cidade) return cidade;
    if (estado) return estado;
    return '—';
}

function formatarData(data) {
    if (!data) return '—';

    const dataObj = new Date(data);
    if (Number.isNaN(dataObj.getTime())) return '—';

    return dataObj.toLocaleDateString('pt-BR');
}

function normalizarCliente(cliente) {
    const enderecoExtraido = extrairCidadeEstado(cliente.endereco_completo);

    const nome =
        cliente.empresa ||
        cliente.nome_contato ||
        cliente.nome ||
        'Cliente sem nome';

    const desde =
        cliente.data_cadastro ||
        cliente.created_at ||
        cliente.desde ||
        '';

    const pedidos = Number(
        cliente.total_pedidos ??
        cliente.pedidos ??
        0
    );

    const valorTotal = Number(
        cliente.valor_total_comprado ??
        cliente.valor_total ??
        cliente.valorTotal ??
        0
    );

    return {
        id: cliente.id,
        nome,
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        cidade: cliente.cidade || enderecoExtraido.cidade || '',
        estado: cliente.estado || enderecoExtraido.estado || '',
        desde,
        pedidos,
        valorTotal,
        nivel: cliente.nivel || calcularNivel(desde, pedidos),

        cpf_cnpj: cliente.cpf_cnpj || '',
        nome_contato: cliente.nome_contato || '',
        empresa: cliente.empresa || '',
        origem: cliente.origem || '',
         instagram: cliente.instagram || '',
        site: cliente.site || '',
        indicacao: cliente.indicacao || '',
        status_lead: cliente.status_lead || '',
        convertido: Boolean(cliente.convertido),
        notas: cliente.notas || '',
        endereco_completo: cliente.endereco_completo || '',
    };
}
function montarPayloadLead(formulario) {
    const cidade = formulario.cidade.trim();
    const estado = formulario.estado.trim();
    const nomeContato = formulario.nome.trim();
    const email = formulario.email.trim().toLowerCase();
    const telefone = formulario.telefone.trim();
    const enderecoCompleto = formulario.endereco_completo.trim();
    const origem = formulario.origem.trim() || 'Vendas';
    const notas = formulario.notas.trim();

    return {
        nome_contato: nomeContato,
        empresa: nomeContato,
        cpf_cnpj: formulario.cpf_cnpj.trim() || null,
        telefone,
        email,
        endereco_completo: enderecoCompleto || (cidade && estado ? `${cidade} - ${estado}` : cidade || null),
        cidade,
        estado,
        origem,
        instagram: formulario.instagram.trim() || null,
        site: formulario.site.trim() || null,
        indicacao: formulario.indicacao.trim() || null,
        data_cadastro: formulario.desde ? new Date(formulario.desde).toISOString() : new Date().toISOString(),
        status_lead: formulario.status_lead || 'Novo',
        convertido: false,
        notas: [
            notas,
            formulario.pedidos ? `Pedidos: ${formulario.pedidos}` : '',
            formulario.valorTotal ? `Valor total: R$ ${Number(formulario.valorTotal).toLocaleString('pt-BR')}` : '',
            formulario.nivel ? `Nível: ${formulario.nivel}` : '',
        ].filter(Boolean).join(' | ') || null,
    };
}

function extrairListaClientes(resposta) {
    if (Array.isArray(resposta)) return resposta;
    if (Array.isArray(resposta?.data)) return resposta.data;
    if (Array.isArray(resposta?.dados)) return resposta.dados;
    if (Array.isArray(resposta?.clientes)) return resposta.clientes;
    return [];
}

export default function Clientes() {
    const navegar = useNavigate();

    const [clientes, setClientes] = useState([]);
    const [estaCarregando, setEstaCarregando] = useState(true);
    const [erroCarregamento, setErroCarregamento] = useState('');
    const [aba, setAba] = useState('lista');
    const [busca, setBusca] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('Todos');
    const [form, setForm] = useState(FORM_VAZIO);
    const [erros, setErros] = useState({});
    const [editandoId, setEditandoId] = useState(null);
    const [clienteParaExcluir, setClienteParaExcluir] = useState(null);

    useEffect(() => {
        let estaMontado = true;

        async function carregarClientes() {
            setEstaCarregando(true);
            setErroCarregamento('');

            try {
                const resposta = await requisicao(API_ENDPOINTS.leads.listar);

                if (!estaMontado) return;

                const lista = extrairListaClientes(resposta).map(normalizarCliente);
                setClientes(lista);
            } catch (erro) {
                if (!estaMontado) return;

                console.error('Erro ao carregar clientes:', erro);
                setErroCarregamento(erro.message || 'Erro ao carregar clientes.');
                setClientes([]);
            } finally {
                if (estaMontado) {
                    setEstaCarregando(false);
                }
            }
        }

        carregarClientes();

        return () => {
            estaMontado = false;
        };
    }, []);

    const clientesFiltrados = clientes
        .filter(c => filtroNivel === 'Todos' || c.nivel === filtroNivel)
        .filter(c => {
            const termoBusca = busca.toLowerCase();

            return (
                String(c.nome || '').toLowerCase().includes(termoBusca) ||
                String(c.email || '').toLowerCase().includes(termoBusca) ||
                String(c.telefone || '').toLowerCase().includes(termoBusca)
            );
        })
        .sort((a, b) => new Date(a.desde || 0) - new Date(b.desde || 0));

    const handleChange = (e) => {
        const { name, value } = e.target;
        const atualizado = { ...form, [name]: value };

        if (name === 'desde' || name === 'pedidos') {
            atualizado.nivel = calcularNivel(
                atualizado.desde || new Date().toISOString().slice(0, 10),
                Number(atualizado.pedidos) || 0
            );
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

     const salvar = async () => {
        if (!validar()) return;

        const nivel = calcularNivel(form.desde, Number(form.pedidos));
        const payloadLead = montarPayloadLead(form);
         
         try {
            if (editandoId !== null) {
                const resposta = await requisicao(API_ENDPOINTS.leads.atualizar(editandoId), {
                    metodo: 'PUT',
                    corpo: payloadLead,
                });

                const leadAtualizado = normalizarCliente(resposta || { ...payloadLead, id: editandoId });

                setClientes((cs) =>
                    cs.map((c) =>
                        c.id === editandoId
                            ? {
                                ...c,
                                ...leadAtualizado,
                                id: editandoId,
                                pedidos: Number(form.pedidos),
                                valorTotal: Number(form.valorTotal),
                                nivel,
                            }
                            : c
                    )
                );
            } else {
                const resposta = await requisicao(API_ENDPOINTS.leads.criar, {
                    metodo: 'POST',
                    corpo: payloadLead,
                });

                const leadCriado = normalizarCliente(resposta || payloadLead);

                setClientes((cs) => [
                    ...cs,
                    {
                        ...leadCriado,
                        pedidos: Number(form.pedidos),
                        valorTotal: Number(form.valorTotal),
                        nivel,
                    },
                ]);
            }

        setErros({});
            setEditandoId(null);
            setAba('lista');
        } catch (erro) {
            console.error('Erro ao salvar lead:', erro);
            setErroCarregamento(erro.message || 'Não foi possível salvar o lead.');
        }
    };

    const iniciarEdicao = (c) => {
        setForm({
            ...c,
            pedidos: String(c.pedidos),
            valorTotal: String(c.valorTotal),
        });
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

                    <button
                        onClick={() => navegar('/alterar-senha')}
                        className="clientes-btn-voltar"
                    >
                        Alterar senha
                    </button>

                    <button
                        onClick={() => navegar('/dashboard')}
                        className="clientes-btn-voltar"
                    >
                        ← Voltar
                    </button>
                </div>
            </div>

            <div className="clientes-content">
                <div className="clientes-kpis">
                    {[
                        {
                            label: 'Total de Clientes',
                            valor: clientes.length,
                            icone: '👥',
                            cor: '#2e7d32',
                        },
                        {
                            label: 'Clientes Diamante',
                            valor: clientes.filter(c => c.nivel === 'Diamante').length,
                            icone: '💎',
                            cor: '#00bcd4',
                        },
                        {
                            label: 'Clientes Ouro',
                            valor: clientes.filter(c => c.nivel === 'Ouro').length,
                            icone: '🥇',
                            cor: '#f9a825',
                        },
                        {
                            label: 'Receita Total',
                            valor: `R$ ${clientes.reduce((s, c) => s + Number(c.valorTotal || 0), 0).toLocaleString('pt-BR')}`,
                            icone: '💰',
                            cor: '#6a1b9a',
                        },
                    ].map(kpi => (
                        <div
                            key={kpi.label}
                            className="clientes-kpi-card"
                            style={{ borderLeft: `4px solid ${kpi.cor}` }}
                        >
                            <div className="clientes-kpi-icone">{kpi.icone}</div>
                            <div className="clientes-kpi-valor" style={{ color: kpi.cor }}>
                                {kpi.valor}
                            </div>
                            <div className="clientes-kpi-label">{kpi.label}</div>
                        </div>
                    ))}
                </div>

                {estaCarregando && (
                    <div className="clientes-table-empty">Carregando clientes...</div>
                )}

                {erroCarregamento && (
                    <div className="clientes-table-empty">{erroCarregamento}</div>
                )}

                <div className="clientes-abas">
                    {[
                        { key: 'lista', label: '📋 Lista de Clientes' },
                        { key: 'cadastro', label: editandoId ? '✏️ Editar Cliente' : '➕ Novo Cliente' },
                    ].map(a => (
                        <button
                            key={a.key}
                            onClick={() => {
                                setAba(a.key);
                                if (a.key !== 'cadastro') cancelarForm();
                            }}
                            className={`clientes-aba-btn${aba === a.key ? ' clientes-aba-btn--ativo' : ''}`}
                        >
                            {a.label}
                        </button>
                    ))}
                </div>

                {aba === 'lista' && (
                    <div>
                        <div className="clientes-busca-row">
                            <input
                                placeholder="🔍 Buscar por nome, e-mail ou telefone..."
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                                className="clientes-busca-input"
                            />

                            {['Todos', ...NIVEIS].map(n => {
                                const cfg =
                                    n === 'Todos'
                                        ? { cor: '#555', fundo: '#eee', icone: '🔍' }
                                        : NIVEL_CONFIG[n];

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
                                        {[
                                            'Cliente',
                                            'Contato',
                                            'Cidade/UF',
                                            'Desde',
                                            'Pedidos',
                                            'Valor Total',
                                            'Nível',
                                            'Ações',
                                        ].map(h => (
                                            <th key={h}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {clientesFiltrados.map((c) => {
                                        const cfg = NIVEL_CONFIG[c.nivel] || NIVEL_CONFIG.Bronze;

                                        return (
                                            <tr key={c.id}>
                                                <td className="clientes-td-nome">
                                                    {c.nome}
                                                </td>

                                                <td className="clientes-td-contato">
                                                    <div>{c.email || '—'}</div>
                                                    <div className="clientes-td-telefone">
                                                        {c.telefone || '—'}
                                                    </div>
                                                </td>

                                                <td className="clientes-td-text">
                                                    {formatarCidadeEstado(c.cidade, c.estado)}
                                                </td>

                                                <td className="clientes-td-text">
                                                    {formatarData(c.desde)}
                                                </td>

                                                <td className="clientes-td-pedidos">
                                                    {c.pedidos}
                                                </td>

                                                <td className="clientes-td-valor">
                                                    R$ {Number(c.valorTotal || 0).toLocaleString('pt-BR')}
                                                </td>

                                                <td>
                                                    <span
                                                        className="clientes-nivel-badge"
                                                        style={{
                                                            background: cfg.fundo,
                                                            color: cfg.cor,
                                                            border: `1px solid ${cfg.cor}33`,
                                                        }}
                                                    >
                                                        {cfg.icone} {c.nivel}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="clientes-acoes">
                                                        <button
                                                            onClick={() => iniciarEdicao(c)}
                                                            className="clientes-btn-editar"
                                                        >
                                                            ✏️ Editar
                                                        </button>

                                                        <button
                                                            onClick={() => setClienteParaExcluir(c.id)}
                                                            className="clientes-btn-excluir"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {clientesFiltrados.length === 0 && !estaCarregando && (
                                        <tr>
                                            <td colSpan={8} className="clientes-table-empty">
                                                Nenhum cliente encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {aba === 'cadastro' && (
                    <div className="clientes-form-card">
                        <h2>{editandoId ? '✏️ Editar Cliente' : '➕ Cadastrar Novo Cliente'}</h2>

                        <div className="clientes-form-grid">
                            <div className="clientes-form-full">
                                <label className="clientes-form-label">
                                    Nome / Razão Social *
                                </label>
                                <input
                                    name="nome"
                                    value={form.nome}
                                    onChange={handleChange}
                                    className={inputClass('nome')}
                                    placeholder="Ex: Empresa XYZ Ltda"
                                />
                                {erros.nome && <span className="clientes-form-erro">{erros.nome}</span>}
                            </div>

                            <div>
                                <label className="clientes-form-label">E-mail *</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={inputClass('email')}
                                    placeholder="contato@empresa.com"
                                />
                                {erros.email && <span className="clientes-form-erro">{erros.email}</span>}
                            </div>

                            <div>
                                <label className="clientes-form-label">Telefone *</label>
                                <input
                                    name="telefone"
                                    value={form.telefone}
                                    onChange={handleChange}
                                    className={inputClass('telefone')}
                                    placeholder="(00) 00000-0000"
                                />
                                {erros.telefone && <span className="clientes-form-erro">{erros.telefone}</span>}
                            </div>

                            <div>
                                <label className="clientes-form-label">Cidade *</label>
                                <input
                                    name="cidade"
                                    value={form.cidade}
                                    onChange={handleChange}
                                    className={inputClass('cidade')}
                                    placeholder="Ex: São Paulo"
                                />
                                {erros.cidade && <span className="clientes-form-erro">{erros.cidade}</span>}
                            </div>

                            <div>
                                <label className="clientes-form-label">Estado *</label>
                                <select
                                    name="estado"
                                    value={form.estado}
                                    onChange={handleChange}
                                    className={`${inputClass('estado')} clientes-form-select`}
                                >
                                    {ESTADOS_BR.map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))}
                                </select>
                            </div>
                                                       <div>
                                <label className="clientes-form-label">CPF / CNPJ</label>
                                <input
                                    name="cpf_cnpj"
                                    value={form.cpf_cnpj}
                                    onChange={handleChange}
                                    className={inputClass('cpf_cnpj')}
                                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                                />
                            </div>

                            <div className="clientes-form-full">
                                <label className="clientes-form-label">Endereço completo</label>
                                <input
                                    name="endereco_completo"
                                    value={form.endereco_completo}
                                    onChange={handleChange}
                                    className={inputClass('endereco_completo')}
                                    placeholder="Rua, número, bairro, cidade - UF"
                                />
                            </div>

                            <div>
                                <label className="clientes-form-label">Origem</label>
                                <input
                                    name="origem"
                                    value={form.origem}
                                    onChange={handleChange}
                                    className={inputClass('origem')}
                                    placeholder="Ex: Vendas, Instagram, Indicação"
                                />
                            </div>

                            <div>
                                <label className="clientes-form-label">Status do lead</label>
                                <select
                                    name="status_lead"
                                    value={form.status_lead}
                                    onChange={handleChange}
                                    className={`${inputClass('status_lead')} clientes-form-select`}
                                >
                                    <option value="Novo">Novo</option>
                                    <option value="Qualificado">Qualificado</option>
                                    <option value="Descartado">Descartado</option>
                                </select>
                            </div>

                            <div>
                                <label className="clientes-form-label">Instagram</label>
                                <input
                                    name="instagram"
                                    value={form.instagram}
                                    onChange={handleChange}
                                    className={inputClass('instagram')}
                                    placeholder="@perfil"
                                />
                            </div>

                            <div>
                                <label className="clientes-form-label">Site</label>
                                <input
                                    name="site"
                                    value={form.site}
                                    onChange={handleChange}
                                    className={inputClass('site')}
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="clientes-form-label">Indicação</label>
                                <input
                                    name="indicacao"
                                    value={form.indicacao}
                                    onChange={handleChange}
                                    className={inputClass('indicacao')}
                                    placeholder="Quem indicou o lead"
                                />
                            </div>

                            <div className="clientes-form-full">
                                <label className="clientes-form-label">Notas</label>
                                <textarea
                                    name="notas"
                                    value={form.notas}
                                    onChange={handleChange}
                                    className={inputClass('notas')}
                                    rows="4"
                                    placeholder="Observações comerciais, perfil, interesse, urgência..."
                                />
                            </div>

                            <div>
                                <label className="clientes-form-label">Cliente desde *</label>
                                <input
                                    name="desde"
                                    type="date"
                                    value={form.desde}
                                    onChange={handleChange}
                                    className={inputClass('desde')}
                                />
                                {erros.desde && <span className="clientes-form-erro">{erros.desde}</span>}
                            </div>

                            <div>
                                <label className="clientes-form-label">Número de Pedidos *</label>
                                <input
                                    name="pedidos"
                                    type="number"
                                    min="0"
                                    value={form.pedidos}
                                    onChange={handleChange}
                                    className={inputClass('pedidos')}
                                    placeholder="0"
                                />
                                {erros.pedidos && <span className="clientes-form-erro">{erros.pedidos}</span>}
                            </div>

                            <div>
                                <label className="clientes-form-label">Valor Total (R$) *</label>
                                <input
                                    name="valorTotal"
                                    type="number"
                                    min="0"
                                    value={form.valorTotal}
                                    onChange={handleChange}
                                    className={inputClass('valorTotal')}
                                    placeholder="0"
                                />
                                {erros.valorTotal && <span className="clientes-form-erro">{erros.valorTotal}</span>}
                            </div>

                            {form.desde && form.pedidos !== '' && (
                                <div className="clientes-form-full">
                                    <label className="clientes-form-label">
                                        Nível calculado automaticamente
                                    </label>

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
                           <button type="button" onClick={salvar} className="clientes-btn-salvar">
                                {editandoId ? '💾 Salvar Alterações' : '✅ Cadastrar Cliente'}
                            </button>

                           <button type="button" onClick={cancelarForm} className="clientes-btn-cancelar"
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {clienteParaExcluir && (
                <div className="clientes-modal-overlay">
                    <div className="clientes-modal">
                        <div className="clientes-modal-icone">⚠️</div>

                        <h3>Confirmar exclusão</h3>

                        <p>
                            Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
                        </p>

                        <div className="clientes-modal-acoes">
                            <button
                                onClick={confirmarExclusao}
                                className="clientes-modal-btn-excluir"
                            >
                                Excluir
                            </button>

                            <button
                                onClick={() => setClienteParaExcluir(null)}
                                className="clientes-modal-btn-cancelar"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
