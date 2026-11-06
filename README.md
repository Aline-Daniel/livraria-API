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

## Proteção de cadastro e edição

As rotas de **escrita** (POST /livros, PUT /livros/:id e PUT /livros/editar/:id) exigem a chave privada indicada em `API_WRITE_KEY`, enviada no cabeçalho `x-api-key`. As consultas GET continuam públicas. **Sem chave configurada, a escrita é desabilitada por padrão (HTTP 503)**; uma chave errada retorna 401 ou 403.

Gere **uma chave exclusiva para o seu servidor** (32 bytes aleatórios, 64 caracteres hexadecimais), por exemplo:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Configure o resultado na variável de ambiente `API_WRITE_KEY` do servidor, sem colocar o valor em arquivos versionados ou no GitHub. Não use a chave de testes: o CI cria outra a cada execução. Exemplo de requisição com variável de ambiente local:

```bash
curl -X POST http://localhost:3000/livros \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_CHAVE_PRIVADA" \
  -d '{"titulo":"Dom Casmurro","quantidade_paginas":256,"autor":"Machado de Assis","ano_lancamento":1899,"estoque":10}'
```

**Aviso para a publicação:** se algum cliente ou automação usa POST/PUT atualmente, será necessário enviar essa chave nas requisições depois de integrar a mudança; **sem ela, o cadastro e a edição deixam de funcionar**. Use somente HTTPS ao disponibilizar a API fora do computador. Para múltiplos usuários, permissões individuais, rotação de chaves, limitação de tentativas e auditoria, prefira um sistema de autenticação completo.

Em `NODE_ENV=production`, também é obrigatório fornecer `DB_USER` e `DB_PASSWORD` para conectar ao MySQL; não há fallback para root sem senha em produção.

## Testes automatizados

```bash
npm test
```

Os testes unitários usam um modelo simulado e não precisam de MySQL. O GitHub Actions também executa testes de integração HTTP com um **MySQL 8.0 descartável**, criado exclusivamente para a execução.

O workflow ".github/workflows/testes.yml" define um banco `livraria_ci` local no ambiente isolado do GitHub Actions, instala as dependências com `npm ci`, cria as tabelas ausentes usando `sequelize.sync()` (sem `force: true`), e testa cadastro, consulta, listagem, edição e respostas a entradas inválidas. **Não usa credenciais de produção nem executa** o arquivo `livraria_db.sql`.

Para executar os testes de integração em um computador de desenvolvimento, use **somente um MySQL de teste isolado**, com `NODE_ENV=test`, `DB_NAME=livraria_ci`, `DB_HOST=127.0.0.1` e `DB_USER=root`, e então rode:

```bash
npm run test:integration
```

O teste se recusa a iniciar se essas condições não forem atendidas. Ele cria tabelas e registros de exemplo no banco de testes, portanto **não aponte para bancos com dados importantes**.

**Limitação:** os testes comprovam a proteção básica por chave compartilhada, mas não substituem uma auditoria de segurança. A API não possui usuários, funções individuais nem controle de tentativas.

## Segurança e limitações

- Nunca publique senhas em `config/database.js`, arquivos `.env` ou no código. Use variáveis de ambiente e não envie arquivos de configuração sensíveis para o GitHub.
- As operações de escrita exigem `API_WRITE_KEY`, uma chave compartilhada, sem autenticação por usuário. Antes de disponibilizar a terceiros, adicione controle de tentativas, rotação de chaves, TLS e autorização por usuários.
- As versões das bibliotecas foram preservadas para evitar uma migração incompatível com o projeto antigo. Algumas dependências são antigas e devem ser atualizadas/testadas em uma etapa separada, acompanhada de atualização do `package-lock.json`.
- As alterações deste projeto não executam migrações nem alteram dados existentes do banco.
