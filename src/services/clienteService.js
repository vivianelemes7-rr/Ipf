const AppError = require('../utils/AppError');
const ClienteModel = require('../models/clienteModel');

function formatarData(data) {
    if (!data) return null;
    return new Date(data).toISOString().slice(0, 10);
}

function calcularNivel(totalPedidos = 0, valorTotal = 0) {
    const pedidos = Number(totalPedidos) || 0;
    const valor = Number(valorTotal) || 0;

    if (pedidos >= 20 || valor >= 100000) return 'Diamante';
    if (pedidos >= 10 || valor >= 50000) return 'Ouro';
    if (pedidos >= 3 || valor >= 15000) return 'Prata';
    return 'Bronze';
}

function normalizarBoolean(valor) {
    return valor === true || valor === 1;
}

class ClienteService {
    static formatarClienteParaFrontend(cliente) {
        if (!cliente) return null;

        const pedidos = Number(cliente.total_pedidos) || 0;
        const valorTotal = Number(cliente.valor_total_comprado) || 0;

        return {
            id: cliente.id,
            nome: cliente.empresa || cliente.nome_contato,
            nome_contato: cliente.nome_contato,
            empresa: cliente.empresa,
            cpf_cnpj: cliente.cpf_cnpj,
            email: cliente.email,
            telefone: cliente.telefone,
            cidade: cliente.cidade,
            estado: cliente.estado,
            endereco_completo: cliente.endereco_completo,
            desde: formatarData(cliente.data_cadastro),
            pedidos,
            valorTotal,
            nivel: calcularNivel(pedidos, valorTotal),
            origem: cliente.origem,
            status_lead: cliente.status_lead,
            convertido: normalizarBoolean(cliente.convertido),
            notas: cliente.notas,
            ultimo_pedido_data: formatarData(cliente.ultimo_pedido_data)
        };
    }

    static validarDadosCliente(dados, parcial = false) {
        if (!parcial && !dados.nome_contato && !dados.empresa) {
            throw AppError.badRequest('nome_contato ou empresa é obrigatório.');
        }

        if (!parcial && !dados.telefone && !dados.email) {
            throw AppError.badRequest('É necessário informar telefone ou email.');
        }

        if (Object.prototype.hasOwnProperty.call(dados, 'estado') && dados.estado && String(dados.estado).trim().length !== 2) {
            throw AppError.badRequest('estado deve ter 2 caracteres.');
        }

        if (Object.prototype.hasOwnProperty.call(dados, 'cidade') && dados.cidade !== null && String(dados.cidade).trim() === '') {
            throw AppError.badRequest('cidade não pode ser vazia.');
        }
    }

    static async validarCpfCnpjUnico(cpfCnpj, ignorarId = null) {
        if (!cpfCnpj) return;
        const existente = await ClienteModel.buscarPorCpfCnpj(cpfCnpj, ignorarId);
        if (existente) {
            throw AppError.conflict('CPF/CNPJ já cadastrado.');
        }
    }

    static async listarClientes(filtros = {}) {
        const clientes = await ClienteModel.listarClientes(filtros);
        return clientes.map(ClienteService.formatarClienteParaFrontend);
    }

    static async buscarCliente(id) {
        const cliente = await ClienteModel.buscarClientePorId(id);
        if (!cliente) {
            throw AppError.notFound('Cliente não encontrado.');
        }

        const clienteFormatado = ClienteService.formatarClienteParaFrontend(cliente);
        clienteFormatado.pedidosDetalhados = await ClienteModel.listarPedidosDoCliente(id);
        return clienteFormatado;
    }

    static async criarCliente(dados) {
        ClienteService.validarDadosCliente(dados);
        await ClienteService.validarCpfCnpjUnico(dados.cpf_cnpj);
        return await ClienteModel.criarCliente(dados);
    }

    static async atualizarCliente(id, dados) {
        const cliente = await ClienteModel.buscarClientePorId(id);
        if (!cliente) {
            throw AppError.notFound('Cliente não encontrado.');
        }

        ClienteService.validarDadosCliente(dados, true);
        await ClienteService.validarCpfCnpjUnico(dados.cpf_cnpj, id);
        await ClienteModel.atualizarCliente(id, dados);
        return await ClienteService.buscarCliente(id);
    }

    static async converterLead(id) {
        const lead = await ClienteModel.buscarLeadPorId(id);
        if (!lead) {
            throw AppError.notFound('Lead não encontrado.');
        }

        await ClienteModel.converterLeadEmCliente(id);
        return await ClienteService.buscarCliente(id);
    }

    static async arquivarCliente(id) {
        const cliente = await ClienteModel.buscarClientePorId(id);
        if (!cliente) {
            throw AppError.notFound('Cliente não encontrado.');
        }

        await ClienteModel.arquivarCliente(id);
        return { id: Number(id) };
    }
}

module.exports = ClienteService;
