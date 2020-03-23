const fs = require('fs');
require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { MongoClient } = require('mongodb');

const url = process.env.DB_URL || 'mongodb+srv://praneethbojja:root@cluster0-g6w4z.mongodb.net/test?retryWrites=true&w=majority';

let db;

async function productList() {
  const productsList = await db.collection('products').find({}).toArray();
  return productsList;
}

async function getNextSequence(name) {
    const result = await db.collection('products').countDocuments({});
    return result;
}

async function productAdd(_, { product }) {
  const newProduct = product;
  newProduct.id = await getNextSequence('products');
  const result = await db.collection('products').insertOne(newProduct);
  const savedIssue = await db.collection('products')
    .findOne({ _id: result.insertedId });
  return savedIssue;
}

const resolvers = {
  Query: {
    productList,
  },
  Mutation: {
    productAdd,
  },
};

async function connectToDb() {
  const client = new MongoClient(url, { useNewUrlParser: true });
  await client.connect();
  console.log('Connected to MongoDB at', url);
  db = client.db();
}

const server = new ApolloServer({
  typeDefs: fs.readFileSync('schema.graphql', 'utf-8'),
  resolvers,
  formatError: (error) => {
    console.log(error);
    return error;
  },
});

const app = express();

server.applyMiddleware({ app, path: '/graphql' });

const port = process.env.API_SERVER_PORT || 3000;

(async function () {
  try {
    await connectToDb();
    app.listen(port, () => {
      console.log(`API server started on port ${port}`);
    });
  } catch (err) {
    console.log('ERROR:', err);
  }
}());
