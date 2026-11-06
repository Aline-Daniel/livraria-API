"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");

// Cria um arquivo local ignorado pelo Git, sem imprimir a chave nem a senha.
// O flag "wx" impede sobrescrever uma configuração já existente.
function criarConfiguracaoLocal(diretorio = path.resolve(__dirname, "..")) {
  const destino = path.join(diretorio, ".env.local");
  const chave = randomBytes(32).toString("hex");
  const conteudo = [
    "# Arquivo privado deste computador. Nunca publique no GitHub.",
    "# Complete DB_USER e DB_PASSWORD com dados do seu MySQL de desenvolvimento.",
    "NODE_ENV=development",
    "DB_HOST=127.0.0.1",
    "DB_PORT=3306",
    "DB_NAME=livraria",
    "DB_USER=configure_seu_usuario",
    "DB_PASSWORD=configure_sua_senha",
    "PORT=3000",
    "API_WRITE_KEY=" + chave,
    "",
  ].join("\n");

  fs.writeFileSync(destino, conteudo, { encoding: "utf8", flag: "wx", mode: 0o600 });
  return destino;
}

if (require.main === module) {
  try {
    const destino = criarConfiguracaoLocal();
    console.log("Configuração local privada criada: " + destino);
    console.log("Agora edite DB_USER e DB_PASSWORD no arquivo .env.local.");
    console.log("Depois rode npm run start:local (Node.js 22).");
    console.log("A chave API_WRITE_KEY foi salva no arquivo, mas não foi exibida.");
  } catch (erro) {
    if (erro && erro.code === "EEXIST") {
      console.error("O arquivo .env.local já existe. Nada foi alterado.");
    } else {
      console.error("Não foi possível criar .env.local: " + (erro && erro.message || erro));
    }
    process.exitCode = 1;
  }
}

module.exports = { criarConfiguracaoLocal };
