const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./database');

const JWT_SECRET = 'super-secret-key-for-learning';

// Type Definitions
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

// Resolvers
const resolvers = {
  Query: {
    todos: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return new Promise((resolve, reject) => {
        db.all(
          'SELECT * FROM todos WHERE user_id = ?',
          [user.id],
          (err, rows) => {
            if (err) reject(err);
            resolve(rows.map(row => ({ ...row, completed: !!row.completed })));
          },
        );
      });
    },
  },
  Mutation: {
    register: async (_, { email, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (email, password) VALUES (?, ?)',
          [email, hashedPassword],
          function (err) {
            if (err) {
              if (err.message.includes('UNIQUE'))
                reject(new Error('Email already exists'));
              else reject(new Error('Database error'));
            } else {
              const user = { id: this.lastID, email };
              const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
              resolve({ token, user });
            }
          },
        );
      });
    },
    login: async (_, { email, password }) => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM users WHERE email = ?',
          [email],
          async (err, user) => {
            if (err) reject(new Error('Database error'));
            if (!user) reject(new Error('User not found'));

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) reject(new Error('Invalid password'));

            const userPayload = { id: user.id, email: user.email };
            const token = jwt.sign(userPayload, JWT_SECRET, {
              expiresIn: '24h',
            });
            resolve({ token, user: userPayload });
          },
        );
      });
    },
    addTodo: async (_, { text }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO todos (user_id, text, completed) VALUES (?, ?, 0)',
          [user.id, text],
          function (err) {
            if (err) reject(new Error('Database error'));
            resolve({
              id: this.lastID,
              text,
              completed: false,
              user_id: user.id,
            });
          },
        );
      });
    },
    updateTodo: async (_, { id, completed }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE todos SET completed = ? WHERE id = ? AND user_id = ?',
          [completed ? 1 : 0, id, user.id],
          function (err) {
            if (err) reject(new Error('Database error'));
            if (this.changes === 0) reject(new Error('Todo not found'));

            db.get(
              'SELECT * FROM todos WHERE id = ? AND user_id = ?',
              [id, user.id],
              (err, row) => {
                if (err || !row)
                  reject(new Error('Database error fetching updated todo'));
                resolve({ ...row, completed: !!row.completed });
              },
            );
          },
        );
      });
    },
    deleteTodo: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return new Promise((resolve, reject) => {
        db.run(
          'DELETE FROM todos WHERE id = ? AND user_id = ?',
          [id, user.id],
          function (err) {
            if (err) reject(new Error('Database error'));
            if (this.changes === 0) reject(new Error('Todo not found'));
            resolve(true);
          },
        );
      });
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
