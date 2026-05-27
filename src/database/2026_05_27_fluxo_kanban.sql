-- Migração do DDL atual em src/database/ddl_atual.sql para o esquema exigido pelo app.
-- Execute conectado ao banco correto. Se necessario: USE `defaultdb`;
-- Script idempotente: pode ser executado novamente sem recriar colunas/tabelas ja existentes.

SET @OLD_SQL_SAFE_UPDATES = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

DROP PROCEDURE IF EXISTS ipf_add_column_if_missing;
DROP PROCEDURE IF EXISTS ipf_modify_column_if_exists;
DROP PROCEDURE IF EXISTS ipf_add_index_if_missing;

DELIMITER $$

CREATE PROCEDURE ipf_add_column_if_missing(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_column_definition TEXT,
    IN p_after_column VARCHAR(64)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table_name
          AND COLUMN_NAME = p_column_name
    ) THEN
        SET @sql_add_column = CONCAT(
            'ALTER TABLE `', p_table_name, '` ADD COLUMN `', p_column_name, '` ', p_column_definition,
            IF(p_after_column IS NULL OR p_after_column = '', '', CONCAT(' AFTER `', p_after_column, '`'))
        );
        PREPARE stmt_add_column FROM @sql_add_column;
        EXECUTE stmt_add_column;
        DEALLOCATE PREPARE stmt_add_column;
    END IF;
END$$

CREATE PROCEDURE ipf_modify_column_if_exists(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_column_definition TEXT
)
BEGIN
    IF EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table_name
          AND COLUMN_NAME = p_column_name
    ) THEN
        SET @sql_modify_column = CONCAT(
            'ALTER TABLE `', p_table_name, '` MODIFY COLUMN `', p_column_name, '` ', p_column_definition
        );
        PREPARE stmt_modify_column FROM @sql_modify_column;
        EXECUTE stmt_modify_column;
        DEALLOCATE PREPARE stmt_modify_column;
    END IF;
END$$

CREATE PROCEDURE ipf_add_index_if_missing(
    IN p_table_name VARCHAR(64),
    IN p_index_name VARCHAR(64),
    IN p_index_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table_name
          AND INDEX_NAME = p_index_name
    ) THEN
        SET @sql_add_index = CONCAT('ALTER TABLE `', p_table_name, '` ADD INDEX `', p_index_name, '` ', p_index_definition);
        PREPARE stmt_add_index FROM @sql_add_index;
        EXECUTE stmt_add_index;
        DEALLOCATE PREPARE stmt_add_index;
    END IF;
END$$

DELIMITER ;

