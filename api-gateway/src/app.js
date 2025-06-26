const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const jwt = require("jsonwebtoken");
const path = require("path");

// Load environment variables
require("dotenv").config();

const app = express();
const PORT = process.env.SERVER_PORT || 8080;

// Middleware
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
    })
);

app.use(
    cors({
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
            "Origin",
        ],
        exposedHeaders: ["*"],
        maxAge: 86400, // 24 hours
    })
);

app.use(morgan("combined"));

// Service URLs for REST proxying
const SERVICES = {
    USER_SERVICE: `http://${process.env.USER_SERVICE_HOST || "localhost"}:${
        process.env.USER_SERVICE_REST_PORT || 8081
    }`,
    INVENTORY_SERVICE: `http://${
        process.env.INVENTORY_SERVICE_HOST || "localhost"
    }:${process.env.INVENTORY_SERVICE_REST_PORT || 8082}`,
    PAYMENT_SERVICE: `http://${
        process.env.PAYMENT_SERVICE_HOST || "localhost"
    }:${process.env.PAYMENT_SERVICE_REST_PORT || 8083}`,
};

// gRPC clients setup
let grpcClients = {};

const setupGrpcClients = async () => {
    try {
        // Load proto files
        const userProtoPath = path.join(__dirname, "../../proto/user.proto");
        const inventoryProtoPath = path.join(
            __dirname,
            "../../proto/inventory.proto"
        );
        const paymentProtoPath = path.join(
            __dirname,
            "../../proto/payment.proto"
        );

        const packageDefinition = protoLoader.loadSync(
            [userProtoPath, inventoryProtoPath, paymentProtoPath],
            {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
            }
        );

        const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

        // Create gRPC clients
        grpcClients.user = new protoDescriptor.user.UserService(
            `${process.env.USER_SERVICE_HOST || "localhost"}:${
                process.env.USER_SERVICE_PORT || 9091
            }`,
            grpc.credentials.createInsecure()
        );

        grpcClients.inventory = new protoDescriptor.inventory.InventoryService(
            `${process.env.INVENTORY_SERVICE_HOST || "localhost"}:${
                process.env.INVENTORY_SERVICE_PORT || 9092
            }`,
            grpc.credentials.createInsecure()
        );

        grpcClients.payment = new protoDescriptor.payment.PaymentService(
            `${process.env.PAYMENT_SERVICE_HOST || "localhost"}:${
                process.env.PAYMENT_SERVICE_PORT || 9093
            }`,
            grpc.credentials.createInsecure()
        );

        console.log("✅ gRPC clients initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize gRPC clients:", error.message);
    }
};

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access token required",
        });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET || "mySecretKey123456789012345678901234567890",
        (err, user) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid or expired token",
                });
            }
            req.user = user;
            next();
        }
    );
};

// API Gateway routes

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "UP",
        service: "api-gateway",
        timestamp: new Date().toISOString(),
        services: SERVICES,
    });
});

// User Service routes (public - no auth required for login/register)
// IMPORTANT: Specific routes must come before general ones
app.use(
    "/api/users/register",
    createProxyMiddleware({
        target: SERVICES.USER_SERVICE,
        changeOrigin: true,
        pathRewrite: {
            "^/api/users/register": "/api/users/register",
        },
        onError: (err, req, res) => {
            console.error("Proxy error for /api/users/register:", err.message);
            res.status(500).json({ success: false, message: "Proxy error" });
        },
        logLevel: "debug",
        // More permissive configuration for GUI tools
        headers: {
            Connection: "keep-alive",
        },
        // Don't parse body, let the target service handle it
        parseReqBody: false,
        // Handle all HTTP methods
        ws: false,
        secure: false,
        // Timeout configuration
        proxyTimeout: 10000,
        timeout: 10000,
    })
);

app.use(
    "/api/users/login",
    createProxyMiddleware({
        target: SERVICES.USER_SERVICE,
        changeOrigin: true,
        pathRewrite: {
            "^/api/users/login": "/api/users/login",
        },
        onError: (err, req, res) => {
            console.error("Proxy error for /api/users/login:", err.message);
            res.status(500).json({ success: false, message: "Proxy error" });
        },
        logLevel: "debug",
        // More permissive configuration for GUI tools
        headers: {
            Connection: "keep-alive",
        },
        // Don't parse body, let the target service handle it
        parseReqBody: false,
        // Handle all HTTP methods
        ws: false,
        secure: false,
        // Timeout configuration
        proxyTimeout: 10000,
        timeout: 10000,
    })
);

// Inventory Service routes (public for browsing)
app.use(
    "/api/products",
    createProxyMiddleware({
        target: SERVICES.INVENTORY_SERVICE,
        changeOrigin: true,
        pathRewrite: {
            "^/api/products": "/api/products",
        },
    })
);

// Payment Service routes (protected)
app.use(
    "/api/payments",
    authenticateToken,
    createProxyMiddleware({
        target: SERVICES.PAYMENT_SERVICE,
        changeOrigin: true,
        pathRewrite: {
            "^/api/payments": "/api/payments",
        },
    })
);

