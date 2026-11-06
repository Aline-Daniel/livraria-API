# Livraria API 📚

API REST em **Node.js, Express, Sequelize e MySQL** para cadastrar, listar, consultar e atualizar livros. O projeto mantém as rotas antigas de edição para compatibilidade.

## Requisitos

- Node.js 18 ou superior (recomendado: 22)
- MySQL com um banco de dados `livraria` e uma tabela `livros`
- npm

## Configuração local

1. Clone o repositório e entre na pasta:

   ```bash
   git clone https://github.com/Aline-Daniel/livraria-API.git
   cd livraria-API
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Crie **seu próprio banco de testes**, sem utilizar dados importantes. A estrutura disponível em `migrations/20200526200521-create_table_livros.js` descreve a tabela `livros`. Se usar o Sequelize CLI, garanta primeiro que o banco existe e configure o acesso.

   **Atenção:** o arquivo histórico `livraria_db.sql` começa com `DROP DATABASE IF EXISTS livraria`; **não o execute em um banco existente**, pois ele apagará os dados!

4. Configure as variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD`. O arquivo `.env.example` mostra os nomes, mas **não é carregado automaticamente**. Por exemplo, no PowerShell:

   ```powershell
   $env:DB_HOST = '127.0.0.1'
   $env:DB_PORT = '3306'
   $env:DB_NAME = 'livraria'
   $env:DB_USER = 'seu_usuario_mysql'
   $env:DB_PASSWORD = 'sua_senha_mysql'
   npm start
   ```

   Os valores padrão (`root` e senha vazia) existem apenas para preservar a compatibilidade com a instalação local antiga. **Em produção, use um usuário MySQL dedicado com senha forte e permissões mínimas.**

5. Acesse `http://localhost:3000` e `http://localhost:3000/livros`.

## Endpoints

| Método | URL | Ação |
|---|---|---|
| `GET` | `/` | Informações da API |
| `GET` | `/livros` | Listar livros |
| `POST` | `/livros` | Cadastrar livro |
| `GET` | `/livros/:id` | Consultar um livro |
| `PUT` | `/livros/:id` | Atualizar campos de um livro |
| `GET` | `/livros/editar/:id` | Rota antiga de consulta, mantida |
| `PUT` | `/livros/editar/:id` | Rota antiga de atualização, mantida |

Corpos de requisição são JSON. Exemplo de cadastro:

```json
{
  "titulo": "Dom Casmurro",
  "quantidade_paginas": 256,
  "autor": "Machado de Assis",
  "ano_lancamento": 1899,
  "estoque": 10
}
```

Os campos `titulo` e `autor` devem conter até 50 caracteres. Páginas precisam ser positivas; ano e estoque não podem ser negativos. Para `PUT`, você pode enviar apenas os campos a alterar. Respostas de erro usam códigos HTTP `400` (dados inválidos), `404` (livro não encontrado) e `500` (erro no servidor).

## Testes automatizados

```bash
npm test
```

Os testes unitários usam um modelo simulado, por isso **não precisam de MySQL**. O GitHub Actions executa os testes e verifica a sintaxe. Para verificar o funcionamento real, é necessário executar a API com um banco MySQL de testes; esse teste de integração ainda não faz parte da automação.

## Segurança e limitações

- Nunca publique senhas em `config/database.js`, arquivos `.env` ou no código. Use variáveis de ambiente e não envie arquivos de configuração sensíveis para o GitHub.
- Esta API de demonstração **não possui autenticação nem autorização**. Não exponha as rotas de escrita (`POST`, `PUT`, `DELETE`) à internet sem adicionar esses controles.
- As versões das bibliotecas foram preservadas para evitar uma migração incompatível com o projeto antigo. Algumas dependências são antigas e devem ser atualizadas/testadas em uma etapa separada, acompanhada de atualização do `package-lock.json`.
- As alterações deste projeto não executam migrações nem alteram dados existentes do banco.
