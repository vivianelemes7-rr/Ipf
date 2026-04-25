--Leia antes de iniciar!!
--Por favor revise as tabelas antes de criar e ajuste se necessário.
-- Obs: Nas tabelas de notificação, posteriormente deve ser adicionadas notificações quando parado por tanto tempo em uma etapa.
-- Inicialmente faremos somente

-- 1. Criar Tabelas FUNCIONÁRIOS--
-- 1.1. Tabela FUNCIONÁRIOS:
CREATE TABLE funcionarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL, -- Hash da senha
    cargo VARCHAR(100),          -- Ex: Vendedor, Arquiteto, Gestor
    departamento VARCHAR(100),   -- Ex: Comercial, Técnico, Financeiro
    status_ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.2. Tabela PERMISSÕES:
CREATE TABLE permissoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    funcionario_id BIGINT UNSIGNED,
    
    -- Missões por Módulo
    modulo_vendas BOOLEAN DEFAULT FALSE,
    modulo_financeiro BOOLEAN DEFAULT FALSE,
    modulo_producao BOOLEAN DEFAULT FALSE,
    modulo_arquitetura BOOLEAN DEFAULT FALSE,
    
    -- Níveis de Poder (Exemplos de controle fino)
    pode_editar BOOLEAN DEFAULT TRUE,   -- Pode mover cards?
    pode_deletar BOOLEAN DEFAULT FALSE, -- Pode excluir leads/projetos?
    ver_apenas_proprio BOOLEAN DEFAULT TRUE, -- Se TRUE, vendedor só vê seus próprios leads
    
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_funcionario_permissoes 
        FOREIGN KEY (funcionario_id) 
        REFERENCES funcionarios(id) 
        ON DELETE CASCADE
);

-- 2. Criar Tabelas CRM COMERCIAL--
-- 2.1. Tabela CRM COMERCIAL:
CREATE TABLE crm_comercial (
    id SERIAL PRIMARY KEY,
    lead_id INT NOT NULL,
    vendedor_id BIGINT UNSIGNED, -- FK para a tabela do Ricardo (Funcionários)
    
    -- Campos do Kanban
    etapa_kanban VARCHAR(50) DEFAULT 'Novo', -- Novo, Primeiro Contato, Proposta, Negociação
    valor_estimado DECIMAL(10, 2),
    prioridade INT DEFAULT 2, -- 1: Alta, 2: Média, 3: Baixa
    previsao_fechamento DATE,
    proposta_url TEXT, -- Link para o PDF da proposta enviada
    
    -- Lógica de Fechamento
    status_final VARCHAR(20) DEFAULT 'Em Aberto', -- Ganho, Perdido, Pausado, Em Aberto
    data_ganho TIMESTAMP NULL,
    motivo_perda TEXT,
    pedido_gerado BOOLEAN DEFAULT FALSE, -- Flag para seu código Node.js criar o Pedido
    numero_pedido VARCHAR(50) UNIQUE AFTER pedido_gerado, -- Gerado manualmente ou por sistema externo
    
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    observacoes_venda TEXT

    -- Definição das Chaves Estrangeiras (Constraints)
    CONSTRAINT fk_lead_crm 
        FOREIGN KEY (lead_id) 
        REFERENCES leads(id) 
        ON DELETE CASCADE,

    CONSTRAINT fk_vendedor_crm 
        FOREIGN KEY (vendedor_id) 
        REFERENCES funcionarios(id) 
        ON DELETE SET NULL
);

-- 2.2. Tabela LEADS:
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    nome_contato VARCHAR(255) NOT NULL,
    empresa VARCHAR(255),
    cpf_cnpj VARCHAR(20),             -- Adicionado para faturamento futuro
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco_completo TEXT,            -- Adicionado para logística/produção
    origem VARCHAR(100),               -- Ex: Instagram, Site, Indicação
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_lead VARCHAR(50) DEFAULT 'Novo', -- Novo, Qualificado, Descartado
    convertido BOOLEAN DEFAULT FALSE,  -- Identifica se virou venda/pedido
    notas TEXT
);

-- 2.3 Tabela PEDIDOS:
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    crm_id INT REFERENCES crm_comercial(id), -- Link com a negociação
    lead_id INT REFERENCES leads(id),         -- Link direto com o cliente
    numero_pedido VARCHAR(50) UNIQUE,        -- Ex: "PV-2026-001"

    -- Diferenciação do Pedido
    tipo_pedido VARCHAR(20) DEFAULT 'Normal', -- 'Normal' ou 'Especial (Matriz)'
    
    -- Detalhes da Venda
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total_fechado DECIMAL(10, 2),
    descricao_itens_servicos TEXT,           -- O que foi vendido (pode ser JSON também)
    prazo_entrega_acordado INT,              -- Em dias úteis
    
    -- Arquivos
    contrato_url TEXT,                       -- Link do contrato assinado
    projeto_referencia_url TEXT,             -- Link do esboço que o comercial usou
    
    status_pedido VARCHAR(50) DEFAULT 'Em Processamento' -- Em Processamento, Produção, Finalizado, Cancelado
);

