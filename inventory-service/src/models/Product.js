const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            maxlength: [200, "Product name cannot exceed 200 characters"],
        },
        description: {
            type: String,
            required: [true, "Product description is required"],
            trim: true,
            maxlength: [1000, "Description cannot exceed 1000 characters"],
        },
        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Price cannot be negative"],
        },
        category: {
            type: String,
            required: [true, "Product category is required"],
            trim: true,
            enum: [
                "Electronics",
                "Clothing",
                "Books",
                "Home",
                "Sports",
                "Beauty",
                "Toys",
                "Other",
            ],
        },
        stockQuantity: {
            type: Number,
            required: [true, "Stock quantity is required"],
            min: [0, "Stock quantity cannot be negative"],
            default: 0,
        },
        sku: {
            type: String,
            required: [true, "SKU is required"],
            unique: true,
            trim: true,
            uppercase: true,
        },
        specifications: {
            weight: Number,
            dimensions: {
                length: Number,
                width: Number,
                height: Number,
            },
            color: String,
            size: String,
            material: String,
            brand: String,
            model: String,
        },
        images: [
            {
                type: String,
                validate: {
                    validator: function (v) {
                        return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(
                            v
                        );
                    },
                    message: "Invalid image URL format",
                },
            },
        ],
        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        reservations: [
            {
                reservationId: {
                    type: String,
                    required: true,
                },
                userId: {
                    type: String,
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
                expiresAt: {
                    type: Date,
                    default: function () {
                        return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
                    },
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Indexes for better performance
productSchema.index({ category: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: "text", description: "text" });

// Virtual for available stock (total - reserved)
productSchema.virtual("availableStock").get(function () {
    const now = new Date();
    const activeReservations = this.reservations.filter(
        (r) => r.expiresAt > now
    );
    const reservedQuantity = activeReservations.reduce(
        (sum, r) => sum + r.quantity,
        0
    );
    return Math.max(0, this.stockQuantity - reservedQuantity);
});

// Method to clean expired reservations
productSchema.methods.cleanExpiredReservations = function () {
    const now = new Date();
    this.reservations = this.reservations.filter((r) => r.expiresAt > now);
    return this.save();
};

// Method to add reservation
productSchema.methods.addReservation = function (
    reservationId,
    userId,
    quantity
) {
    if (this.availableStock < quantity) {
        throw new Error("Insufficient stock available");
    }

    this.reservations.push({
        reservationId,
        userId,
        quantity,
    });

    return this.save();
};

// Method to remove reservation
productSchema.methods.removeReservation = function (reservationId) {
    const initialLength = this.reservations.length;
    this.reservations = this.reservations.filter(
        (r) => r.reservationId !== reservationId
    );

    if (this.reservations.length === initialLength) {
        throw new Error("Reservation not found");
    }

    return this.save();
};

// Pre-save middleware to generate SKU if not provided
productSchema.pre("save", function (next) {
    if (!this.sku && this.isNew) {
        const prefix = this.category.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        this.sku = `${prefix}-${timestamp}`;
    }
    next();
});

module.exports = mongoose.model("Product", productSchema);
