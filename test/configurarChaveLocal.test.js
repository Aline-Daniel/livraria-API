"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { criarConfiguracaoLocal } = require("../scripts/configurar-chave-local");

test("gera API_WRITE_KEY aleatória sem sobrescrever arquivo existente", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "livraria-config-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const caminho = criarConfiguracaoLocal(dir);
  assert.equal(caminho, path.join(dir, ".env.local"));
  const conteúdo = fs.readFileSync(caminho, "utf8");
  assert.match(conteúdo, /^API_WRITE_KEY=[0-9a-f]{64}$/m);
  assert.match(conteúdo, /^DB_USER=configure_seu_usuario$/m);
  assert.match(conteúdo, /^DB_PASSWORD=configure_sua_senha$/m);
  assert.throws(() => criarConfiguracaoLocal(dir), { code: "EEXIST" });
  assert.equal(fs.readFileSync(caminho, "utf8"), conteúdo);
});

test("cada novo ambiente recebe chave distinta", (t) => {
  const a = fs.mkdtempSync(path.join(os.tmpdir(), "livraria-a-"));
  const b = fs.mkdtempSync(path.join(os.tmpdir(), "livraria-b-"));
  t.after(() => [a, b].forEach(dir => fs.rmSync(dir, { recursive: true, force: true })));
  const keyOf = dir => fs.readFileSync(criarConfiguracaoLocal(dir), "utf8").match(/^API_WRITE_KEY=(.+)$/m)[1];
  assert.notEqual(keyOf(a), keyOf(b));
});

test("arquivo privado recebe permissões restritivas em sistemas POSIX", (t) => {
  if (process.platform === "win32") return t.skip("Permissões Unix não se aplicam ao Windows.");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "livraria-mode-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const f = criarConfiguracaoLocal(dir);
  assert.equal(fs.statSync(f).mode & 0o777, 0o600);
});
