export const PAPEIS_PERMITIDOS = ['administrador', 'arquitetura', 'producao', 'vendedor', 'gerente', 'financeiro', 'logistica'];

export const QUADRO_PADRAO_POR_PAPEL = {
    arquitetura: 'arquitetura',
    producao: 'producao',
    vendedor: 'vendedor',
    gerente: 'gerente',
    financeiro: 'financeiro',
    logistica: 'logistica',
<<<<<<< HEAD
    administrador: 'arquitetura',
=======
    administrador: 'gerente',
>>>>>>> f95ee95a233b645bb4f881cfe14ebc2f4656b1da
};

export const ACESSO_CARDS_DASHBOARD = {
    administrador: ['Vendas', 'Clientes', 'Vendedores', 'Kanban', 'Cadastro de Vendedor'],
    vendedor: ['Clientes', 'Kanban', 'Vendedores'],
    arquitetura: ['Kanban'],
    financeiro: ['Clientes', 'Vendas', 'Kanban'],
    producao: ['Kanban'],
    logistica: ['Kanban'],
    gerente: ['Vendas', 'Vendedores', 'Kanban', 'Cadastro de Vendedor'],
};