// Protected user routes (MUST come after specific routes)
app.use(
    "/api/users",
    authenticateToken,
    createProxyMiddleware({
        target: SERVICES.USER_SERVICE,
        changeOrigin: true,
        pathRewrite: {
            "^/api/users": "/api/users",
        },
    })
);

// Custom endpoint for complete purchase workflow
app.post(
    "/api/purchase",
    express.json(),
    authenticateToken,
    async (req, res) => {
        try {
            const { productId, quantity, paymentDetails } = req.body;
            // Extract userId from JWT token's 'sub' field (standard JWT claim)
            const userId = req.user.sub || req.user.userId || req.user.id;

            console.log("Purchase request:", {
                productId,
                quantity,
                userId,
                user: req.user,
            });

            // Step 1: Check stock availability via gRPC
            const stockCheck = await new Promise((resolve, reject) => {
                grpcClients.inventory.CheckStock(
                    {
                        productId,
                        quantity,
                    },
                    (error, response) => {
                        if (error) reject(error);
                        else resolve(response);
                    }
                );
            });

            if (!stockCheck.available) {
                return res.status(400).json({
                    success: false,
                    message: stockCheck.message || "Insufficient stock",
                });
            }

            // Step 2: Reserve stock
            const reservation = await new Promise((resolve, reject) => {
                grpcClients.inventory.ReserveStock(
                    {
                        productId,
                        quantity,
                        userId,
                    },
                    (error, response) => {
                        if (error) reject(error);
                        else resolve(response);
                    }
                );
            });

            if (!reservation.success) {
                return res.status(400).json({
                    success: false,
                    message: reservation.message || "Failed to reserve stock",
                });
            }

            // Step 3: Get product details for payment amount
            const product = await new Promise((resolve, reject) => {
                grpcClients.inventory.GetProduct(
                    {
                        productId,
                    },
                    (error, response) => {
                        if (error) reject(error);
                        else resolve(response);
                    }
                );
            });

            if (!product.success) {
                // Release reservation on error
                await new Promise((resolve) => {
                    grpcClients.inventory.ReleaseStock(
                        {
                            reservationId: reservation.reservationId,
                        },
                        resolve
                    );
                });

                return res.status(400).json({
                    success: false,
                    message: "Product not found",
                });
            }

            // Step 4: Process payment via REST API instead of gRPC
            const totalAmount = product.product.price * quantity;

            const paymentRequest = {
                userId,
                amount: totalAmount,
                currency: "USD",
                paymentMethod: paymentDetails.paymentMethod || "CreditCard",
                orderId: `ORDER_${Date.now()}`,
                details: paymentDetails,
            };

            console.log("Payment request:", paymentRequest);

            // Call Payment Service REST API
            const paymentResponse = await fetch(
                `${SERVICES.PAYMENT_SERVICE}/api/payments/process`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(paymentRequest),
                }
            );

            if (!paymentResponse.ok) {
                // Release reservation on payment failure
                await new Promise((resolve) => {
                    grpcClients.inventory.ReleaseStock(
                        {
                            reservationId: reservation.reservationId,
                        },
                        resolve
                    );
                });

                return res.status(400).json({
                    success: false,
                    message: "Payment service unavailable",
                });
            }

            const paymentResult = await paymentResponse.json();

            if (!paymentResult.success) {
                // Release reservation on payment failure
                await new Promise((resolve) => {
                    grpcClients.inventory.ReleaseStock(
                        {
                            reservationId: reservation.reservationId,
                        },
                        resolve
                    );
                });

                return res.status(400).json({
                    success: false,
                    message: paymentResult.message || "Payment failed",
                });
            }

            // Step 5: Complete purchase (reservation becomes permanent)
            res.status(200).json({
                success: true,
                message: "Purchase completed successfully",
                data: {
                    orderId: paymentResult.transactionId,
                    paymentId: paymentResult.paymentId,
                    product: product.product,
                    quantity,
                    totalAmount,
                    reservationId: reservation.reservationId,
                },
            });
        } catch (error) {
            console.error("Purchase workflow error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error during purchase",
            });
        }
    }
);

// gRPC endpoint for inter-service communication testing
app.post(
    "/api/grpc/test",
    express.json(),
    authenticateToken,
    async (req, res) => {
        try {
            const { service, method, data } = req.body;

            if (!grpcClients[service]) {
                return res.status(400).json({
                    success: false,
                    message: `Service ${service} not available`,
                });
            }

            const client = grpcClients[service];
            if (typeof client[method] !== "function") {
                return res.status(400).json({
                    success: false,
                    message: `Method ${method} not found in service ${service}`,
                });
            }

            const result = await new Promise((resolve, reject) => {
                client[method](data, (error, response) => {
                    if (error) reject(error);
                    else resolve(response);
                });
            });

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// Start server
const startServer = async () => {
    await setupGrpcClients();

    app.listen(PORT, () => {
        console.log(`🚀 API Gateway running on port ${PORT}`);
        console.log(`📋 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 Services:`);
        console.log(`   - User Service: ${SERVICES.USER_SERVICE}`);
        console.log(`   - Inventory Service: ${SERVICES.INVENTORY_SERVICE}`);
        console.log(`   - Payment Service: ${SERVICES.PAYMENT_SERVICE}`);
    });
};

startServer().catch(console.error);
