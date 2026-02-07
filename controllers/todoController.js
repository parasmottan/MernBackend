const Todo = require('../models/Todo');


const getTodos = async (req, res) => {

  try {
    const todos = await Todo.find({ user: req.user._id });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching todos' });
  }
};




const createTodo = async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ message: 'todo filed is empty' });

  try {
    const newTodo = await Todo.create({
      user: req.user._id,
      text,
    });
    res.status(201).json(newTodo);

  } catch (error) {
    res.status(500).json({ message: 'Error creating todo' });
  }
};


const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    if (!todo) return res.status(404).json({ message: 'todo not found' });



    await todo.deleteOne();
    res.json({message: 'Todo Deleted'})


  } catch (error) {
    res.status(500).json({ message: 'error deleting todo' });
  }
}



module.exports = {getTodos, createTodo, deleteTodo};