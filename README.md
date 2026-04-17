# IPFSistemas - Setup Inicial

## Instruções de Instalação
1. Clone o repositório para sua máquina local.
2. No terminal do VS Code, execute `npm install` para instalar as dependências.
3. Crie um arquivo `.env` na raiz do projeto e configure as credenciais do seu banco de dados local.

## Banco de Dados
Os scripts para criação das tabelas e estrutura do banco estão localizados na pasta `/database`.

## Arquitetura do Sistema
O projeto utiliza o padrão de Separação de Responsabilidades (SoC):
- **Routes**: Definição dos endpoints e recebimento de requisições.
- **Controllers**: Gerenciamento do fluxo de dados e respostas.
- **Services**: Implementação das regras de negócio e lógica do sistema.
- **Models**: Comunicação direta com o banco de dados.

## Contato
Em caso de dúvidas técnicas ou necessidade de ajustes na estrutura, entre em contato via WhatsApp.

