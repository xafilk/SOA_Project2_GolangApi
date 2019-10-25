const sql = require("mssql");
const DateTimeScalar =require('../scalars/dateTimeScalar');
const graphql = require("graphql");
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull
} = graphql;

let config = {
  user: 'svcrestaurantapp',
  password: '12345',
  server: '192.168.1.104', 
  database: 'SOA_Restaurant' 
};
const pool1 = new sql.ConnectionPool(config);
const pool1Connecft = pool1.connect();
console.log(pool1Connecft)

const OrderServiceType = new GraphQLObjectType({
  name: "Order",
  description: "Order of a service",
  fields: () => ({
    id: {
      type: GraphQLID,
      description: "id of the order"
    },
    client: {
      type: UserType,
      resolve(parent, args) {
        let result = pool1.request()
          .query(`SELECT * FROM Users WHERE Use_Email=${parent.clientId}`)
        return result
      }
    },
    restaurant: {
      type: RestaurantType,
      description: "where client want the service",
      resolve(parent, args) {
        let result = pool1.request()
          .query(`SELECT * FROM Resaturants WHERE Res_id=${parent.restaurantId}`)
        return result
      }
    },
    service: {
      type: ServiceType,
      resolve(parent, args){
        let result = pool1.request()
          .query(`SELECT * FROM Rest_Schedules WHERE Ress_id=${parent.serviceId}`)
        return result
      }
    },
    day: {type: new GraphQLNonNull(DateTimeScalar)},
    startTime: {type: new GraphQLNonNull(DateTimeScalar)},
    endTime: {type: new GraphQLNonNull(DateTimeScalar)}
  })
});

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    name: { type: GraphQLString },
    lastname1: { type: GraphQLString},
    lastname2: { type: GraphQLString},
    use_email: { type: GraphQLString },
    password: { type: GraphQLString }
  })
});

const RestaurantType = new GraphQLObjectType({
  name: "Restaurant",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString }
  })
});

const ServiceType = new GraphQLObjectType({
  name: "Service",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    description: {type: GraphQLString}
  })
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    order: {
      type: OrderServiceType,
      args: { id: { type: GraphQLID } },
      description: 'Get orger by id',
      resolve(parent, args) {
        let resultScheduleUsers = pool1.request()
          .query(`SELECT * FROM Rest_Schedule_Users WHERE Ressu_Schedule_Id=${args.id}`)
        let resultRestSchedule = pool1.request()
          .query(`SELECT * FROM Rest_Schedule WHERE Ress_Id=${resultScheduleUsers.Ressu_Schedule_id}`)
        let order={
          id:resultScheduleUsers.Ressu_id,
          clientId:resultScheduleUsers.Ressu_User_id,
          restaurantId:resultRestSchedule.Ress_Restaurant_id,
          serviceId:resultRestSchedule.Ress_Services_id,
          day:Date.parse(resultRestSchedule.Ress_Day),
          startTime:Date.parse(resultRestSchedule.Ress_Start_Time),
          endTime:Date.parse(resultRestSchedule.Ress_End_Time)
        }
        return order
      }
    },
  }
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addOrder: {
      type: OrderServiceType,
      description: 'Create an order',
      args: {
        serviceId: { type: GraphQLID },
        clientId: { type: GraphQLString }
      },
      resolve(parent, args) {
        let newOrder = {
          id: args.id,
          clientId: args.clientId
        };
        addOrder(args.serviceId,args.clientId)
        return newOrder;
      }
    },
    updateOrder: {
      type: OrderServiceType,
      args: {
        id: { type: GraphQLID},
        waiterId: { type: GraphQLID },
        clientId: { type: GraphQLID },
        restaurantId: { type: GraphQLID},
        total: { type: GraphQLInt},
        listProducts: { type: GraphQLString},
      },
      resolve(parent, args) {
        var newDate= new Date();
        let newOrder = {
          id: args.id,
          waiterId: args.waiterId,
          clientId: args.clientId,
          restaurantId: args.restaurantId,
          total: args.total,
          listProducts: args.listProducts,
          date: newDate+"",
        };
        orders.push(newOrder);
        return newOrder;
      }
    },
    deleteOrder: {
      type: OrderServiceType,
      args: {
        id: { type: GraphQLID,},
      },
      resolve(parent, args) {
        return _.find(orders, { id: args.id });
      }
    }
  }
});

async function addOrder(serviceId,clientId){
  try {
    let result = await pool1.request()
      .query(`INSERT INTO Rest_Schedule_Users (Ressu_Schedule_id,Ressu_User_Id)
        VALUES (${serviceId},${clientId})`)
    sql.close();
  } catch (err) {
    sql.close();
    console.log(err);
  }
}

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
});
