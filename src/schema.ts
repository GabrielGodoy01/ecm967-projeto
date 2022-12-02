import { makeExecutableSchema } from '@graphql-tools/schema'

import { GraphQLError } from 'graphql'

const typeDefinitions = `
type Query {
    users: [User!]!,
    messages: [Message!]!,
},

type User{
    id: String!,
    name: String!,
    messages: [Message!]!,
},

type Message {
    id: String!
    content: String!
    time: String!
},

type Mutation {
    postMessage(content: String!): Message!
}
`

type User = {
    id: string
    name: string
    messages: Message[]
}

type Message = {
    id: string
    content: string
    time: string
}

function custom_sort(a: Message, b: Message) {
    return new Date(a.time).getTime() - new Date(b.time).getTime();
}

const users: User[] = [
    {
      id: '0',
      name: 'Gabriel',
      messages: [{
        id: "0",
        content: "Olá Mundo",
        time: 'Fri Dec 02 2022 11:37:13 GMT-0300 (Horário Padrão de Brasília)'
    },]
    }
  ]

  const messages: Message[] = [
    {
      id: '0',
      content: 'Olá Mundo',
      time: '31/11/2022, 11:00:00 AM'
    },
  ]

const resolvers = {
    Query: {
        users: () => users,
        messages: () => messages
    },
    Mutation: {
        postMessage: (parent: unknown, args: { content: string }) => {
        if(args.content.length > 500) {
            return Promise.reject(
                new GraphQLError(
                  `Mensagem ultrapassou o máximo de 500 caracteres.`
                )
              )
        }
          let idCount = messages.length
          let time = Date().toLocaleString()
          const message: Message = {
            id: `${idCount}`,
            content: args.content,
            time: time
          }
          messages.push(message)
          messages.sort(custom_sort)
          return message
        }
      }
}

export const schema = makeExecutableSchema({
    resolvers: [resolvers],
    typeDefs: [typeDefinitions]
})