-- 2.4 Tabela NOTIFICAÇÕES COMERCIAL:
CREATE TABLE notificacoes_comercial (
    id SERIAL PRIMARY KEY,
    funcionario_id INT REFERENCES funcionarios(id) ON DELETE CASCADE, -- Quem recebe
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
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    arquiteto_id INT REFERENCES funcionarios(id),
    
    -- Status do Kanban
    etapa_kanban VARCHAR(50) DEFAULT 'Briefing', -- Briefing, Medição, Layout, Executivo, Detalhamento
    
    -- Controle de Matriz Externa (Fluxo Especial)
    requer_matriz_externa BOOLEAN DEFAULT FALSE, -- Puxado automaticamente do 'tipo_pedido'
    desenho_enviado_externo BOOLEAN DEFAULT FALSE, 
    data_envio_externo TIMESTAMP,
    previsao_retorno_externo DATE,
    matriz_recebida_check BOOLEAN DEFAULT FALSE, -- Gatilho para liberar a Produção
    
    link_projeto_drive TEXT,
    data_entrega_prevista DATE,
    prioridade INT DEFAULT 2,
    
    ultima_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3.2 Tabela NOTIFICAÇÕES ARQUITETURA:
CREATE TABLE notificacoes_arquitetura (
    id SERIAL PRIMARY KEY,
    funcionario_id INT REFERENCES funcionarios(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL, 
    mensagem TEXT NOT NULL,       
    
    -- Novos tipos de aviso para o fluxo especial
    tipo_notificacao VARCHAR(50), -- 'Novo Projeto', 'Envio Externo', 'Retorno Matriz'
    pedido_id INT REFERENCES pedidos(id),
    
    lida BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 4. Criar Tabelas Financeiro--
-- 4.1 Tabela FINANCEIRO:
CREATE TABLE kanban_financeiro (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    responsavel_fin_id INT REFERENCES funcionarios(id),
    
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
    funcionario_id INT REFERENCES funcionarios(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL, -- Ex: "Pagamento Matriz Pendente"
    mensagem TEXT NOT NULL,       
    
    pedido_id INT REFERENCES pedidos(id),
    tipo_alerta VARCHAR(50),      -- 'Cobrança', 'Novo Pedido', 'Alerta Matriz'
    prioridade_alerta VARCHAR(20) DEFAULT 'Normal',
    
    lida BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Criar Tabelas Produção--
-- 5.1 Tabela PRODUÇÃO:
CREATE TABLE kanban_producao (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    arquitetura_id INT REFERENCES kanban_arquitetura(id),
    financeiro_id INT REFERENCES kanban_financeiro(id),
    
    -- O fluxo do seu Kanban de Produção
    etapa_kanban VARCHAR(50) DEFAULT 'Aguardando Liberação', 
    -- Etapas: Aguardando Matriz, Fila de Corte, Fabricação, Acabamento, Expedição
    
    -- Campos de Controle de Matriz (Conforme sua correção)
    tipo_producao VARCHAR(20),       -- 'Normal' ou 'Especial (Matriz)'
    matriz_pronta_interna BOOLEAN DEFAULT FALSE, 
    matriz_chegou_externa BOOLEAN DEFAULT FALSE, -- Atualizado via Arquitetura
    
    responsavel_producao_id INT REFERENCES funcionarios(id),
    data_inicio_real TIMESTAMP,
    previsao_entrega_final DATE,
    
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5.2 Tabela NOTIFICAÇÕES PRODUÇÃO:
CREATE TABLE notificacoes_producao (
    id SERIAL PRIMARY KEY,
    funcionario_id INT REFERENCES funcionarios(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL, -- Ex: "Matriz Externa Disponível"
    mensagem TEXT NOT NULL,       
    
    pedido_id INT REFERENCES pedidos(id),
    prioridade_alerta VARCHAR(20) DEFAULT 'Normal', -- 'Urgente' em dourado para atrasos
    
    lida BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


Se der tempo, verificar a criação de uma tabela de Leads Arquivados que se conectará com  convertido com a tabela de Lead  BOOLEAN DEFAULT FALSE,  -- Identifica se virou venda/pedido