const express = require('express');
const routerTask = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middlewares/auth');

routerTask.use(authMiddleware);

routerTask.post('/', taskController.createTask);
routerTask.get('/', taskController.getTasks);
routerTask.put('/:id', taskController.updateTask);
routerTask.delete('/:id', taskController.deleteTask);

module.exports = routerTask;