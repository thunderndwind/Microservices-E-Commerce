require("dotenv").config();

const config = {
    port: process.env.SERVER_PORT || 8082,
    grpcPort: process.env.GRPC_PORT || 9092,
    database: {
        uri:
            process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_db",
    },
};

module.exports = config;
