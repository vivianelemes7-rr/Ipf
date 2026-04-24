const pool = require('../config/database');

const checkPermission = (modulo) => {
    return async (req, res, next) => {
        // Por enquanto, usamos o ID 1 (Bruno Silva) para testes 
        // até o sistema de login estar 100% pronto.
        const funcionarioId = 1; 

        try {
            const [rows] = await pool.query(
                `SELECT * FROM permissoes WHERE funcionario_id = ?`,
                [funcionarioId]
            );

            // Verifica se o funcionário tem a permissão para o módulo enviado
            if (rows.length === 0 || !rows[0][modulo]) {
                return res.status(403).json({ 
                    error: "Acesso Negado: Você não tem permissão para este módulo." 
                });
            }

            next(); // Se tiver permissão, segue para a rota
        } catch (error) {
            console.error("Erro no Middleware:", error);
            res.status(500).json({ error: "Erro interno ao verificar permissões." });
        }
    };
};

module.exports = checkPermission;

