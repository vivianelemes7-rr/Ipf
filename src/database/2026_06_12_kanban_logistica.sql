-- Migração: Criação da tabela kanban_logistica
-- Kanban dedicado para controle de expedição e entrega final ao cliente.
-- Script idempotente: pode ser executado novamente sem recriar tabelas/colunas já existentes.

SET @OLD_SQL_SAFE_UPDATES = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

DROP PROCEDURE IF EXISTS ipf_add_column_if_missing_log;
DROP PROCEDURE IF EXISTS ipf_add_index_if_missing_log;

DELIMITER $$

CREATE PROCEDURE ipf_add_column_if_missing_log(
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
        SET @sql_add_col = CONCAT(
            'ALTER TABLE `', p_table_name, '` ADD COLUMN `', p_column_name, '` ', p_column_definition,
            IF(p_after_column IS NULL OR p_after_column = '', '', CONCAT(' AFTER `', p_after_column, '`'))
        );
        PREPARE stmt_add_col FROM @sql_add_col;
        EXECUTE stmt_add_col;
        DEALLOCATE PREPARE stmt_add_col;
    END IF;
END$$

CREATE PROCEDURE ipf_add_index_if_missing_log(
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
        SET @sql_add_idx = CONCAT('ALTER TABLE `', p_table_name, '` ADD INDEX `', p_index_name, '` ', p_index_definition);
        PREPARE stmt_add_idx FROM @sql_add_idx;
        EXECUTE stmt_add_idx;
        DEALLOCATE PREPARE stmt_add_idx;
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- TABELA: kanban_logistica
-- Cards de expedição e entrega gerenciados manualmente pela
-- equipe de logística. Suporta CRUD completo via API /kanban.
-- ============================================================

CREATE TABLE IF NOT EXISTS kanban_logistica (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Posição no quadro
    etapa_kanban  ENUM('Pronto para Envio', 'Em Expedicao', 'Entregue')
                  NOT NULL DEFAULT 'Pronto para Envio',

    -- Dados do card (exibição no frontend)
    titulo        VARCHAR(255)    NOT NULL,
    detalhes_json JSON            DEFAULT NULL COMMENT 'Linhas de detalhe exibidas no card (array JSON)',
    observacoes   TEXT            DEFAULT NULL COMMENT 'Rodapé / footer do card',
    vendedor_nome VARCHAR(100)    DEFAULT 'Não informado',

    -- Dados do pedido associado
    pedido_id     INT             DEFAULT NULL COMMENT 'Referência opcional ao pedido de origem',
    numero_pedido VARCHAR(50)     DEFAULT NULL,
    cliente_nome  VARCHAR(150)    DEFAULT NULL,

    -- Dados de expedição
    numero_nf     VARCHAR(50)     DEFAULT NULL COMMENT 'Número da Nota Fiscal emitida',
    tipo_envio    ENUM('Transportadora', 'Retirada', 'Correios', 'Motoboy', 'Outro')
                  DEFAULT 'Transportadora',
    transportadora VARCHAR(100)   DEFAULT NULL,

    -- Classificação
    process_tag   ENUM('normal', 'especial') DEFAULT 'normal',

    -- Auditoria
    criado_por_perfil    VARCHAR(50) DEFAULT NULL,
    atualizado_por_perfil VARCHAR(50) DEFAULT NULL,
    data_criacao         TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_atualizacao   TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_klog_etapa        (etapa_kanban),
    KEY idx_klog_pedido       (pedido_id),
    KEY idx_klog_atualizacao  (ultima_atualizacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Kanban de Logística: controle de expedição e entrega final ao cliente.';

-- ============================================================
-- Completar colunas caso a tabela já existisse em versão antiga
-- ============================================================

CALL ipf_add_column_if_missing_log('kanban_logistica', 'titulo',               'VARCHAR(255) NOT NULL DEFAULT ''Pedido''',  'etapa_kanban');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'detalhes_json',        'JSON NULL',                                 'titulo');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'observacoes',          'TEXT NULL',                                 'detalhes_json');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'vendedor_nome',        'VARCHAR(100) DEFAULT ''Não informado''',    'observacoes');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'pedido_id',            'INT NULL',                                  'vendedor_nome');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'numero_pedido',        'VARCHAR(50) NULL',                          'pedido_id');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'cliente_nome',         'VARCHAR(150) NULL',                         'numero_pedido');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'numero_nf',            'VARCHAR(50) NULL',                          'cliente_nome');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'tipo_envio',           'ENUM(''Transportadora'', ''Retirada'', ''Correios'', ''Motoboy'', ''Outro'') DEFAULT ''Transportadora''', 'numero_nf');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'transportadora',       'VARCHAR(100) NULL',                         'tipo_envio');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'process_tag',          'ENUM(''normal'', ''especial'') DEFAULT ''normal''', 'transportadora');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'criado_por_perfil',    'VARCHAR(50) NULL',                          'process_tag');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'atualizado_por_perfil','VARCHAR(50) NULL',                          'criado_por_perfil');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'data_criacao',         'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP',  'atualizado_por_perfil');
CALL ipf_add_column_if_missing_log('kanban_logistica', 'ultima_atualizacao',   'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'data_criacao');

CALL ipf_add_index_if_missing_log('kanban_logistica', 'idx_klog_etapa',       '(`etapa_kanban`)');
CALL ipf_add_index_if_missing_log('kanban_logistica', 'idx_klog_pedido',      '(`pedido_id`)');
CALL ipf_add_index_if_missing_log('kanban_logistica', 'idx_klog_atualizacao', '(`ultima_atualizacao`)');

DROP PROCEDURE IF EXISTS ipf_add_column_if_missing_log;
DROP PROCEDURE IF EXISTS ipf_add_index_if_missing_log;

SET SQL_SAFE_UPDATES = @OLD_SQL_SAFE_UPDATES;
