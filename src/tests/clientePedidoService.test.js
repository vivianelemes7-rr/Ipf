const assert = require('assert');

const ClienteService = require('../services/clienteService');
const PedidoService = require('../services/pedidoService');
const { verificarQualquerModulo } = require('../middlewares/autorizacaoMiddleware');

function test(nome, fn) {
    try {
        fn();
        console.log(`PASS ${nome}`);
    } catch (erro) {
        console.error(`FAIL ${nome}`);
        console.error(erro.message);
        process.exitCode = 1;
    }
}

test('ClienteService formata cliente para contrato esperado pelo frontend', () => {
    const cliente = ClienteService.formatarClienteParaFrontend({
        id: 1,
        nome_contato: 'João Silva',
        empresa: 'Empresa Alpha Ltda',
        cpf_cnpj: '00.000.000/0001-00',
        email: 'cliente@email.com',
        telefone: '(11) 99999-9999',
        cidade: 'São Paulo',
        estado: 'SP',
        endereco_completo: 'Rua Exemplo, 123',
        data_cadastro: '2026-05-26T00:00:00.000Z',
        total_pedidos: 12,
        valor_total_comprado: 60000,
        origem: 'Instagram',
        status_lead: 'Qualificado',
        convertido: 1,
        notas: null
    });

    assert.strictEqual(cliente.nome, 'Empresa Alpha Ltda');
    assert.strictEqual(cliente.desde, '2026-05-26');
    assert.strictEqual(cliente.pedidos, 12);
    assert.strictEqual(cliente.valorTotal, 60000);
    assert.strictEqual(cliente.nivel, 'Ouro');
});

test('PedidoService valida tipo de pedido permitido', () => {
    assert.doesNotThrow(() => PedidoService.validarTipoPedido('Normal'));
    assert.doesNotThrow(() => PedidoService.validarTipoPedido('Especial'));
    assert.throws(() => PedidoService.validarTipoPedido('Outro'), /tipo_pedido/);
});

test('PedidoService identifica próxima fase de pedido por tipo', () => {
    assert.strictEqual(PedidoService.definirProximaFase({ tipo_pedido: 'Normal' }), 'Producao');
    assert.strictEqual(PedidoService.definirProximaFase({ tipo_pedido: 'Especial' }), 'Arquitetura');
});

test('autorizacaoMiddleware exporta verificarQualquerModulo', () => {
    assert.strictEqual(typeof verificarQualquerModulo, 'function');
});
