import 'dotenv/config';
import express from 'express';
import { db } from './db/index.js';
import { todos } from './db/schema.js';
import { desc, eq } from 'drizzle-orm';

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', async (req, res) => {
  try {
    const allTodos = await db
      .select()
      .from(todos)
      .orderBy(desc(todos.createdAt));
    
    const stats = {
      total: allTodos.length,
      completed: allTodos.filter(t => t.completed).length,
      pending: allTodos.filter(t => !t.completed).length
    };

    res.render('index', { todos: allTodos, stats });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Create todo
app.post('/todos', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title || title.trim() === '') {
      return res.redirect('/?error=Title is required');
    }

    await db.insert(todos).values({
      title: title.trim(),
      description: description?.trim() || null
    });

    res.redirect('/');
  } catch (error) {
    res.redirect('/?error=' + error.message);
  }
});

// Toggle complete
app.post('/todos/:id/toggle', async (req, res) => {
  try {
    const todoId = parseInt(req.params.id);
    const todo = await db.select().from(todos).where(eq(todos.id, todoId));
    
    if (todo.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await db
      .update(todos)
      .set({ completed: !todo[0].completed })
      .where(eq(todos.id, todoId));

    res.redirect('/');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete todo
app.post('/todos/:id/delete', async (req, res) => {
  try {
    const todoId = parseInt(req.params.id);
    await db.delete(todos).where(eq(todos.id, todoId));
    res.redirect('/');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit page
app.get('/todos/:id/edit', async (req, res) => {
  try {
    const todoId = parseInt(req.params.id);
    const result = await db.select().from(todos).where(eq(todos.id, todoId));
    
    if (result.length === 0) {
      return res.redirect('/?error=Todo not found');
    }

    res.render('edit', { todo: result[0] });
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// Update todo
app.post('/todos/:id/update', async (req, res) => {
  try {
    const todoId = parseInt(req.params.id);
    const { title, description } = req.body;

    if (!title || title.trim() === '') {
      return res.redirect(`/todos/${todoId}/edit?error=Title is required`);
    }

    await db
      .update(todos)
      .set({
        title: title.trim(),
        description: description?.trim() || null,
        updatedAt: new Date()
      })
      .where(eq(todos.id, todoId));

    res.redirect('/');
  } catch (error) {
    res.status(500).render('error', { error: error.message });
  }
});

// API endpoint - get all todos
app.get('/api/todos', async (req, res) => {
  try {
    const allTodos = await db.select().from(todos).orderBy(desc(todos.createdAt));
    res.json(allTodos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});