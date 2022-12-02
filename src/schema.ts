import { makeExecutableSchema } from '@graphql-tools/schema'

import { GraphQLError } from 'graphql'

import { createPubSub } from 'graphql-yoga'

const pubSub = createPubSub()


const typeDefinitions = `
type Query {
    totaisPorCategoria: Categories!,
    getMessagesByCategory(category: String!): [Message!]!,
    getLogs(login: String!, pw: String!): [Log!]!,
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

type Categories {
    geral: Int!,
    esportes: Int!,
    cinema: Int!,
}

type Log {
    operation: String!,
    time: String!,
}

type Mutation {
    postMessage(content: String!, category: String!): Message!,
    userSignUp(login: String!, pw: String!): User!,
}

type Subscription {
    userCategorySubscribe(login: String!, pw: String!, category: String!): String!,
}
`

type User = {
    id: string
    login: string
    pw: string
    categories: string[]
    messages: Message[]
}

type Message = {
    id: string
    content: string
    time: string
    category: string
}

type Categories = {
    geral: number,
    esportes: number,
    cinema: number,
}

type Log = {
    operation: string,
    time: string,
}

function custom_sort(a: Message, b: Message) {
    return new Date(a.time).getTime() - new Date(b.time).getTime();
}

const logs: Log[] = [
    
]

const users: User[] = [
    {
      id: '0',
      login: 'Gabriel',
      pw: '123',
      categories: ['geral'],
      messages: [{
        id: "0",
        content: "Olá Mundo",
        category: "geral",
        time: 'Fri Dec 04 2022 11:37:13 GMT-0300 (Horário Padrão de Brasília)'
    },]
    }
  ]

  const messages: Message[] = [
    {
      id: '0',
      content: 'Olá Mundo',
      category: "geral",
      time: 'Fri Dec 22 2022 11:37:13 GMT-0300 (Horário Padrão de Brasília)'
    },
  ]

const resolvers = {
    Query: {
        totaisPorCategoria: () => {
            let geral = 0;
            let cinema = 0;
            let esportes = 0;
            for(let i = 0; i < users.length; i++) {
                if(users[i].categories.includes('geral')) {
                    geral++
                }
                if(users[i].categories.includes('cinema')) {
                    cinema++
                }
                if(users[i].categories.includes('esportes')) {
                    esportes++
                }
            }
            const categories: Categories = {
                cinema: cinema,
                esportes: esportes,
                geral: geral,
            }
            logs.push({
                operation: 'Query',
                time: Date().toLocaleString()
            })
            return categories
        },
        getMessagesByCategory: (parent: unknown, args: { category: string }) => {
            const messagesFilter : Message[] = []
            for(let i = 0; i < messages.length; i++) {

                if(messages[i].category === args.category) {
                    messagesFilter.push(messages[i])
                }
            }
            
            let log: Log = {
                operation: 'Query',
                time: Date().toLocaleString()
            }
            logs.push(log)
            return messagesFilter
        },
        getLogs : (parent: unknown, args: { login: string, pw: string }) => {
            if(args.login === 'admin' && args.pw === 'admin') {
                return logs
            } else {
                return Promise.reject(
                    new GraphQLError(
                    `Não é admin.`
                    )
                )
            }
        }
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
            pubSub.publish('message', args.category, message)
            logs.push({
                operation: 'Mutation',
                time: Date().toLocaleString()
            })
            return message
        },
        userSignUp: (parent: unknown, args: { login: string, pw: string }) => {
            let usersCount = users.length
            const user: User = {
                id: `${usersCount}`,
                login: args.login,
                pw: args.pw,
                categories: [],
                messages: []
            }
            users.push(user)
            logs.push({
                operation: 'Mutation',
                time: Date().toLocaleString()
            })
            return user
        },
    },
    Subscription: {
        userCategorySubscribe: {
            subscribe: async function* (parent: unknown, args: { login: string, pw: string, category: string })  {
                if(args.category == 'cinema' || args.category == 'esportes' ||  args.category == 'geral') {
                    for(let i = 0; i < users.length; i++) {
                        if(users[i].login == args.login && users[i].pw == args.pw) {
                            users[i].categories.push(args.category)
                            logs.push({
                                operation: 'Subscription',
                                time: Date().toLocaleString()
                            })
                            return pubSub.subscribe('message', args.category)
                        } 
                    } 
                    return Promise.reject(
                        new GraphQLError(
                        `Login ou senha incorretos ou usuário não cadastrado.`
                        )
                    )  
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