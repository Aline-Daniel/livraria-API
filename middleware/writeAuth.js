"use strict";

const { timingSafeEqual } = require("node:crypto");

// Uma chave aleatória de 32 bytes, codificada como 64 caracteres hexadecimais.
// Não existe uma chave padrão: se a configuração faltar, a escrita é negada.
const FORMATO_CHAVE = /^[0-9a-f]{64}$/i;

function protegerEscrita(req, res, next) {
  const configurada = process.env.API_WRITE_KEY;
  if (typeof configurada !== "string" || !FORMATO_CHAVE.test(configurada)) {
    return res.status(503).json({
      erro: "Cadastro e atualização indisponíveis: configure API_WRITE_KEY no servidor.",
    });
  }

  const informada = req.get("x-api-key");
  if (typeof informada !== "string" || !FORMATO_CHAVE.test(informada)) {
    return res.status(401).json({ erro: "Chave de acesso ausente ou inválida." });
  }

  const a = Buffer.from(configurada, "hex");
  const b = Buffer.from(informada, "hex");
  if (!timingSafeEqual(a, b)) {
    return res.status(403).json({ erro: "Acesso não autorizado." });
  }

  return next();
}

module.exports = { protegerEscrita };
