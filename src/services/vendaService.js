const VendaModel = require('../models/vendaModel');
const LeadModel = require('../models/leadModel');

const VendaService = {
    converterLeadParaVenda: async (leadId, detalhesTecnicos) => {
        const lead = await LeadModel.buscarPorId(leadId);
        
        if (!lead) {
            throw new Error('Lead não encontrado para conversão');
        }

        const novaVenda = await VendaModel.criarDaLead(leadId, detalhesTecnicos);
        
        return {
            sucesso: true,
            vendaId: novaVenda.insertId,
            mensagem: "Lead convertido em Ordem de Serviço para Arquitetura"
        };
    }
};

module.exports = VendaService;

