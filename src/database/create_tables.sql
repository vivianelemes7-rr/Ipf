--Leia antes de iniciar!!
--Por favor revise as tabelas antes de criar e ajuste se necessário.
-- Obs: Nas tabelas de notificação, posteriormente deve ser adicionadas notificações quando parado por tanto tempo em uma etapa.
-- Inicialmente faremos somente

-- 1. Criar Tabelas FUNCIONÁRIOS--
-- 1.1. Tabela FUNCIONÁRIOS:
CREATE TABLE funcionarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    cargo ENUM('Vendedor', 'Financeiro', 'Producao', 'Arquitetura', 'Gerente', 'Administrador') NULL,
    departamento VARCHAR(100),
    status_ativo TINYINT(1) DEFAULT 1,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.2. Tabela PERMISSÕES:
CREATE TABLE permissoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    funcionario_id BIGINT UNSIGNED,

    -- Módulos do sistema (Acesso geral)
    modulo_vendas TINYINT(1) DEFAULT 0,
    modulo_financeiro TINYINT(1) DEFAULT 0,
    modulo_producao TINYINT(1) DEFAULT 0,
    modulo_arquitetura TINYINT(1) DEFAULT 0,
    
    -- Operações básicas de CRUD
    pode_editar TINYINT(1) DEFAULT 0,
    pode_deletar TINYINT(1) DEFAULT 0,
    ver_apenas_proprio TINYINT(1) DEFAULT 0,

    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Permissões específicas do Quadro/Cards Kanban
    pode_retroceder_card TINYINT(1) DEFAULT 0,
    pode_mover_qualquer_etapa TINYINT(1) DEFAULT 0,
    pode_reabrir_card TINYINT(1) DEFAULT 0,
    pode_aprovar_entrega_etapa TINYINT(1) DEFAULT 0,
    pode_forcar_transicao TINYINT(1) DEFAULT 0,
    pode_trocar_responsavel TINYINT(1) DEFAULT 0,
    pode_assumir_card TINYINT(1) DEFAULT 0,
    pode_alterar_prazos TINYINT(1) DEFAULT 0,
    pode_alterar_prioridade TINYINT(1) DEFAULT 0,
    pode_ver_valores TINYINT(1) DEFAULT 0,
    pode_arquivar_card TINYINT(1) DEFAULT 0,
    
    -- Permissões de comentários e impedimentos
    pode_deletar_comentarios TINYINT(1) DEFAULT 0,
    pode_editar_comentarios_outros TINYINT(1) DEFAULT 0,
    pode_marcar_impedimento TINYINT(1) DEFAULT 0,
    pode_destravar_impedimento TINYINT(1) DEFAULT 0,

    UNIQUE KEY uq_permissoes_funcionario (funcionario_id),

    -- Vínculo de integridade referencial com funcionarios
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
);

-- 2. Criar Tabelas CRM COMERCIAL--
-- 2.1. Tabela CRM COMERCIAL:
CREATE TABLE crm_comercial (
    id SERIAL PRIMARY KEY,
    lead_id BIGINT UNSIGNED NOT NULL,
    vendedor_id BIGINT UNSIGNED, -- FK para a tabela(Funcionários)
    
    -- Campos do Kanban
    etapa_kanban VARCHAR(50) DEFAULT 'Novo', -- Novo, Primeiro Contato, Proposta, Negociação
    valor_estimado DECIMAL(10, 2),
    prioridade INT DEFAULT 2, -- 1: Alta, 2: Média, 3: Baixa
    previsao_fechamento DATE,
    proposta_url TEXT, -- Link para o PDF da proposta enviada
    
    -- Lógica de Fechamento
    status_final VARCHAR(20) DEFAULT 'Em Aberto', -- Ganho, Perdido, Pausado, Em Aberto
    data_ganho DATETIME NULL,
    motivo_perda TEXT,
    pedido_gerado BOOLEAN DEFAULT FALSE, -- Flag para seu código Node.js criar o Pedido
    numero_pedido VARCHAR(50) UNIQUE, -- Gerado manualmente ou por sistema externo
    
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes_venda TEXT,

    CONSTRAINT fk_vendedor_crm 
        FOREIGN KEY (vendedor_id) 
        REFERENCES funcionarios(id) 
        ON DELETE SET NULL
)ENGINE=InnoDB;