-- 1. CRM comercial: campos usados pelo Kanban comercial e SLA de 7 dias.
CALL ipf_add_column_if_missing('crm_comercial', 'data_primeiro_contato', 'DATETIME NULL', 'data_movimentacao');
CALL ipf_add_column_if_missing('crm_comercial', 'data_envio_proposta', 'DATETIME NULL', 'data_primeiro_contato');
CALL ipf_add_column_if_missing('crm_comercial', 'data_entrada_etapa', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP', 'data_envio_proposta');

CALL ipf_modify_column_if_exists('crm_comercial', 'etapa_kanban', 'VARCHAR(50) DEFAULT ''Lead''');

UPDATE crm_comercial
SET etapa_kanban = CASE etapa_kanban
    WHEN 'Novo' THEN 'Lead'
    WHEN 'Triagem' THEN 'Lead'
    WHEN 'Primeiro Contato' THEN 'Contato'
    WHEN 'Proposta' THEN 'Orcamento'
    WHEN 'Orçamento' THEN 'Orcamento'
    WHEN 'Negociação' THEN 'Fechamento'
    WHEN 'Negociacao' THEN 'Fechamento'
    WHEN 'Finalizado' THEN 'Pedido'
    ELSE etapa_kanban
END,
data_entrada_etapa = COALESCE(data_entrada_etapa, data_movimentacao, CURRENT_TIMESTAMP),
data_primeiro_contato = CASE
    WHEN etapa_kanban IN ('Contato', 'Primeiro Contato') THEN COALESCE(data_primeiro_contato, data_movimentacao, CURRENT_TIMESTAMP)
    ELSE data_primeiro_contato
END,
data_envio_proposta = CASE
    WHEN etapa_kanban IN ('Orcamento', 'Orçamento', 'Proposta') THEN COALESCE(data_envio_proposta, data_movimentacao, CURRENT_TIMESTAMP)
    ELSE data_envio_proposta
END;

CALL ipf_add_index_if_missing('crm_comercial', 'idx_crm_etapa_sla', '(`etapa_kanban`, `status_final`, `data_entrada_etapa`)');
CALL ipf_add_index_if_missing('crm_comercial', 'idx_crm_vendedor', '(`vendedor_id`)');

-- 2. Pedidos: status Arquitetura e status usados no fluxo ponta a ponta.
CALL ipf_modify_column_if_exists(
    'pedidos',
    'status_pedido',
    'ENUM(''Em Processamento'', ''Arquitetura'', ''Producao'', ''Finalizado'', ''Cancelado'') DEFAULT ''Em Processamento'''
);
CALL ipf_modify_column_if_exists('pedidos', 'numero_pedido', 'VARCHAR(50) NULL');

-- 3. Arquitetura: etapa como texto para aceitar o Kanban novo e manter os valores antigos.
CALL ipf_modify_column_if_exists('kanban_arquitetura', 'etapa_kanban', 'VARCHAR(50) DEFAULT ''Aguardando''');

UPDATE kanban_arquitetura
SET etapa_kanban = CASE etapa_kanban
    WHEN 'Briefing' THEN 'Aguardando'
    WHEN 'Medicao' THEN 'Em Desenho'
    WHEN 'Layout' THEN 'Em Desenho'
    WHEN 'Executivo' THEN 'Producao Matriz'
    WHEN 'Detalhamento' THEN 'Producao Matriz'
    ELSE etapa_kanban
END;

-- 4. Financeiro: alinhar tipos com funcionarios e produção, sem adicionar FK para nao falhar com dados legados.
CALL ipf_modify_column_if_exists('kanban_financeiro', 'responsavel_fin_id', 'BIGINT UNSIGNED NULL');
CALL ipf_add_index_if_missing('kanban_financeiro', 'idx_fin_pedido', '(`pedido_id`)');
CALL ipf_add_index_if_missing('kanban_financeiro', 'idx_fin_responsavel', '(`responsavel_fin_id`)');

-- 5. Produção: etapas finais e cancelamento usados pelo app.
CALL ipf_modify_column_if_exists('kanban_producao', 'etapa_kanban', 'VARCHAR(50) DEFAULT ''Aguardando Liberacao''');
CALL ipf_modify_column_if_exists('kanban_producao', 'tipo_producao', 'VARCHAR(50) DEFAULT ''Normal''');
CALL ipf_modify_column_if_exists('kanban_producao', 'financeiro_id', 'BIGINT UNSIGNED NULL');

UPDATE kanban_producao
SET etapa_kanban = CASE etapa_kanban
    WHEN 'Aguardando Liberação' THEN 'Aguardando Liberacao'
    WHEN 'Fabricação' THEN 'Fabricacao'
    WHEN 'Expedição' THEN 'Expedicao'
    ELSE etapa_kanban
END,
tipo_producao = CASE tipo_producao
    WHEN 'Especial (Matriz)' THEN 'Especial'
    ELSE tipo_producao
END;

CALL ipf_modify_column_if_exists(
    'kanban_producao',
    'etapa_kanban',
    'ENUM(''Aguardando Liberacao'', ''Aguardando Matriz'', ''Fila de Corte'', ''Fabricacao'', ''Acabamento'', ''Expedicao'', ''Finalizado'', ''Cancelado'') DEFAULT ''Aguardando Liberacao'''
);
CALL ipf_modify_column_if_exists('kanban_producao', 'tipo_producao', 'ENUM(''Normal'', ''Especial'') DEFAULT ''Normal''');
CALL ipf_add_index_if_missing('kanban_producao', 'idx_prod_financeiro', '(`financeiro_id`)');
CALL ipf_add_index_if_missing('kanban_producao', 'idx_prod_etapa', '(`etapa_kanban`)');

-- 6. Notificações de arquitetura: colunas usadas pelo model atual, mantendo as antigas.
CALL ipf_add_column_if_missing('notificacoes_arquitetura', 'tipo_modulo', 'VARCHAR(50) NULL', 'mensagem');
CALL ipf_add_column_if_missing('notificacoes_arquitetura', 'item_id', 'INT NULL', 'tipo_modulo');
CALL ipf_add_column_if_missing('notificacoes_arquitetura', 'prioridade_alerta', 'VARCHAR(20) DEFAULT ''Normal''', 'item_id');
CALL ipf_add_column_if_missing('notificacoes_arquitetura', 'data_cobranca_matriz', 'DATETIME NULL', 'data_criacao');

UPDATE notificacoes_arquitetura
SET tipo_modulo = COALESCE(tipo_modulo, 'Arquitetura'),
    item_id = COALESCE(item_id, pedido_id),
    prioridade_alerta = COALESCE(prioridade_alerta, 'Normal')
WHERE tipo_modulo IS NULL OR item_id IS NULL OR prioridade_alerta IS NULL;

CALL ipf_add_index_if_missing('notificacoes_arquitetura', 'idx_notif_arq_item', '(`item_id`)');
CALL ipf_add_index_if_missing('notificacoes_arquitetura', 'idx_notif_arq_func_lida', '(`funcionario_id`, `lida`)');

-- 7. Notificações existentes: alinhar tipos mais usados pelo app e adicionar índices.
CALL ipf_modify_column_if_exists('notificacoes_comercial', 'funcionario_id', 'BIGINT UNSIGNED NULL');
CALL ipf_modify_column_if_exists('notificacoes_financeiro', 'funcionario_id', 'BIGINT UNSIGNED NULL');
CALL ipf_add_index_if_missing('notificacoes_comercial', 'idx_notif_com_func_lida', '(`funcionario_id`, `lida`)');
CALL ipf_add_index_if_missing('notificacoes_comercial', 'idx_notif_com_item', '(`tipo_modulo`, `item_id`)');
CALL ipf_add_index_if_missing('notificacoes_financeiro', 'idx_notif_fin_func_lida', '(`funcionario_id`, `lida`)');
CALL ipf_add_index_if_missing('notificacoes_financeiro', 'idx_notif_fin_pedido', '(`pedido_id`)');
CALL ipf_add_index_if_missing('notificacoes_producao', 'idx_notif_prod_func_lida', '(`funcionario_id`, `lida`)');

-- 8. Notificações gerenciais: nova API /notificacoes-gerencia.
CREATE TABLE IF NOT EXISTS notificacoes_gerencia (
    id INT NOT NULL AUTO_INCREMENT,
    funcionario_id BIGINT UNSIGNED DEFAULT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    pedido_id INT DEFAULT NULL,
    setor VARCHAR(50) DEFAULT NULL,
    tipo_alerta VARCHAR(50) DEFAULT NULL,
    prioridade_alerta ENUM('Normal', 'Urgente') DEFAULT 'Normal',
    lida TINYINT(1) DEFAULT 0,
    data_criacao TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notif_ger_func_lida (funcionario_id, lida),
    KEY idx_notif_ger_pedido (pedido_id),
    CONSTRAINT fk_notif_ger_funcionario FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_ger_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- Se a tabela ja existia sem todos os campos, completar o contrato.
CALL ipf_add_column_if_missing('notificacoes_gerencia', 'funcionario_id', 'BIGINT UNSIGNED NULL', 'id');
CALL ipf_add_column_if_missing('notificacoes_gerencia', 'titulo', 'VARCHAR(150) NOT NULL', 'funcionario_id');
CALL ipf_add_column_if_missing('notificacoes_gerencia', 'mensagem', 'TEXT NOT NULL', 'titulo');
CALL ipf_add_column_if_missing('notificacoes_gerencia', 'pedido_id', 'INT NULL', 'mensagem');
CALL ipf_add_column_if_missing('notificacoes_gerencia', 'setor', 'VARCHAR(50) NULL', 'pedido_id');
CALL ipf_add_column_if_missing('notificacoes_gerencia', 'tipo_alerta', 'VARCHAR(50) NULL', 'setor');
CALL ipf_add_column_if_missing('notificacoes_gerencia', 'prioridade_alerta', 'ENUM(''Normal'', ''Urgente'') DEFAULT ''Normal''', 'tipo_alerta');
CALL ipf_add_column_if_missing('notificacoes_gerencia', 'lida', 'TINYINT(1) DEFAULT 0', 'prioridade_alerta');
CALL ipf_add_column_if_missing('notificacoes_gerencia', 'data_criacao', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP', 'lida');
CALL ipf_modify_column_if_exists('notificacoes_gerencia', 'funcionario_id', 'BIGINT UNSIGNED NULL');
CALL ipf_modify_column_if_exists('notificacoes_gerencia', 'pedido_id', 'INT NULL');
CALL ipf_add_index_if_missing('notificacoes_gerencia', 'idx_notif_ger_func_lida', '(`funcionario_id`, `lida`)');
CALL ipf_add_index_if_missing('notificacoes_gerencia', 'idx_notif_ger_pedido', '(`pedido_id`)');

-- 9. Kanban Gerencia: cards proprios e resumos de gestao.
CREATE TABLE IF NOT EXISTS kanban_gerencia (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    etapa_kanban ENUM('Pendente', 'Em Andamento', 'Revisao', 'Aprovado') DEFAULT 'Pendente',
    titulo VARCHAR(255) NOT NULL,
    detalhes_json JSON DEFAULT NULL,
    observacoes_gerenciais TEXT,
    setor_origem ENUM('Vendas', 'Arquitetura', 'Financeiro', 'Producao', 'Gerencia') DEFAULT 'Gerencia',
    tipo_card ENUM('Resumo Setor', 'Decisao', 'Aprovacao', 'Prioridade', 'Tarefa Interna') DEFAULT 'Tarefa Interna',
    prioridade ENUM('Baixa', 'Media', 'Alta', 'Urgente') DEFAULT 'Media',
    responsavel_gerencia_id BIGINT UNSIGNED DEFAULT NULL,
    criado_por_id BIGINT UNSIGNED DEFAULT NULL,
    atualizado_por_id BIGINT UNSIGNED DEFAULT NULL,
    criado_por_perfil VARCHAR(50) DEFAULT NULL,
    atualizado_por_perfil VARCHAR(50) DEFAULT NULL,
    data_criacao TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_atualizacao TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_kanban_gerencia_etapa (etapa_kanban),
    KEY idx_kanban_gerencia_setor (setor_origem),
    KEY idx_kanban_gerencia_tipo (tipo_card),
    KEY idx_kanban_gerencia_prioridade (prioridade),
    KEY idx_kanban_gerencia_responsavel (responsavel_gerencia_id),
    KEY idx_kanban_gerencia_atualizacao (ultima_atualizacao),
    CONSTRAINT fk_kanban_gerencia_responsavel FOREIGN KEY (responsavel_gerencia_id) REFERENCES funcionarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_kanban_gerencia_criado_por FOREIGN KEY (criado_por_id) REFERENCES funcionarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_kanban_gerencia_atualizado_por FOREIGN KEY (atualizado_por_id) REFERENCES funcionarios(id) ON DELETE SET NULL
);

-- Se a tabela ja existia sem todos os campos, completar o contrato em portugues.
CALL ipf_add_column_if_missing('kanban_gerencia', 'etapa_kanban', 'ENUM(''Pendente'', ''Em Andamento'', ''Revisao'', ''Aprovado'') DEFAULT ''Pendente''', 'id');
CALL ipf_add_column_if_missing('kanban_gerencia', 'titulo', 'VARCHAR(255) NULL', 'etapa_kanban');
CALL ipf_add_column_if_missing('kanban_gerencia', 'detalhes_json', 'JSON NULL', 'titulo');
CALL ipf_add_column_if_missing('kanban_gerencia', 'observacoes_gerenciais', 'TEXT NULL', 'detalhes_json');
CALL ipf_add_column_if_missing('kanban_gerencia', 'setor_origem', 'ENUM(''Vendas'', ''Arquitetura'', ''Financeiro'', ''Producao'', ''Gerencia'') DEFAULT ''Gerencia''', 'observacoes_gerenciais');
CALL ipf_add_column_if_missing('kanban_gerencia', 'tipo_card', 'ENUM(''Resumo Setor'', ''Decisao'', ''Aprovacao'', ''Prioridade'', ''Tarefa Interna'') DEFAULT ''Tarefa Interna''', 'setor_origem');
CALL ipf_add_column_if_missing('kanban_gerencia', 'prioridade', 'ENUM(''Baixa'', ''Media'', ''Alta'', ''Urgente'') DEFAULT ''Media''', 'tipo_card');
CALL ipf_add_column_if_missing('kanban_gerencia', 'responsavel_gerencia_id', 'BIGINT UNSIGNED NULL', 'prioridade');
CALL ipf_add_column_if_missing('kanban_gerencia', 'criado_por_id', 'BIGINT UNSIGNED NULL', 'responsavel_gerencia_id');
CALL ipf_add_column_if_missing('kanban_gerencia', 'atualizado_por_id', 'BIGINT UNSIGNED NULL', 'criado_por_id');
CALL ipf_add_column_if_missing('kanban_gerencia', 'criado_por_perfil', 'VARCHAR(50) NULL', 'atualizado_por_id');
CALL ipf_add_column_if_missing('kanban_gerencia', 'atualizado_por_perfil', 'VARCHAR(50) NULL', 'criado_por_perfil');
CALL ipf_add_column_if_missing('kanban_gerencia', 'data_criacao', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP', 'atualizado_por_perfil');
CALL ipf_add_column_if_missing('kanban_gerencia', 'ultima_atualizacao', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'data_criacao');
CALL ipf_modify_column_if_exists('kanban_gerencia', 'etapa_kanban', 'ENUM(''Pendente'', ''Em Andamento'', ''Revisao'', ''Aprovado'') DEFAULT ''Pendente''');
CALL ipf_modify_column_if_exists('kanban_gerencia', 'setor_origem', 'ENUM(''Vendas'', ''Arquitetura'', ''Financeiro'', ''Producao'', ''Gerencia'') DEFAULT ''Gerencia''');
CALL ipf_modify_column_if_exists('kanban_gerencia', 'tipo_card', 'ENUM(''Resumo Setor'', ''Decisao'', ''Aprovacao'', ''Prioridade'', ''Tarefa Interna'') DEFAULT ''Tarefa Interna''');
CALL ipf_modify_column_if_exists('kanban_gerencia', 'prioridade', 'ENUM(''Baixa'', ''Media'', ''Alta'', ''Urgente'') DEFAULT ''Media''');
UPDATE kanban_gerencia SET titulo = COALESCE(titulo, CONCAT('Card gerencial ', id)) WHERE titulo IS NULL;
CALL ipf_modify_column_if_exists('kanban_gerencia', 'titulo', 'VARCHAR(255) NOT NULL');
CALL ipf_add_index_if_missing('kanban_gerencia', 'idx_kanban_gerencia_etapa', '(`etapa_kanban`)');
CALL ipf_add_index_if_missing('kanban_gerencia', 'idx_kanban_gerencia_setor', '(`setor_origem`)');
CALL ipf_add_index_if_missing('kanban_gerencia', 'idx_kanban_gerencia_tipo', '(`tipo_card`)');
CALL ipf_add_index_if_missing('kanban_gerencia', 'idx_kanban_gerencia_prioridade', '(`prioridade`)');
CALL ipf_add_index_if_missing('kanban_gerencia', 'idx_kanban_gerencia_responsavel', '(`responsavel_gerencia_id`)');
CALL ipf_add_index_if_missing('kanban_gerencia', 'idx_kanban_gerencia_atualizacao', '(`ultima_atualizacao`)');

-- 10. Seeds opcionais de permissão para Gerente/Administrador ja existentes.
-- Nao cria usuarios. Apenas garante que perfis existentes tenham permissões coerentes.
UPDATE permissoes p
INNER JOIN funcionarios f ON f.id = p.funcionario_id
SET p.modulo_vendas = 1,
    p.modulo_financeiro = 1,
    p.modulo_producao = 1,
    p.modulo_arquitetura = 1,
    p.pode_editar = 1,
    p.pode_deletar = 1,
    p.ver_apenas_proprio = 0,
    p.pode_retroceder_card = 1,
    p.pode_mover_qualquer_etapa = 1,
    p.pode_reabrir_card = 1,
    p.pode_aprovar_entrega_etapa = 1,
    p.pode_forcar_transicao = 1,
    p.pode_trocar_responsavel = 1,
    p.pode_assumir_card = 1,
    p.pode_alterar_prazos = 1,
    p.pode_alterar_prioridade = 1,
    p.pode_ver_valores = 1,
    p.pode_arquivar_card = 1,
    p.pode_deletar_comentarios = 1,
    p.pode_editar_comentarios_outros = 1,
    p.pode_marcar_impedimento = 1,
    p.pode_destravar_impedimento = 1
WHERE LOWER(f.cargo) = 'administrador';

UPDATE permissoes p
INNER JOIN funcionarios f ON f.id = p.funcionario_id
SET p.modulo_vendas = 1,
    p.modulo_financeiro = 0,
    p.modulo_producao = 0,
    p.modulo_arquitetura = 0,
    p.pode_editar = 1,
    p.pode_deletar = 0,
    p.ver_apenas_proprio = 0,
    p.pode_retroceder_card = 0,
    p.pode_mover_qualquer_etapa = 0,
    p.pode_reabrir_card = 0,
    p.pode_aprovar_entrega_etapa = 0,
    p.pode_forcar_transicao = 0,
    p.pode_trocar_responsavel = 1,
    p.pode_assumir_card = 1,
    p.pode_alterar_prazos = 1,
    p.pode_alterar_prioridade = 1,
    p.pode_ver_valores = 1,
    p.pode_arquivar_card = 0,
    p.pode_deletar_comentarios = 0,
    p.pode_editar_comentarios_outros = 0,
    p.pode_marcar_impedimento = 1,
    p.pode_destravar_impedimento = 0
WHERE LOWER(f.cargo) = 'gerente';

DROP PROCEDURE IF EXISTS ipf_add_column_if_missing;
DROP PROCEDURE IF EXISTS ipf_modify_column_if_exists;
DROP PROCEDURE IF EXISTS ipf_add_index_if_missing;

SET SQL_SAFE_UPDATES = @OLD_SQL_SAFE_UPDATES;
