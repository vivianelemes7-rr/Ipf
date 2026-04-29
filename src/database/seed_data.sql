--Leia antes de iniciar!!
--Após suas tabelas estarem funcionado, crie dados para teste.

-- 1. Criar Dados Tabelas FUNCIONÁRIOS--
-- 1.1. Dados Tabela FUNCIONÁRIOS:
INSERT INTO funcionarios (nome, email, senha, cargo, departamento) VALUES
('Bruno Silva', 'bruno@empresaficticia.com.br', 'hash_senha_1', 'Consultor Comercial', 'Vendas'),
('Carla Souza', 'carla@empresaficticia.com.br', 'hash_senha_2', 'Arquiteta Pleno', 'Projetos'),
('Daniel Oliveira', 'daniel@empresaficticia.com.br', 'hash_senha_3', 'Analista Financeiro', 'Financeiro'),
('Eduardo Santos', 'eduardo@empresaficticia.com.br', 'hash_senha_4', 'Supervisor de Fábrica', 'Produção');

-- 1.2. Dados Tabela PERMISSÕES:
INSERT INTO permissoes (funcionario_id, modulo_vendas, modulo_financeiro, modulo_producao, modulo_arquitetura, pode_deletar, ver_apenas_proprio) VALUES
(1, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE),  -- Bruno: Só vendas (o dele)
(2, FALSE, FALSE, FALSE, TRUE, FALSE, FALSE), -- Carla: Só arquitetura
(3, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE),  -- Daniel: Só financeiro
(4, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE); -- Eduardo: Só produção


-- 2. Criar Dados Tabelas CRM COMERCIAL--
-- 2.1. Dados Tabela CRM COMERCIAL:
INSERT INTO crm_comercial (lead_id, vendedor_id, etapa_kanban, valor_estimado, status_final, pedido_gerado, data_ganho, numero_pedido, data_movimentacao ) VALUES
(1, 1, 'Negociação', 15500.00, 'Ganho', TRUE, CURRENT_TIMESTAMP, 'PV-2026-0001', CURRENT_TIMESTAMP),
(2, 1, 'Proposta', 8200.00, 'Em Aberto', FALSE, NULL, NULL, CURRENT_TIMESTAMP);

-- Envelhecer um lead no crm_comercial para testar notificações de alerta:
UPDATE crm_comercial 
SET data_movimentacao = DATE_SUB(NOW(), INTERVAL 5 DAY), status_final = 'Em Aberto'
WHERE id = 1;

-- 2.2. Dados Tabela LEADS:
INSERT INTO leads (nome_contato, empresa, cpf_cnpj, telefone, email, endereco_completo, origem, status_lead, convertido) VALUES
('Marcos Rocha', 'Rocha Alimentos', '12.345.678/0001-99', '(54) 99999-1111', 'contato@rocha.com', 'Rua das Indústrias, 100, Caxias do Sul - RS', 'Site', 'Qualificado', TRUE),
('Fernanda Lima', 'Studio Design', '987.654.321-00', '(54) 98888-2222', 'fernanda@design.com', 'Av. Central, 500, Bento Gonçalves - RS', 'Instagram', 'Novo', FALSE);

-- 2.3 Dados Tabela PEDIDOS:
INSERT INTO pedidos (crm_id, lead_id, numero_pedido, tipo_pedido, valor_total_fechado, descricao_itens_servicos, prazo_entrega_acordado, status_pedido) VALUES
(1, 1, 'PV-2026-0001', 'Especial (Matriz)', 15500.00, 'Fabricação de painéis sob medida com matriz personalizada em aço.', 30, 'Em Processamento');

-- 2.4 Dados Tabela NOTIFICAÇÕES:
INSERT INTO notificacoes_comercial (funcionario_id, titulo, mensagem, tipo_modulo, item_id) VALUES
(1, 'Pedido Gerado', 'O pedido PV-2026-0001 para Rocha Alimentos foi criado com sucesso.', 'Pedidos', 1);

-- 3. Criar Dados Tabelas Arquitetura--
-- 3.1 Dados Tabela Arquitetura:
INSERT INTO kanban_arquitetura (pedido_id, arquiteto_id, etapa_kanban, requer_matriz_externa, desenho_enviado_externo, data_envio_externo, previsao_retorno_externo, link_projeto_drive) VALUES
(1, 2, 'Detalhamento', TRUE, TRUE, CURRENT_TIMESTAMP, '2026-05-10', 'https://drive.google.com/drive/folders/projeto_rocha_001');

-- 3.2 Dados Tabela Notificação Arquitetura:
INSERT INTO notificacoes_arquitetura (funcionario_id, titulo, mensagem, tipo_notificacao, pedido_id) VALUES
(2, 'Novo Projeto Especial', 'O pedido PV-2026-0001 requer fabricação de matriz externa. Desenho enviado para fornecedor.', 'Envio Externo', 1);

-- 4. Criar Dados Criar Tabelas Financeiro--
-- 4.1 Dados Criar Tabela Financeiro:
INSERT INTO kanban_financeiro (pedido_id, responsavel_fin_id, etapa_kanban, valor_total_pedido, status_pagamento, custo_matriz_externa, liberado_para_producao) VALUES
(1, 3, 'Entrada', 15500.00, 'Aguardando Pagamento', 2100.00, FALSE);

-- 4.2 Dados Criar Tabela Notificações Financeiro:
INSERT INTO notificacoes_financeiro (funcionario_id, titulo, mensagem, pedido_id) VALUES
(3, 'Aprovação de Custos', 'Pedido Especial PV-2026-0001 possui custo de R$ 2.100,00 de matriz externa.', 1);

-- 5. Criar Dados Criar Tabelas Produção--
-- 5.1 Dados Tabela Produção:
INSERT INTO kanban_producao (pedido_id, arquitetura_id, financeiro_id, etapa_kanban, tipo_producao, matriz_chegou_externa, responsavel_producao_id) VALUES
(1, 1, 1, 'Aguardando Liberação', 'Especial (Matriz)', FALSE, 4);

-- 5.2 Dados Tabela Notificações Produção:
INSERT INTO notificacoes_producao (funcionario_id, titulo, mensagem, pedido_id, prioridade_alerta) VALUES
(4, 'Alerta de Fluxo', 'Pedido PV-2026-0001 (Especial) aguardando retorno de matriz e liberação financeira.', 1, 'Urgente');