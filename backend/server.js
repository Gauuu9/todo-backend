const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-learning';

const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
  }

  type Todo {
    id: ID!
    text: String!
    completed: Boolean!
    user_id: ID!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    todos: [Todo!]!
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    addTodo(text: String!): Todo!
    updateTodo(id: ID!, completed: Boolean!): Todo!
    deleteTodo(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    todos: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const rows = await db.all('SELECT * FROM todos WHERE user_id = $1', [
        user.id,
      ]);
      return rows.map(row => ({ ...row, completed: !!row.completed }));
    },
  },
  Mutation: {
    register: async (_, { email, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      try {
        const result = await db.run(
          'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
          [email, hashedPassword],
        );
        const user = {
          id: result.lastID?.toString() || result.rows?.[0]?.id?.toString(),
          email,
        };
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
        return { token, user };
      } catch (err) {
        if (err.message.includes('UNIQUE'))
          throw new Error('Email already exists');
        throw new Error('Database error');
      }
    },
    login: async (_, { email, password }) => {
      const user = await db.get('SELECT * FROM users WHERE email = $1', [
        email,
      ]);
      if (!user) throw new Error('User not found');

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) throw new Error('Invalid password');

      const userPayload = { id: user.id.toString(), email: user.email };
      const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });
      return { token, user: userPayload };
    },
    addTodo: async (_, { text }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await db.run(
        'INSERT INTO todos (user_id, text, completed) VALUES ($1, $2, $3) RETURNING *',
        [user.id, text, false],
      );
      return {
        id: result.lastID?.toString() || result.rows?.[0]?.id?.toString(),
        text,
        completed: false,
        user_id: user.id,
      };
    },
    updateTodo: async (_, { id, completed }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await db.run(
        'UPDATE todos SET completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [completed, id, user.id],
      );
      if (result.changes === 0) throw new Error('Todo not found');

      const row = await db.get(
        'SELECT * FROM todos WHERE id = $1 AND user_id = $2',
        [id, user.id],
      );
      return { ...row, completed: !!row.completed };
    },
    deleteTodo: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await db.run(
        'DELETE FROM todos WHERE id = $1 AND user_id = $2',
        [id, user.id],
      );
      if (result.changes === 0) throw new Error('Todo not found');
      return true;
    },
  },
};

const getUser = token => {
  try {
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    }
    return null;
  } catch (err) {
    return null;
  }
};

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '');
        const user = getUser(token);
        return { user };
      },
    }),
  );

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}/graphql`);
  });
}

startServer();
