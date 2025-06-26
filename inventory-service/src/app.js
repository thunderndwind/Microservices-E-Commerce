const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config/config");
const productRoutes = require("./routes/productRoutes");
const grpcServer = require("./grpc/grpcServer");

const app = express();
const PORT = config.port;
const MONGODB_URI = config.database.uri;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/products", productRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        service: "inventory-service",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found",
    });
});

// Database connection
mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("✅ Connected to MongoDB");

        // Start HTTP server
        app.listen(PORT, () => {
            console.log(`🚀 Inventory Service running on port ${PORT}`);
        });

        // Start gRPC server
        grpcServer.start();
    })
    .catch((error) => {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    });

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("🛑 Shutting down gracefully...");
    await mongoose.connection.close();
    grpcServer.stop();
    process.exit(0);
});

module.exports = app;
