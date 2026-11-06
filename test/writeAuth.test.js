"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const { protegerEscrita } = require("../middleware/writeAuth");

const chaveValida = randomBytes(32).toString("hex");

function requisicao(chave) {
  return { get(nome) { assert.equal(nome, "x-api-key"); return chave; } };
}
function resposta() {
  return {
    statusCode: 200,
    body: null,
    status(n) { this.statusCode = n; return this; },
    json(obj) { this.body = obj; return this; },
  };
}
function executarComChaveServidor(chave, chaveCliente) {
  const anterior = process.env.API_WRITE_KEY;
  if (chave === undefined) delete process.env.API_WRITE_KEY;
  else process.env.API_WRITE_KEY = chave;
  try {
    let liberado = false;
    const res = resposta();
    protegerEscrita(requisicao(chaveCliente), res, () => { liberado = true; });
    return { res, liberado };
  } finally {
    if (anterior === undefined) delete process.env.API_WRITE_KEY;
    else process.env.API_WRITE_KEY = anterior;
  }
}

test("sem chave configurada, a escrita falha fechada (503)", () => {
  const { res, liberado } = executarComChaveServidor(undefined, chaveValida);
  assert.equal(res.statusCode, 503);
  assert.equal(liberado, false);
});
test("uma chave fraca ou com formato incorreto não libera a API", () => {
  const { res, liberado } = executarComChaveServidor("senha123", "senha123");
  assert.equal(res.statusCode, 503);
  assert.equal(liberado, false);
});
test("sem o cabeçalho x-api-key, responde 401", () => {
  const { res, liberado } = executarComChaveServidor(chaveValida, undefined);
  assert.equal(res.statusCode, 401);
  assert.equal(liberado, false);
});
test("cabeçalho com formato inválido responde 401", () => {
  const { res, liberado } = executarComChaveServidor(chaveValida, "123");
  assert.equal(res.statusCode, 401);
  assert.equal(liberado, false);
});
test("chave incorreta com tamanho válido responde 403", () => {
  const incorreta = chaveValida === "0".repeat(64) ? "f".repeat(64) : "0".repeat(64);
  const { res, liberado } = executarComChaveServidor(chaveValida, incorreta);
  assert.equal(res.statusCode, 403);
  assert.equal(liberado, false);
  assert.equal(JSON.stringify(res.body).includes(chaveValida), false);
});
test("chave correta permite continuar para o controller", () => {
  const { liberado } = executarComChaveServidor(chaveValida, chaveValida);
  assert.equal(liberado, true);
});
