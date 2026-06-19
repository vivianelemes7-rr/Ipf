-- Migração: Criação da tabela notificacoes_logistica
-- Notificações automáticas para a equipe de logística.
-- Script idempotente: pode ser executado novamente sem recriar tabelas/colunas já existentes.

SET @OLD_SQL_SAFE_UPDATES = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

DROP PROCEDURE IF EXISTS ipf_add_col_notif_log;
DROP PROCEDURE IF EXISTS ipf_add_idx_notif_log;

DELIMITER $$

CREATE PROCEDURE ipf_add_col_notif_log(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_column_definition TEXT,
    IN p_after_column VARCHAR(64)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_table_name
          AND COLUMN_NAME  = p_column_name
    ) THEN
        SET @sql_col = CONCAT(
            'ALTER TABLE `', p_table_name, '` ADD COLUMN `', p_column_name, '` ', p_column_definition,
            IF(p_after_column IS NULL OR p_after_column = '',
               '',
               CONCAT(' AFTER `', p_after_column, '`'))
        );
        PREPARE s FROM @sql_col;
        EXECUTE s;
        DEALLOCATE PREPARE s;
    END IF;
END$$

CREATE PROCEDURE ipf_add_idx_notif_log(
    IN p_table_name VARCHAR(64),
    IN p_index_name VARCHAR(64),
    IN p_index_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_table_name
          AND INDEX_NAME   = p_index_name
    ) THEN
        SET @sql_idx = CONCAT(
            'ALTER TABLE `', p_table_name, '` ADD INDEX `', p_index_name, '` ', p_index_definition
        );
        PREPARE s FROM @sql_idx;
        EXECUTE s;
        DEALLOCATE PREPARE s;
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- TABELA: notificacoes_logistica
-- Armazena alertas automáticos e manuais para a equipe de
-- logística sobre expedição, atrasos e entregas.
-- ============================================================

CREATE TABLE IF NOT EXISTS notificacoes_logistica (
    id                  INT              NOT NULL AUTO_INCREMENT,
    funcionario_id      BIGINT UNSIGNED  DEFAULT NULL
        COMMENT 'Funcionário que receberá a notificação (NULL = todos da logística)',
    titulo              VARCHAR(150)     NOT NULL,
    mensagem            TEXT             NOT NULL,
    kanban_logistica_id BIGINT UNSIGNED  DEFAULT NULL
        COMMENT 'Referência ao card de logística que originou o alerta',
    tipo_alerta         VARCHAR(60)      DEFAULT NULL
        COMMENT 'Ex: Atraso Logistica, Pronto para Expedicao, Entrega Confirmada, Novo Card',
    prioridade_alerta   ENUM('Normal','Urgente') DEFAULT 'Normal',
    lida                TINYINT(1)       DEFAULT 0,
    data_criacao        TIMESTAMP        NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_notif_log_func_lida  (funcionario_id, lida),
    KEY idx_notif_log_card       (kanban_logistica_id),
    KEY idx_notif_log_tipo       (tipo_alerta),
    KEY idx_notif_log_prioridade (prioridade_alerta),

    CONSTRAINT fk_notif_log_funcionario
        FOREIGN KEY (funcionario_id)
        REFERENCES funcionarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notif_log_klog
        FOREIGN KEY (kanban_logistica_id)
        REFERENCES kanban_logistica(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Notificações automáticas e manuais do Kanban de Logística.';

-- ============================================================
-- Completar colunas caso a tabela já existisse em versão antiga
-- ============================================================

CALL ipf_add_col_notif_log('notificacoes_logistica', 'funcionario_id',      'BIGINT UNSIGNED NULL',                                         'id');
CALL ipf_add_col_notif_log('notificacoes_logistica', 'titulo',              'VARCHAR(150) NOT NULL DEFAULT ''Notificacao''',                 'funcionario_id');
CALL ipf_add_col_notif_log('notificacoes_logistica', 'mensagem',            'TEXT NOT NULL',                                                 'titulo');
CALL ipf_add_col_notif_log('notificacoes_logistica', 'kanban_logistica_id', 'BIGINT UNSIGNED NULL',                                          'mensagem');
CALL ipf_add_col_notif_log('notificacoes_logistica', 'tipo_alerta',         'VARCHAR(60) NULL',                                              'kanban_logistica_id');
CALL ipf_add_col_notif_log('notificacoes_logistica', 'prioridade_alerta',   'ENUM(''Normal'',''Urgente'') DEFAULT ''Normal''',               'tipo_alerta');
CALL ipf_add_col_notif_log('notificacoes_logistica', 'lida',                'TINYINT(1) DEFAULT 0',                                          'prioridade_alerta');
CALL ipf_add_col_notif_log('notificacoes_logistica', 'data_criacao',        'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP',                       'lida');

CALL ipf_add_idx_notif_log('notificacoes_logistica', 'idx_notif_log_func_lida',  '(`funcionario_id`, `lida`)');
CALL ipf_add_idx_notif_log('notificacoes_logistica', 'idx_notif_log_card',       '(`kanban_logistica_id`)');
CALL ipf_add_idx_notif_log('notificacoes_logistica', 'idx_notif_log_tipo',       '(`tipo_alerta`)');
CALL ipf_add_idx_notif_log('notificacoes_logistica', 'idx_notif_log_prioridade', '(`prioridade_alerta`)');

DROP PROCEDURE IF EXISTS ipf_add_col_notif_log;
DROP PROCEDURE IF EXISTS ipf_add_idx_notif_log;

SET SQL_SAFE_UPDATES = @OLD_SQL_SAFE_UPDATES;
