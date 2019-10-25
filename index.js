const exprees = require( 'express' )

const graphqlHTTP = require( 'express-graphql' )
const schema = require( './schema/schema')

const app = exprees()

app.use('/graphql' , graphqlHTTP({
    schema,
    graphiql : true
}))

const port = 3000

app.listen(port, () => {
    console.log(`listening in ${port}`)
})