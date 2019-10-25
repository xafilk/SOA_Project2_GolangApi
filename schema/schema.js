const sql = require("mssql");
const DateTimeScalar = require("../scalars/dateTimeScalar");
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
  user: "svcrestaurantapp",
  password: "12345",
  server: "192.168.1.104",
  database: "SOA_Restaurant"
};
const pool1 = new sql.ConnectionPool(config);
const pool1Connecft = pool1.connect();
console.log(pool1Connecft);

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
        return getClient(parent.clientId);
      }
    },
    restaurant: {
      type: RestaurantType,
      description: "where client want the service",
      resolve(parent, args) {
        return getRestaurant(parent.restaurantId);
      }
    },
    service: {
      type: ServiceType,
      resolve(parent, args) {
        return getService(parent.serviceId);
      }
    },
    day: { type: GraphQLString },
    startTime: { type: GraphQLString },
    endTime: { type: GraphQLString }
  })
});

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    Use_Name: { type: GraphQLString },
    Use_Last_Name1: { type: GraphQLString },
    Use_Last_Name2: { type: GraphQLString },
    Use_Emai: { type: GraphQLString },
    Use_Password: { type: GraphQLString }
  })
});

const RestaurantType = new GraphQLObjectType({
  name: "Restaurant",
  fields: () => ({
    Res_Id: { type: GraphQLID },
    Res_Name: { type: GraphQLString },
    Res_Region_One_Id: { type: GraphQLInt }
  })
});

const ServiceType = new GraphQLObjectType({
  name: "Service",
  fields: () => ({
    Ress_Id: { type: GraphQLID },
    Ress_Name: { type: GraphQLString },
    Ress_Description: { type: GraphQLString }
  })
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    order: {
      type: OrderServiceType,
      args: { id: { type: GraphQLID } },
      description: "Get orger by id",
      async resolve(parent, args) {
        let resultScheduleUsers = await getResultScheduleUsers(args.id);
        let resultRestSchedule = await getResultRestSchedule(
          resultScheduleUsers.Ressu_Schedule_Id
        );
        let order = {
          id: resultScheduleUsers.Ressu_Id,
          clientId: resultScheduleUsers.Ressu_User_Id,
          restaurantId: resultRestSchedule.Ress_Restaurant_Id,
          serviceId: resultRestSchedule.Ress_Rest_Services_Id,
          day: new Date(resultRestSchedule.Ress_Day) + "",
          startTime: new Date(resultRestSchedule.Ress_Start_Time) + "",
          endTime: new Date(resultRestSchedule.Ress_End_Time) + ""
        };
        return order;
      }
    }
  }
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addOrder: {
      type: OrderServiceType,
      args: {
        serviceId: { type: GraphQLID },
        clientId: { type: GraphQLString }
      },
      resolve(parent, args) {
        let newOrder = {
          id: args.id,
          clientId: args.clientId
        };
        addOrder(args.serviceId, args.clientId);
        return newOrder;
      }
    },
    updateOrder: {
      type: OrderServiceType,
      args: {
        id: { type: GraphQLID },
        clientId: { type: GraphQLID },
        serviceId: { type: GraphQLID }
      },
      resolve(parent, args) {
        updateOrder(args.serviceId, args.clientId, args.id);
        return { id: 1 };
      }
    },
    deleteOrder: {
      type: OrderServiceType,
      args: {
        id: { type: GraphQLID }
      },
      resolve(parent, args) {
        deleteOrder(args.id);
        return { id: 1 };
      }
    }
  }
});

async function addOrder(serviceId, clientId) {
  try {
    let result = await pool1.request()
      .query(`INSERT INTO Rest_Schedule_Users (Ressu_Schedule_Id,Ressu_User_Id)
        VALUES (${serviceId},'${clientId}')`);
    sql.close();
  } catch (err) {
    sql.close();
    console.log(err);
  }
}

async function updateOrder(serviceId, clientId, orderId) {
  try {
    let result = await pool1.request().query(`UPDATE Rest_Schedule_Users 
        SET Ressu_Schedule_Id=${serviceId},Ressu_User_Id='${clientId}'
        WHERE Ressu_Id=${orderId}`);
    sql.close();
  } catch (err) {
    sql.close();
    console.log(err);
  }
}

async function deleteOrder(orderId) {
  try {
    let result = await pool1.request().query(`DELETE FROM Rest_Schedule_Users
        WHERE Ressu_Id=${orderId}`);
    sql.close();
  } catch (err) {
    sql.close();
    console.log(err);
  }
}

async function getRestaurant(id) {
  try {
    let result = await pool1
      .request()
      .query(`SELECT * FROM Restaurants WHERE Res_Id=${id}`);
    sql.close();
    return result["recordset"][0];
  } catch (error) {
    sql.close();
    console.log(error);
    return { id: -1 };
  }
}

async function getService(id) {
  try {
    let result = await pool1
      .request()
      .query(`SELECT * FROM Rest_Services WHERE Ress_Id=${id}`);
    sql.close();
    return result["recordset"][0];
  } catch (error) {
    sql.close();
    console.log(error);
    return { id: -1 };
  }
}

async function getClient(id) {
  try {
    let result = await pool1
      .request()
      .query(`SELECT * FROM Users WHERE Use_Email='${id}'`);
    sql.close();
    return result["recordset"][0];
  } catch (error) {
    sql.close();
    console.log(error);
    return { id: -1 };
  }
}

async function getResultScheduleUsers(id) {
  try {
    let result = await pool1
      .request()
      .query(`SELECT * FROM Rest_Schedule_Users WHERE Ressu_Id=${id}`);
    sql.close();
    return result["recordset"][0];
  } catch (error) {
    sql.close();
    console.log(error);
    return { id: -1 };
  }
}

async function getResultRestSchedule(id) {
  try {
    let result = await pool1
      .request()
      .query(`SELECT * FROM Rest_Schedules WHERE Ress_Id=${id}`);
    sql.close();
    return result["recordset"][0];
  } catch (error) {
    sql.close();
    console.log(error);
    return { id: -1 };
  }
}
module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
});
