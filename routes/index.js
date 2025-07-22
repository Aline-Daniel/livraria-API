const express = require("express");
const indexController = require('../controllers/indexController');
const router = express.Router();


router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});




router.get('/livros', indexController.index)
router.post('/livros', indexController.create)
router.get('/livros/editar/:id', indexController.editarLivro)
router.put('/livros/editar/:id', indexController.atualizarLivro)








module.exports = router;