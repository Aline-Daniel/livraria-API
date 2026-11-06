"use strict";

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const indexRouter = require("./routes/index");

const app = express();

app.disable("x-powered-by");
app.use(logger("dev"));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"), { index: false }));

// O roteador já contém o prefixo /livros; evitar /livros/livros.
app.use("/", indexRouter);

// Retorna JSON também para URLs inexistentes.
app.use((_req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

module.exports = app;
