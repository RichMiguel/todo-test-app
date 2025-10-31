import 'dotenv/config';
import express from 'express';
import { initDatabase, getDb } from './db/index.js';
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

// Initialize database
let dbReady = false;
initDatabase()
  .then(() => {
    dbReady = true;
    console.log('✓ Database connected');
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
  });

// Middleware to check database connection
function requireDb(req, res, next) {
  if (!dbReady) {
    return res.status(503).render('error', { 
      error: 'Database is not ready. Please try again in a moment.' 
    });
  }
  next();
}

// Routes
app.get('/', requireDb, async (req, res) => {
  try {
    const db = getDb();
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
app.post('/todos', requireDb, async (req, res) => {
  try {
    const db = getDb();
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
app.post('/todos/:id/toggle', requireDb, async (req, res) => {
  try {
    const db = getDb();
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
app.post('/todos/:id/delete', requireDb, async (req, res) => {
  try {
    const db = getDb();
    const todoId = parseInt(req.params.id);
    await db.delete(todos).where(eq(todos.id, todoId));
    res.redirect('/');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit page
app.get('/todos/:id/edit', requireDb, async (req, res) => {
  try {
    const db = getDb();
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
app.post('/todos/:id/update', requireDb, async (req, res) => {
  try {
    const db = getDb();
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
app.get('/api/todos', requireDb, async (req, res) => {
  try {
    const db = getDb();
    const allTodos = await db.select().from(todos).orderBy(desc(todos.createdAt));
    res.json(allTodos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    database: dbReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});