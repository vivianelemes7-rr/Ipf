const db = require('../config/database');
require('dotenv').config();

const BASE = 'http://localhost:3000';

async function testEndpoint(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }

    return { status: res.status, data };
}

async function main() {
    console.log('🧪 Starting Kanban Endpoints Test...');

    // 1. Authenticate
    console.log('🔑 Authenticating as admin...');
    const authRes = await testEndpoint('POST', '/auth/login', {
        email: 'admin@ipf.com',
        senha: 'admin123'
    });

    if (authRes.status !== 200 || !authRes.data?.token) {
        console.error('❌ Failed to authenticate. Make sure the database is running and admin is seeded, and start the server using: npm start');
        process.exit(1);
    }

    const token = authRes.data.token;
    console.log('✅ Authenticated successfully!');

    // 2. Get Boards
    console.log('📋 Fetching Kanban boards...');
    const boardsRes = await testEndpoint('GET', '/kanban/boards', null, token);

    if (boardsRes.status !== 200 || !boardsRes.data?.boards) {
        console.error('❌ Failed to fetch boards:', boardsRes.status, boardsRes.data);
        process.exit(1);
    }

    const boardsKeys = Object.keys(boardsRes.data.boards);
    console.log('✅ Boards fetched successfully! Keys returned:', boardsKeys.join(', '));

    const expectedKeys = ['vendedor', 'arquitetura', 'producao', 'financeiro', 'gerente', 'logistica'];
    for (const key of expectedKeys) {
        if (!boardsRes.data.boards[key]) {
            console.error(`❌ Board ${key} is missing in the response!`);
            process.exit(1);
        }
    }
    console.log('✅ All expected boards are present!');

    // 3. Create card in manager board
    console.log('➕ Creating a mock card in manager board...');
    const createRes = await testEndpoint('POST', '/kanban/boards/gerente/cards', {
        columnId: 'pendente',
        title: 'Tarefa de Teste do Script',
        lines: ['Detalhe 1', 'Detalhe 2'],
        footer: 'Prioridade: Alta',
        processTag: 'especial'
    }, token);

    if (createRes.status !== 201 || !createRes.data?.card) {
        console.error('❌ Failed to create card:', createRes.status, createRes.data);
        process.exit(1);
    }

    const cardId = createRes.data.card.id;
    console.log(`✅ Card created successfully! ID: ${cardId}`);

    // 4. Update/Move card in manager board
    console.log(`🔄 Moving card ${cardId} to column 'andamento'...`);
    const updateRes = await testEndpoint('PATCH', `/kanban/boards/gerente/cards/${cardId}`, {
        columnId: 'andamento',
        title: 'Tarefa de Teste do Script (Atualizada)',
        lines: ['Detalhe 1', 'Detalhe 2 atualizado'],
        footer: 'Prioridade: Urgente',
        processTag: 'normal'
    }, token);

    if (updateRes.status !== 200 || !updateRes.data?.card) {
        console.error('❌ Failed to update card:', updateRes.status, updateRes.data);
        process.exit(1);
    }

    console.log(`✅ Card updated successfully! New column: ${updateRes.data.card.columnId}, New Title: ${updateRes.data.card.title}`);

    // 5. Delete card
    console.log(`🗑️ Deleting card ${cardId}...`);
    const deleteRes = await testEndpoint('DELETE', `/kanban/boards/gerente/cards/${cardId}`, null, token);

    if (deleteRes.status !== 200) {
        console.error('❌ Failed to delete card:', deleteRes.status, deleteRes.data);
        process.exit(1);
    }

    console.log('✅ Card deleted successfully!');

    console.log('\n🎉 ALL KANBAN ENDPOINT TESTS PASSED SUCCESSFULLY! 🎉\n');
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Test execution error:', err);
    process.exit(1);
});
