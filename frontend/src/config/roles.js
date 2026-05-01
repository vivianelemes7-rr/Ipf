export const PAPEIS_PERMITIDOS = ['administrador', 'arquitetura', 'producao', 'vendedor', 'gerente', 'financeiro'];

export const QUADRO_PADRAO_POR_PAPEL = {
    arquitetura: 'arquitetura',
    producao: 'producao',
    vendedor: 'vendedor',
    gerente: 'gerente',
    financeiro: 'financeiro',
    administrador: 'arquitetura',
};

export const ACESSO_CARDS_DASHBOARD = {
    administrador: ['Vendas', 'Clientes', 'Vendedores', 'Kanban', 'Cadastro de Vendedor'],
    vendedor: ['Clientes', 'Kanban', 'Vendedores'],
    arquitetura: ['Kanban'],
    financeiro: ['Clientes', 'Vendas', 'Kanban'],
    producao: ['Kanban'],
    gerente: ['Vendas', 'Vendedores', 'Kanban', 'Cadastro de Vendedor'],
};
