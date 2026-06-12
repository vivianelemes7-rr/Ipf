const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const SQL_DIR = path.resolve(__dirname);

function normalizeSql(sql) {
  return sql.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function stripInlineComments(line) {
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === "'" && !inDoubleQuote) {
      if (nextChar === "'") {
        i += 1; // skip escaped single quote
        continue;
      }
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      if (nextChar === '"') {
        i += 1; // skip escaped double quote
        continue;
      }
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === '-' && nextChar === '-') {
      return line.slice(0, i);
    }
  }

  return line;
}

function splitSqlStatements(sqlText) {
  const statements = [];
  let delimiter = ';';
  let buffer = '';
  const lines = normalizeSql(sqlText).split('\n');

  for (let line of lines) {
    const trimmed = line.trim();
    const delimiterMatch = trimmed.match(/^DELIMITER\s+(.+)$/i);
    if (delimiterMatch) {
      if (buffer.trim()) {
        statements.push(buffer.trim());
        buffer = '';
      }
      delimiter = delimiterMatch[1];
      continue;
    }

    const effectiveLine = stripInlineComments(line);

    if (delimiter === ';') {
      buffer += effectiveLine + '\n';
      if (buffer.trim().endsWith(';')) {
        statements.push(buffer.trim());
        buffer = '';
      }
    } else {
      if (effectiveLine.endsWith(delimiter)) {
        buffer += effectiveLine.slice(0, -delimiter.length);
        statements.push(buffer.trim());
        buffer = '';
      } else {
        buffer += effectiveLine + '\n';
      }
    }
  }

  if (buffer.trim()) {
    statements.push(buffer.trim());
  }

  return statements
    .map((stmt) => {
      const normalized = stmt.replace(/\n{2,}/g, '\n').trim();
      const withoutComments = normalized
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
      return withoutComments;
    })
    .filter((stmt) => stmt);
}

async function run() {
  console.log('Iniciando migrações SQL em:', SQL_DIR);

  const files = fs.readdirSync(SQL_DIR)
    .filter((file) => file.toLowerCase().endsWith('.sql'))
    .sort();

  if (!files.length) {
    console.log('Nenhum arquivo .sql encontrado em', SQL_DIR);
    process.exit(0);
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });

  const connection = await pool.getConnection();

  try {
    for (const file of files) {
      if (file === 'seed_data.sql' && process.env.RUN_SEED !== 'true') {
        console.log(`\n=== Pulando ${file} (seed opcional). Defina RUN_SEED=true para aplicá-lo. ===`);
        continue;
      }

      const filePath = path.join(SQL_DIR, file);
      console.log(`\n=== Aplicando ${file} ===`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const statements = splitSqlStatements(fileContent);

      for (const statement of statements) {
        if (!statement) continue;
        try {
          await connection.query(statement);
        } catch (error) {
          const ignoredCodes = [
            'ER_TABLE_EXISTS_ERROR',
            'ER_DUP_KEYNAME',
            'ER_DUP_FIELDNAME',
            'ER_FK_DUP_NAME',
            'ER_WRONG_VALUE_FOR_VAR'
          ];
          const isDuplicateConstraint = /Duplicate foreign key constraint name/i.test(error.message);
          const isSqlSafeUpdatesNull = /Variable 'sql_safe_updates' can't be set to the value of 'NULL'/i.test(error.message);
          const isDuplicateEntry = file === 'seed_data.sql' && error.code === 'ER_DUP_ENTRY';
          if (ignoredCodes.includes(error.code) || isDuplicateConstraint || isSqlSafeUpdatesNull || isDuplicateEntry) {
            console.warn(`Ignorando erro idempotente em ${file}: ${error.code || 'UNKNOWN'} - ${error.message}`);
            continue;
          }
          console.error(`Erro ao executar statement em ${file}:`, error.code || '', error.message);
          throw error;
        }
      }

      console.log(`Arquivo ${file} aplicado com sucesso.`);
    }

    console.log('\nMigrações concluídas com sucesso.');
  } finally {
    connection.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error('\nFalha nas migrações:', error.message);
  process.exit(1);
});
