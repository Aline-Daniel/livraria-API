"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { criarLivrosController, validarLivro } = require("../controllers/livrosController");

const livroValido = {
  titulo: "Dom Casmurro",
  quantidade_paginas: 256,
  autor: "Machado de Assis",
  ano_lancamento: 1899,
  estoque: 10,
};

function resposta() {
  return {
    statusCode: 200,
    body: undefined,
    status(n) { this.statusCode = n; return this; },
    json(dados) { this.body = dados; return this; },
  };
}

function repositorio(fake = {}) {
  return {
    findAll: async () => [],
    create: async dados => ({ id: 1, ...dados }),
    findByPk: async () => null,
    update: async () => [0],
    destroy: async () => 0,
    ...fake,
  };
}

describe("Validação de entrada", () => {
  it("aceita um livro completo e normaliza os textos", () => {
    const { dados, erros } = validarLivro({ ...livroValido, titulo: "  Dom Casmurro " });
    assert.deepEqual(erros, []);
    assert.equal(dados.titulo, "Dom Casmurro");
  });

  it("aceita números enviados como strings por formulários", () => {
    const { dados, erros } = validarLivro({ ...livroValido, estoque: "7", ano_lancamento: "1899" });
    assert.deepEqual(erros, []);
    assert.equal(dados.estoque, 7);
    assert.equal(dados.ano_lancamento, 1899);
  });

  it("rejeita campos ausentes ou tipos inválidos", () => {
    assert.ok(validarLivro({ titulo: "Livro" }).erros.length >= 4);
    assert.ok(validarLivro({ ...livroValido, estoque: -1 }).erros.length);
    assert.ok(validarLivro({ ...livroValido, quantidade_paginas: "1.5" }).erros.length);
    assert.ok(validarLivro({ ...livroValido, titulo: "a".repeat(51) }).erros.length);
  });

  it("não aceita campo vazio numa atualização", () => {
    assert.ok(validarLivro({}, true).erros.length);
    assert.ok(validarLivro(null, true).erros.length);
  });

  it("ignora propriedades desconhecidas, sem enviá-las ao ORM", () => {
    const { dados, erros } = validarLivro({ ...livroValido, superuser: true });
    assert.deepEqual(erros, []);
    assert.equal(Object.prototype.hasOwnProperty.call(dados, "superuser"), false);
  });
});

describe("Controlador de livros", () => {
  it("lista livros", async () => {
    const res = resposta();
    await criarLivrosController(repositorio({ findAll: async () => [{ id: 1 }] })).index({}, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ id: 1 }]);
  });

  it("responde 201 somente após a inserção ter sido confirmada", async () => {
    const res = resposta();
    let gravar;
    const promessaGravacao = new Promise(resolve => { gravar = resolve; });
    const controller = criarLivrosController(repositorio({ create: () => promessaGravacao }));
    const pendente = controller.create({ body: livroValido }, res);
    await Promise.resolve();
    assert.equal(res.body, undefined);
    gravar({ id: 6, ...livroValido });
    await pendente;
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.livro, livroValido.titulo);
    assert.equal(res.body.dados.id, 6);
  });

  it("responde 400 para cadastro inválido, sem tocar no banco", async () => {
    let acessouBanco = false;
    const res = resposta();
    await criarLivrosController(repositorio({ create: async () => { acessouBanco = true; } }))
      .create({ body: { titulo: "incompleto" } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(acessouBanco, false);
  });

  it("não expõe detalhes do banco quando o cadastro falha", async () => {
    const res = resposta();
    const log = console.error;
    console.error = () => {};
    try {
      await criarLivrosController(repositorio({ create: async () => { throw Error("DB_PASSWORD=segredo"); } }))
        .create({ body: livroValido }, res);
    } finally { console.error = log; }
    assert.equal(res.statusCode, 500);
    assert.equal(JSON.stringify(res.body).includes("segredo"), false);
  });

  it("retorna 404 ao consultar livro inexistente", async () => {
    const res = resposta();
    await criarLivrosController(repositorio()).editarLivro({ params: { id: "99" } }, res);
    assert.equal(res.statusCode, 404);
  });

  it("retorna 400 para ID inválido", async () => {
    const res = resposta();
    await criarLivrosController(repositorio()).editarLivro({ params: { id: "1 OR 1=1" } }, res);
    assert.equal(res.statusCode, 400);
  });

  it("atualiza parcialmente o livro e retorna os dados atualizados", async () => {
    const res = resposta();
    let argumentos;
    await criarLivrosController(repositorio({
      update: async (...args) => { argumentos = args; return [1]; },
      findByPk: async id => ({ id, estoque: 4 }),
    })).atualizarLivro({ params: { id: "5" }, body: { estoque: 4 } }, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(argumentos, [{ estoque: 4 }, { where: { id: 5 } }]);
    assert.equal(res.body.livro.estoque, 4);
  });

  it("não confunde atualização sem mudanças com livro inexistente", async () => {
    const res = resposta();
    await criarLivrosController(repositorio({
      findByPk: async id => ({ id, estoque: 4 }),
      update: async () => [0],
    })).atualizarLivro({ params: { id: "5" }, body: { estoque: 4 } }, res);
    assert.equal(res.statusCode, 200);
  });

  it("retorna 404 se tentar atualizar um livro inexistente", async () => {
    const res = resposta();
    await criarLivrosController(repositorio()).atualizarLivro({ params: { id: "100" }, body: { estoque: 4 } }, res);
    assert.equal(res.statusCode, 404);
  });

  it("recusa atualização vazia", async () => {
    const res = resposta();
    await criarLivrosController(repositorio()).atualizarLivro({ params: { id: "1" }, body: {} }, res);
    assert.equal(res.statusCode, 400);
  });

  it("retorna 500 quando a consulta falha sem vazar detalhes do banco", async () => {
    const res = resposta();
    const log = console.error;
    console.error = () => {};
    try {
      await criarLivrosController(repositorio({ findAll: async () => { throw Error("senha=secreto"); } }))
        .index({}, res);
    } finally { console.error = log; }
    assert.equal(res.statusCode, 500);
    assert.equal(JSON.stringify(res.body).includes("secreto"), false);
  });

  it("retorna 500 quando a atualização do banco falha", async () => {
    const res = resposta();
    const log = console.error;
    console.error = () => {};
    try {
      await criarLivrosController(repositorio({
        findByPk: async id => ({ id }),
        update: async () => { throw Error("falha SQL"); },
      })).atualizarLivro({ params: { id: "2" }, body: { estoque: 1 } }, res);
    } finally { console.error = log; }
    assert.equal(res.statusCode, 500);
  });
});
