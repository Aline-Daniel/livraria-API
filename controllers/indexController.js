"use strict";

const { Livros } = require("../models");
const { criarLivrosController } = require("./livrosController");

module.exports = criarLivrosController(Livros);
