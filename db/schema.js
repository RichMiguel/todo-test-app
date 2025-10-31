import { mysqlTable, int, varchar, text, boolean, timestamp } from 'drizzle-orm/mysql-core';

export const todos = mysqlTable('todos', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  completed: boolean('completed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});