import { createPubSub, createServer } from '@graphql-yoga/node'
import * as fs from "fs";
import { resolvers } from './schema'

const pubSub = createPubSub();

const server = createServer({
  schema: {
    typeDefs: fs.readFileSync("./src/schema.graphql", "utf-8"),
    resolvers,
  },
  context: {
    pubSub: pubSub,
  },
});
  
server.start()