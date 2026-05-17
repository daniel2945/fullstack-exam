const express = require('express');
const routerAuth = express.Router();
const authController = require('../controllers/authController');

routerAuth.post('/register', authController.register);
routerAuth.post('/login', authController.login);

module.exports = routerAuth;