const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Product = require("../models/Product");
const config = require("../config/config");

// Load proto file
const PROTO_PATH = path.join(__dirname, "../../../proto/inventory.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const inventoryProto = grpc.loadPackageDefinition(packageDefinition).inventory;

// gRPC service implementations
const inventoryService = {
    // Check if stock is available for a product
    CheckStock: async (call, callback) => {
        try {
            const { productId, quantity } = call.request;

            const product = await Product.findById(productId);
            if (!product || !product.isActive) {
                return callback(null, {
                    available: false,
                    currentStock: 0,
                    message: "Product not found",
                });
            }

            // Clean expired reservations
            await product.cleanExpiredReservations();

            const availableStock = product.availableStock;
            const isAvailable = availableStock >= quantity;

            callback(null, {
                available: isAvailable,
                currentStock: availableStock,
                message: isAvailable
                    ? `${availableStock} units available`
                    : `Only ${availableStock} units available, requested ${quantity}`,
            });
        } catch (error) {
            console.error("CheckStock error:", error);
            callback(null, {
                available: false,
                currentStock: 0,
                message: `Error checking stock: ${error.message}`,
            });
        }
    },

    // Reserve stock for a purchase
    ReserveStock: async (call, callback) => {
        try {
            const { productId, quantity, userId, reservationId } = call.request;

            const product = await Product.findById(productId);
            if (!product || !product.isActive) {
                return callback(null, {
                    success: false,
                    reservationId: "",
                    message: "Product not found",
                    reservedQuantity: 0,
                });
            }

            // Clean expired reservations first
            await product.cleanExpiredReservations();

            // Check if enough stock is available
            if (product.availableStock < quantity) {
                return callback(null, {
                    success: false,
                    reservationId: "",
                    message: `Insufficient stock. Available: ${product.availableStock}, Requested: ${quantity}`,
                    reservedQuantity: 0,
                });
            }

            // Create reservation
            const finalReservationId = reservationId || uuidv4();

            try {
                await product.addReservation(
                    finalReservationId,
                    userId,
                    quantity
                );

                callback(null, {
                    success: true,
                    reservationId: finalReservationId,
                    message: "Stock reserved successfully",
                    reservedQuantity: quantity,
                });
            } catch (reservationError) {
                callback(null, {
                    success: false,
                    reservationId: "",
                    message: reservationError.message,
                    reservedQuantity: 0,
                });
            }
        } catch (error) {
            console.error("ReserveStock error:", error);
            callback(null, {
                success: false,
                reservationId: "",
                message: `Error reserving stock: ${error.message}`,
                reservedQuantity: 0,
            });
        }
    },

    // Release reserved stock
    ReleaseStock: async (call, callback) => {
        try {
            const { reservationId } = call.request;

            // Find product with this reservation
            const product = await Product.findOne({
                "reservations.reservationId": reservationId,
            });

            if (!product) {
                return callback(null, {
                    success: false,
                    message: "Reservation not found",
                    releasedQuantity: 0,
                });
            }

            // Find the reservation
            const reservation = product.reservations.find(
                (r) => r.reservationId === reservationId
            );
            const releasedQuantity = reservation ? reservation.quantity : 0;

            try {
                await product.removeReservation(reservationId);

                callback(null, {
                    success: true,
                    message: "Stock reservation released successfully",
                    releasedQuantity: releasedQuantity,
                });
            } catch (releaseError) {
                callback(null, {
                    success: false,
                    message: releaseError.message,
                    releasedQuantity: 0,
                });
            }
        } catch (error) {
            console.error("ReleaseStock error:", error);
            callback(null, {
                success: false,
                message: `Error releasing stock: ${error.message}`,
                releasedQuantity: 0,
            });
        }
    },

    // Get product details
    GetProduct: async (call, callback) => {
        try {
            const { productId } = call.request;

            const product = await Product.findById(productId);
            if (!product || !product.isActive) {
                return callback(null, {
                    success: false,
                    message: "Product not found",
                    product: null,
                });
            }

            // Clean expired reservations
            await product.cleanExpiredReservations();

            // Convert to proto format
            const productData = {
                id: product._id.toString(),
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category,
                stockQuantity: product.stockQuantity,
                sku: product.sku,
                images: product.images || [],
                tags: product.tags || [],
                createdAt: product.createdAt.toISOString(),
                updatedAt: product.updatedAt.toISOString(),
            };

            callback(null, {
                success: true,
                message: "Product found",
                product: productData,
            });
        } catch (error) {
            console.error("GetProduct error:", error);
            callback(null, {
                success: false,
                message: `Error getting product: ${error.message}`,
                product: null,
            });
        }
    },
};

// Server management
let server = null;

const start = () => {
    const port = config.grpcPort;

    server = new grpc.Server();
    server.addService(
        inventoryProto.InventoryService.service,
        inventoryService
    );

    const bindAddress = `0.0.0.0:${port}`;
    server.bindAsync(
        bindAddress,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
            if (error) {
                console.error("❌ gRPC server failed to bind:", error);
                return;
            }

            console.log(`🔧 Inventory gRPC server running on port ${port}`);
            server.start();
        }
    );
};

const stop = () => {
    if (server) {
        server.forceShutdown();
        console.log("🛑 Inventory gRPC server stopped");
    }
};

module.exports = { start, stop };
