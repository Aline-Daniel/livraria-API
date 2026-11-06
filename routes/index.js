"use strict";

const express = require("express");
const indexController = require("../controllers/indexController");
const router = express.Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    nome: "Livraria API",
    mensagem: "API de gerenciamento de livros",
    endpoints: ["GET /livros", "POST /livros", "GET /livros/:id", "PUT /livros/:id", "DELETE /livros/:id"],
  });
});

router.get("/livros", indexController.index);
router.post("/livros", indexController.create);

// Endpoints originais preservados para os clientes existentes.
router.get("/livros/editar/:id", indexController.editarLivro);
router.put("/livros/editar/:id", indexController.atualizarLivro);

// Alternativas REST e exclusão de livros.
router.get("/livros/:id", indexController.editarLivro);
router.put("/livros/:id", indexController.atualizarLivro);
router.delete("/livros/:id", indexController.excluirLivro);

module.exports = router;
