"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { once } = require("node:events");

// Proteção: este teste jamais deve apontar para um banco usado por clientes.
// O workflow provisiona um serviço MySQL novo e descartável em cada execução.
test("API HTTP + MySQL descartável", { timeout: 120_000 }, async (t) => {
  assert.equal(process.env.NODE_ENV, "test", "NODE_ENV deve ser test");
  assert.equal(process.env.DB_NAME, "livraria_ci", "Use apenas o banco livraria_ci");
  assert.equal(process.env.DB_HOST, "127.0.0.1", "MySQL precisa ser local no runner");
  assert.equal(process.env.DB_USER, "root", "Este teste usa somente o MySQL efêmero do CI");

  const { sequelize, Livros } = require("../models");
  const app = require("../app");

  // Apenas cria as tabelas ausentes; NÃO usa force:true e NÃO executa o SQL
  // histórico, que contém DROP DATABASE.
  await sequelize.authenticate();
  await sequelize.sync();
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await sequelize.close();
  });

  const base = "http://127.0.0.1:" + server.address().port;
  async function enviar(method, path, body) {
    const resposta = await fetch(base + path, {
      method,
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: resposta.status, body: await resposta.json() };
  }

  const exemplo = {
    titulo: "Dom Casmurro",
    quantidade_paginas: 256,
    autor: "Machado de Assis",
    ano_lancamento: 1899,
    estoque: 10,
  };
  let id;

  await t.test("página inicial responde JSON", async () => {
    const r = await enviar("GET", "/");
    assert.equal(r.status, 200);
    assert.equal(r.body.nome, "Livraria API");
  });

  await t.test("listagem inicia vazia", async () => {
    const r = await enviar("GET", "/livros");
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, []);
  });

  await t.test("não cadastra dados incompletos", async () => {
    const r = await enviar("POST", "/livros", { titulo: "Incompleto" });
    assert.equal(r.status, 400);
    assert.ok(Array.isArray(r.body.detalhes));
  });

  await t.test("cadastro grava o livro no MySQL", async () => {
    const r = await enviar("POST", "/livros", exemplo);
    assert.equal(r.status, 201);
    assert.equal(r.body.status, "OK");
    assert.equal(r.body.livro, exemplo.titulo);
    id = r.body.dados.id;
    assert.ok(Number.isSafeInteger(id) && id > 0);
    const salvo = await Livros.findByPk(id);
    assert.equal(salvo.titulo, exemplo.titulo);
  });

  await t.test("listagem recupera o livro", async () => {
    const r = await enviar("GET", "/livros");
    assert.equal(r.status, 200);
    assert.equal(r.body.length, 1);
    assert.equal(r.body[0].id, id);
  });

  await t.test("consulta REST recupera o livro por ID", async () => {
    const r = await enviar("GET", "/livros/" + id);
    assert.equal(r.status, 200);
    assert.equal(r.body.titulo, exemplo.titulo);
  });

  await t.test("PUT REST atualiza estoque no banco", async () => {
    const r = await enviar("PUT", "/livros/" + id, { estoque: 7 });
    assert.equal(r.status, 200);
    assert.equal(r.body.livro.estoque, 7);
    const salvo = await Livros.findByPk(id);
    assert.equal(salvo.estoque, 7);
  });

  await t.test("rota de consulta antiga continua funcionando", async () => {
    const r = await enviar("GET", "/livros/editar/" + id);
    assert.equal(r.status, 200);
    assert.equal(r.body.estoque, 7);
  });

  await t.test("rota de edição antiga continua funcionando", async () => {
    const r = await enviar("PUT", "/livros/editar/" + id, { estoque: 9 });
    assert.equal(r.status, 200);
    const salvo = await Livros.findByPk(id);
    assert.equal(salvo.estoque, 9);
  });

  await t.test("IDs inválidos retornam 400", async () => {
    const r = await enviar("GET", "/livros/invalido");
    assert.equal(r.status, 400);
  });

  await t.test("livros inexistentes retornam 404", async () => {
    const r = await enviar("GET", "/livros/999999");
    assert.equal(r.status, 404);
  });

  await t.test("atualização vazia retorna 400", async () => {
    const r = await enviar("PUT", "/livros/" + id, {});
    assert.equal(r.status, 400);
  });

  await t.test("não existe rota de exclusão desprotegida", async () => {
    const r = await enviar("DELETE", "/livros/" + id);
    assert.equal(r.status, 404);
    assert.ok(await Livros.findByPk(id));
  });

  await t.test("caminho desconhecido retorna 404", async () => {
    const r = await enviar("GET", "/rota-que-nao-existe");
    assert.equal(r.status, 404);
  });
});
