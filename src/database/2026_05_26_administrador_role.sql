-- Separa Administrador de Gerente e promove o usuário real Admin Geral.

ALTER TABLE funcionarios
MODIFY cargo ENUM('Vendedor', 'Financeiro', 'Producao', 'Arquitetura', 'Gerente', 'Administrador') NULL;

DELETE p_duplicada
FROM permissoes p_duplicada
INNER JOIN permissoes p_mantida
    ON p_mantida.funcionario_id = p_duplicada.funcionario_id
   AND p_mantida.id < p_duplicada.id;

SET @tem_indice_permissoes = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'permissoes'
      AND INDEX_NAME = 'uq_permissoes_funcionario'
);

SET @sql_indice_permissoes = IF(
    @tem_indice_permissoes = 0,
    'ALTER TABLE permissoes ADD UNIQUE KEY uq_permissoes_funcionario (funcionario_id)',
    'SELECT 1'
);

PREPARE stmt_indice_permissoes FROM @sql_indice_permissoes;
EXECUTE stmt_indice_permissoes;
DEALLOCATE PREPARE stmt_indice_permissoes;

UPDATE funcionarios
SET cargo = 'Administrador',
    departamento = COALESCE(NULLIF(departamento, ''), 'Diretoria'),
    status_ativo = 1
WHERE LOWER(nome) = LOWER('Admin Geral');

INSERT INTO permissoes (
    funcionario_id, modulo_vendas, modulo_financeiro, modulo_producao, modulo_arquitetura,
    pode_editar, pode_deletar, ver_apenas_proprio,
    pode_retroceder_card, pode_mover_qualquer_etapa, pode_reabrir_card,
    pode_aprovar_entrega_etapa, pode_forcar_transicao,
    pode_trocar_responsavel, pode_assumir_card,
    pode_alterar_prazos, pode_alterar_prioridade,
    pode_ver_valores, pode_arquivar_card,
    pode_deletar_comentarios, pode_editar_comentarios_outros,
    pode_marcar_impedimento, pode_destravar_impedimento
)
SELECT
    f.id, 1, 1, 1, 1,
    1, 1, 0,
    1, 1, 1,
    1, 1,
    1, 1,
    1, 1,
    1, 1,
    1, 1,
    1, 1
FROM funcionarios f
WHERE LOWER(f.nome) = LOWER('Admin Geral')
  AND NOT EXISTS (
      SELECT 1
      FROM permissoes p
      WHERE p.funcionario_id = f.id
  );

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
