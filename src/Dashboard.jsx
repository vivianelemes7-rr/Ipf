import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { ACESSO_CARDS_DASHBOARD } from './config/roles';
import { sair } from './services/authService';
import { obterPapelUsuarioAtual } from './services/sessionService';

export default function Dashboard() {
    const tipoLogin = obterPapelUsuarioAtual() || 'administrador';
    const navegar = useNavigate();

    const cards = [
        { title: 'Vendas', icon: 'fas fa-shopping-cart', path: '/vendas', description: 'Acesse o painel de vendas e pedidos.' },
        { title: 'Clientes', icon: 'fas fa-users', path: '/clientes', description: 'Gerencie sua base de clientes.' },
        { title: 'Vendedores', icon: 'fas fa-user-tie', path: '/vendedores', description: 'Veja os vendedores e metas.' },
        { title: 'Kanban', icon: 'fas fa-columns', path: '/kanban', description: 'Organize tarefas com o quadro kanban.' },
        { title: 'Cadastro de Vendedor', icon: 'fas fa-user-plus', path: '/cadastro-vendedor', description: 'Crie ou atualize o perfil dos vendedores.' },
    ];

    const titulosPermitidosCards = ACESSO_CARDS_DASHBOARD[tipoLogin] || ACESSO_CARDS_DASHBOARD.administrador;
    const cardsVisiveis = cards.filter((card) => titulosPermitidosCards.includes(card.title));

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <h1>Bem-vindo ao Dashboard</h1>
                    <p>Escolha uma área para começar a gestão do seu sistema.</p>
                    <p style={{ marginTop: '0.5rem', color: '#666' }}><strong>Perfil:</strong> {tipoLogin}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        type="button"
                        className="dashboard-logout"
                        onClick={() => navegar('/alterar-senha')}
                    >
                        Alterar senha
                    </button>
                    <button
                        type="button"
                        className="dashboard-logout"
                        onClick={() => {
                            sair();
                            navegar('/');
                        }}
                    >
                        Sair
                    </button>
                </div>
            </header>

            <section className="dashboard-grid">
                {cardsVisiveis.map((card) => (
                    <Link key={card.title} to={card.path} className="dashboard-card">
                        {card.icon && (
                            <div className="card-icon">
                                <i className={card.icon} aria-hidden="true" />
                            </div>
                        )}
                        <div>
                            <h2>{card.title}</h2>
                            <p>{card.description}</p>
                        </div>
                    </Link>
                ))}
            </section>
        </div>
    );
}
