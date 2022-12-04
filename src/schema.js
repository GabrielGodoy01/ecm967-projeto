function custom_sort(a, b) {
    return new Date(a.time).getTime() - new Date(b.time).getTime();
}

function addLog(ctx, type) {
    const log = {
        operation: type,
        time: Date().toLocaleString(),
      };
      logs.push(log)
      ctx.pubSub.publish("logSubscribe", { logs: logs });
}

const logs = [
]

const users = [
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

  const messages = [
    {
      id: '0',
      content: 'Olá Mundo',
      category: "geral",
      time: 'Fri Dec 22 2022 11:37:13 GMT-0300 (Horário Padrão de Brasília)'
    },
  ]

export const resolvers = {
    Query: {
        totaisPorCategoria (parent, args, ctx, info)  {
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
            const categories = {
                cinema: cinema,
                esportes: esportes,
                geral: geral,
            }
            addLog(ctx, 'Query')
            return categories
        },
        getMessagesByCategory(parent, args, ctx, info)  {
            const messagesFilter = []
            for(let i = 0; i < messages.length; i++) {

                if(messages[i].category === args.category) {
                    messagesFilter.push(messages[i])
                }
            }
            
            addLog(ctx, 'Query')
            return messagesFilter
        },
        getLogs(parent, args, ctx, info) {
            if(args.login === 'admin' && args.pw === 'admin') {
                return logs
            } else {
                return Promise.reject(
                    new Error(
                    `Não é admin.`
                    )
                )
            }
        }
    },
    Mutation: {
        postMessage(parent, args, ctx, info) {
            if(args.content.length > 500) {
                throw new Error(
                    `Mensagem ultrapassou o máximo de 500 caracteres.`
                    )
            }
            let idCount = messages.length
            let time = Date().toLocaleString()
            const message = {
                id: `${idCount}`,
                content: args.content,
                category: args.category,
                time: time
            }
            messages.push(message)
            messages.sort(custom_sort)
            ctx.pubSub.publish(args.category, message)
            addLog(ctx, 'Mutation')
            return message
        },
        userSignUp(parent, args, ctx, info)  {
            let usersCount = users.length
            const user = {
                id: `${usersCount}`,
                login: args.login,
                pw: args.pw,
                categories: [],
                messages: []
            }
            users.push(user)
            addLog(ctx, 'Mutation')
            return user
        },
    },
    Subscription: {
        
          geral: {
            subscribe(parent, args, ctx, info) {
                for(var i = 0; i < users.length; i++) {
                    if(users[i].login === args.login && users[i].pw === args.pw) {
                        
                        {users[i].categories.push(args.category)
                        addLog(ctx, 'Subscription')
                  return ctx.pubSub.subscribe("geral");
                }
                }else {
                    throw new Error(`Login ou senha incorretos ou usuário não cadastrado.`)
                }
                
                } 
            },
          },

          cinema: {
            subscribe(parent, args, ctx, info) {
                if(users[i].login === args.login && users[i].pw === args.pw) {
                    users[i].categories.push(args.category)
                    addLog(ctx, 'Subscription')
                
              return ctx.pubSub.subscribe("cinema");
                } else {
                    throw new Error(`Login ou senha incorretos ou usuário não cadastrado.`)
                }
            },
          },

          esportes: {
            subscribe(parent, args, ctx, info) {
                if(users[i].login === args.login && users[i].pw === args.pw) {
                    users[i].categories.push(args.category)
                    addLog(ctx, 'Subscription')
                
              return ctx.pubSub.subscribe("esportes");
                } else {
                    throw new Error(`Login ou senha incorretos ou usuário não cadastrado.`)
                }
            },
          },

          logSubscribe: {
            subscribe (parent, { login, pw }, ctx, info) {
                if(login === 'admin' && pw === 'admin') {
                    addLog(ctx, 'Subscription');
                    return ctx.pubSub.subscribe("logSubscribe")
                } else {
                    throw new Error('Usuário não autorizado.')
                }
            } 
          }
        }
    }
