const { Livros } = require('../models/')

const indexController = {
    index: async (req, res) => {
        const livros = await Livros.findAll()
        return res.json(livros)
    },
    
    create: async (req, res) => {
        let { titulo, quantidade_paginas, autor, ano_lancamento, estoque } = req.body;

        const livros = await Livros.create({
            titulo,
            quantidade_paginas,
            autor,
            ano_lancamento,
            estoque
        })

        .then(res.status(200).json({            
            status: 'OK',
            message: "Cadastrado com suceso",
            livro:`${titulo}`
          }))
    },

    editarLivro: async (req, res) => {
        let { id } = req.params;
        const livros = await Livros.findByPk(id);

        return res.json(livros);
    },

    atualizarLivro: async (req, res) => {
        let { id } = req.params;
        let { titulo, quantidade_paginas, autor, ano_lancamento, estoque } = req.body;

        const livros = await Livros.update({
            titulo,
            quantidade_paginas,
            autor,
            ano_lancamento,
            estoque
        }, {
            where: { id }
        });


        return res.json(livros);
        
    }
    
};
module.exports = indexController;