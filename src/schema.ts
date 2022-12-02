import { makeExecutableSchema } from '@graphql-tools/schema'

import { GraphQLError } from 'graphql'

import { createPubSub } from 'graphql-yoga'

const pubSub = createPubSub()

const typeDefinitions = `
type Query {
    users: [User!]!,
    messages: [Message!]!,
},

type User{
    id: String!,
    login: String!,
    pw: String!,
    messages: [Message!]!,
},


type Message {
    id: String!
    content: String!
    time: String!
    category: String!
},

type Mutation {
    postMessage(content: String!, category: String!): Message!,
}

type Subscription {
    userCategorySubscribe(category: String!): String!,
}
`

type User = {
    id: string
    login: string
    pw: string
    messages: Message[]
}

type Message = {
    id: string
    content: string
    time: string
    category: string
}

function custom_sort(a: Message, b: Message) {
    return new Date(a.time).getTime() - new Date(b.time).getTime();
}

const users: User[] = [
    {
      id: '0',
      login: 'Gabriel',
      pw: '123',
      messages: [{
        id: "0",
        content: "Olá Mundo",
        category: "geral",
        time: 'Fri Dec 02 2022 11:37:13 GMT-0300 (Horário Padrão de Brasília)'
    },]
    }
  ]

  const messages: Message[] = [
    {
      id: '0',
      content: 'Olá Mundo',
      category: "geral",
      time: '31/11/2022, 11:00:00 AM'
    },
  ]

const resolvers = {
    Query: {
        users: () => users,
        messages: () => messages
    },
    Mutation: {
        postMessage: (parent: unknown, args: { content: string, category: string }) => {
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
                category: args.category,
                time: time
            }
            messages.push(message)
            messages.sort(custom_sort)
            pubSub.publish('message', args.content, message)
            return message
        },
    },
    Subscription: {
        userCategorySubscribe: {
            subscribe: async function* (parent: unknown, args: { category: string })  {
                if(args.category == 'cinema' || args.category == 'esportes' ||  args.category == 'geral') {
                        return pubSub.subscribe('message', args.category)
                } else {
                    return Promise.reject(
                        new GraphQLError(
                        `Categorias são 'cinema', 'esportes' ou 'geral'.`
                        )
                    )
                }
            }
          },}
    }

export const schema = makeExecutableSchema({
    resolvers: [resolvers],
    typeDefs: [typeDefinitions]
})