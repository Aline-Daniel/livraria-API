"use strict";

// Regras isoladas do Express/Sequelize para facilitar testes automatizados.
const CAMPOS_TEXTO = ["titulo", "autor"];
const CAMPOS_NUMERICOS = ["quantidade_paginas", "ano_lancamento", "estoque"];
const CAMPOS = [...CAMPOS_TEXTO, ...CAMPOS_NUMERICOS];

function validarLivro(body, parcial = false) {
  const dados = {};
  const erros = [];
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { dados, erros: ["Envie um objeto JSON com os dados do livro."] };
  }

  for (const campo of CAMPOS) {
    if (!Object.prototype.hasOwnProperty.call(body, campo)) {
      if (!parcial) erros.push(`O campo ${campo} é obrigatório.`);
      continue;
    }

    const valor = body[campo];
    if (CAMPOS_TEXTO.includes(campo)) {
      if (typeof valor !== "string" || !valor.trim() || valor.trim().length > 50) {
        erros.push(`O campo ${campo} deve conter de 1 a 50 caracteres.`);
      } else {
        dados[campo] = valor.trim();
      }
      continue;
    }

    // Aceita inteiros JSON e strings de formulários, sem arredondar valores inválidos.
    const numero = typeof valor === "string" && /^\d+$/.test(valor.trim())
      ? Number(valor.trim())
      : valor;
    const minimo = campo === "quantidade_paginas" ? 1 : 0;
    const maximo = campo === "ano_lancamento" ? 9999 : Number.MAX_SAFE_INTEGER;
    if (!Number.isSafeInteger(numero) || numero < minimo || numero > maximo) {
      erros.push(`O campo ${campo} deve ser um número inteiro entre ${minimo} e ${maximo}.`);
    } else {
      dados[campo] = numero;
    }
  }

  if (parcial && Object.keys(dados).length === 0 && erros.length === 0) {
    erros.push("Informe ao menos um campo para atualizar.");
  }
  return { dados, erros };
}

function obterId(req, res) {
  const idTexto = req.params && req.params.id;
  if (typeof idTexto !== "string" || !/^[1-9]\d*$/.test(idTexto) || !Number.isSafeInteger(Number(idTexto))) {
    res.status(400).json({ erro: "O ID do livro deve ser um número inteiro positivo." });
    return null;
  }
  return Number(idTexto);
}

function tratarErro(res, erro) {
  // Não retorna SQL ou detalhes de conexão ao cliente.
  if (erro && (erro.name === "SequelizeValidationError" || erro.name === "SequelizeUniqueConstraintError")) {
    return res.status(400).json({ erro: "Os dados fornecidos não passaram na validação." });
  }
  console.error("Falha na API da livraria:", erro);
  return res.status(500).json({ erro: "Não foi possível concluir a operação. Tente novamente." });
}

function criarLivrosController(Livros) {
  return {
    index: async (_req, res) => {
      try {
        const livros = await Livros.findAll();
        return res.status(200).json(livros);
      } catch (erro) {
        return tratarErro(res, erro);
      }
    },

    create: async (req, res) => {
      const { dados, erros } = validarLivro(req.body);
      if (erros.length) return res.status(400).json({ erro: "Dados inválidos.", detalhes: erros });
      try {
        const livroSalvo = await Livros.create(dados);
        // Só responde depois que o banco confirmar a inserção.
        return res.status(201).json({
          status: "OK",
          message: "Cadastrado com sucesso",
          livro: dados.titulo, // preserva campo de resposta da API original
          dados: livroSalvo,
        });
      } catch (erro) {
        return tratarErro(res, erro);
      }
    },

    editarLivro: async (req, res) => {
      const id = obterId(req, res);
      if (id === null) return res;
      try {
        const livro = await Livros.findByPk(id);
        if (!livro) return res.status(404).json({ erro: "Livro não encontrado." });
        return res.status(200).json(livro);
      } catch (erro) {
        return tratarErro(res, erro);
      }
    },

    atualizarLivro: async (req, res) => {
      const id = obterId(req, res);
      if (id === null) return res;
      const { dados, erros } = validarLivro(req.body, true);
      if (erros.length) return res.status(400).json({ erro: "Dados inválidos.", detalhes: erros });
      try {
        const atual = await Livros.findByPk(id);
        if (!atual) return res.status(404).json({ erro: "Livro não encontrado." });
        // Em MySQL, UPDATE pode informar 0 linhas alteradas mesmo se o livro
        // existir, quando os novos valores são iguais aos antigos.
        await Livros.update(dados, { where: { id } });
        const livro = await Livros.findByPk(id);
        if (!livro) return res.status(404).json({ erro: "Livro não encontrado." });
        return res.status(200).json({
          status: "OK",
          message: "Livro atualizado com sucesso",
          livro,
        });
      } catch (erro) {
        return tratarErro(res, erro);
      }
    },


  };
}

module.exports = { criarLivrosController, validarLivro };
