"use strict";

// Em produção, configure DB_USER e DB_PASSWORD no ambiente. Os valores padrão
// mantêm a compatibilidade com instalações locais antigas do projeto.
module.exports = {
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "livraria",
  host: process.env.DB_HOST || "127.0.0.1",
  dialect: "mysql",
  port: Number(process.env.DB_PORT || 3306),
  logging: false,
};