-- 2.2. Tabela LEADS:
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    nome_contato VARCHAR(255) NOT NULL,
    empresa VARCHAR(255),
    cpf_cnpj VARCHAR(20),             -- Adicionado para faturamento futuro
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco_completo TEXT,            -- Adicionado para logística/produção
    cidade VARCHAR(100),
    estado CHAR(2),
    origem VARCHAR(100),               -- Ex: Instagram, Site, Indicação
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_lead VARCHAR(50) DEFAULT 'Novo', -- Novo, Qualificado, Descartado
    convertido BOOLEAN DEFAULT FALSE,  -- Identifica se virou venda/pedido
    notas TEXT
);

ALTER TABLE crm_comercial
ADD CONSTRAINT fk_lead_crm
FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

-- 2.3 Tabela PEDIDOS:
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    crm_id BIGINT UNSIGNED REFERENCES crm_comercial(id), -- Link com a negociação
    lead_id BIGINT UNSIGNED REFERENCES leads(id),         -- Link direto com o cliente
    numero_pedido VARCHAR(50) UNIQUE NOT NULL, -- Ex: "PV-2026-001"

    -- Diferenciação do Pedido
    tipo_pedido ENUM('Normal', 'Especial') DEFAULT 'Normal',
    
    -- Detalhes da Venda
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total_fechado DECIMAL(10, 2),
    descricao_itens_servicos TEXT,           -- O que foi vendido (pode ser JSON também)
    prazo_entrega_acordado INT,              -- Em dias úteis
    
    -- Arquivos
    contrato_url TEXT,                       -- Link do contrato assinado
    projeto_referencia_url TEXT,             -- Link do esboço que o comercial usou
    
    status_pedido ENUM('Em Processamento', 'Arquitetura', 'Producao', 'Finalizado', 'Cancelado') DEFAULT 'Em Processamento'
);

