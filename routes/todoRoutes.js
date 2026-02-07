const express = require('express');
const router = express.Router();
const { getTodos, createTodo, deleteTodo } = require('../controllers/todoController');
const { protect } = require('../middleware/authMiddleware');


router.get('/', protect, getTodos);
router.post('/', protect, createTodo);
router.delete('/:id', protect, deleteTodo);

module.exports = router;