-- 2.4 Tabela NOTIFICAÇÕES COMERCIAL:
CREATE TABLE notificacoes_comercial (
    id SERIAL PRIMARY KEY,
    funcionario_id BIGINT UNSIGNED REFERENCES funcionarios(id) ON DELETE CASCADE, -- Quem recebe
    titulo VARCHAR(150) NOT NULL, -- Ex: "Novo Pedido Gerado" ou "Projeto Aprovado"
    mensagem TEXT NOT NULL,       -- Ex: "O Pedido PV-2026-001 de Alini Xavier foi liberado para Produção."
    
    -- Campos de Rastreabilidade (Links)
    tipo_modulo VARCHAR(50),      -- 'Vendas', 'Pedidos', 'Arquitetura', 'Financeiro', 'Producao'
    item_id INT,                  -- ID do registro nas tabelas específicas (ex: ID do Pedido)
    prioridade_alerta VARCHAR(20) DEFAULT 'Normal', -- 'Urgente' (pode aparecer em dourado!) ou 'Normal'
    
    lida BOOLEAN DEFAULT FALSE,   
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Criar Tabelas Arquitetura--
-- 3.1 Tabela ARQUITETURA:
CREATE TABLE kanban_arquitetura (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT UNSIGNED,
    arquiteto_id BIGINT UNSIGNED,
    etapa_kanban VARCHAR(50) DEFAULT 'Aguardando',
    requer_matriz_externa TINYINT(1) DEFAULT 0,
    desenho_enviado_externo TINYINT(1) DEFAULT 0,
    data_envio_externo TIMESTAMP NULL,
    previsao_retorno_externo DATE,
    matriz_recebida_check TINYINT(1) DEFAULT 0,
    link_projeto_drive TEXT,
    data_entrega_prevista DATE,
    prioridade INT DEFAULT 2,
    ultima_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (arquiteto_id) REFERENCES funcionarios(id) ON DELETE SET NULL
);

-- 3.2 Tabela NOTIFICAÇÕES ARQUITETURA:
CREATE TABLE notificacoes_arquitetura (
    id INT AUTO_INCREMENT PRIMARY KEY,
    funcionario_id BIGINT UNSIGNED,
    titulo VARCHAR(150) NOT NULL, 
    mensagem TEXT NOT NULL,       
    tipo_notificacao ENUM('Novo Projeto', 'Envio Externo', 'Retorno Matriz'),
    pedido_id BIGINT UNSIGNED,
    lida TINYINT(1) DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);


-- 4. Criar Tabelas Financeiro--
-- 4.1 Tabela FINANCEIRO:
CREATE TABLE kanban_financeiro (
    id SERIAL PRIMARY KEY,
    pedido_id BIGINT UNSIGNED REFERENCES pedidos(id) ON DELETE CASCADE,
    responsavel_fin_id BIGINT UNSIGNED REFERENCES funcionarios(id),
    
    -- Controle de Fluxo
    etapa_kanban VARCHAR(50) DEFAULT 'Entrada', -- Entrada, Parcelas, Quitado
    valor_total_pedido DECIMAL(10, 2),          
    status_pagamento VARCHAR(50) DEFAULT 'Pendente',
    
    -- Controle de Matriz Externa
    custo_matriz_externa DECIMAL(10, 2) DEFAULT 0.00,
    matriz_externa_paga BOOLEAN DEFAULT FALSE,
    
    -- O GATILHO DE COMUNICAÇÃO
    liberado_para_producao BOOLEAN DEFAULT FALSE, 
    
    data_vencimento_proxima DATE,
    observacoes_financeiras TEXT,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4.2 Tabela NOTIFICAÇÕES FINANCEIRO:
CREATE TABLE notificacoes_financeiro (
    id SERIAL PRIMARY KEY,
    funcionario_id BIGINT UNSIGNED REFERENCES funcionarios(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL, -- Ex: "Pagamento Matriz Pendente"
    mensagem TEXT NOT NULL,       
    
    pedido_id BIGINT UNSIGNED REFERENCES pedidos(id),
    tipo_alerta VARCHAR(50),      -- 'Cobrança', 'Novo Pedido', 'Alerta Matriz'
    prioridade_alerta VARCHAR(20) DEFAULT 'Normal',
    
    lida BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Criar Tabelas Produção--
-- 5.1 Tabela PRODUÇÃO:
CREATE TABLE kanban_producao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id BIGINT UNSIGNED,
    arquitetura_id INT,
    financeiro_id BIGINT UNSIGNED,
    etapa_kanban ENUM('Aguardando Liberacao', 'Aguardando Matriz', 'Fila de Corte', 'Fabricacao', 'Acabamento', 'Expedicao', 'Finalizado', 'Cancelado') DEFAULT 'Aguardando Liberacao',
    tipo_producao ENUM('Normal', 'Especial') DEFAULT 'Normal',
    matriz_pronta_interna TINYINT(1) DEFAULT 0,
    matriz_chegou_externa TINYINT(1) DEFAULT 0,
    responsavel_producao_id BIGINT UNSIGNED,
    data_inicio_real TIMESTAMP NULL,
    previsao_entrega_final DATE,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
ALTER TABLE kanban_producao ADD CONSTRAINT fk_producao_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE;
ALTER TABLE kanban_producao ADD CONSTRAINT fk_producao_responsavel FOREIGN KEY (responsavel_producao_id) REFERENCES funcionarios(id) ON DELETE SET NULL;
ALTER TABLE kanban_producao ADD CONSTRAINT fk_producao_arquitetura FOREIGN KEY (arquitetura_id) REFERENCES kanban_arquitetura(id);


-- 5.2 Tabela NOTIFICAÇÕES PRODUÇÃO:
CREATE TABLE notificacoes_producao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    funcionario_id BIGINT UNSIGNED,
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,       
    pedido_id BIGINT UNSIGNED,
    prioridade_alerta ENUM('Normal', 'Urgente') DEFAULT 'Normal',
    lida TINYINT(1) DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notificacoes_producao
ADD CONSTRAINT fk_notif_prod_funcionario
FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE;

ALTER TABLE notificacoes_producao
ADD CONSTRAINT fk_notif_prod_pedido
FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE;


-- Se der tempo, verificar a criação de uma tabela de Leads Arquivados que se conectará com convertido na tabela de Lead.
