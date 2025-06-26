const Product = require("../models/Product");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");

// Validation schemas
const productValidationSchema = Joi.object({
    name: Joi.string().trim().max(200).required(),
    description: Joi.string().trim().max(1000).required(),
    price: Joi.number().min(0).required(),
    category: Joi.string()
        .valid(
            "Electronics",
            "Clothing",
            "Books",
            "Home",
            "Sports",
            "Beauty",
            "Toys",
            "Other"
        )
        .required(),
    stockQuantity: Joi.number().integer().min(0).required(),
    sku: Joi.string().trim().uppercase().optional(),
    specifications: Joi.object({
        weight: Joi.number().optional(),
        dimensions: Joi.object({
            length: Joi.number().optional(),
            width: Joi.number().optional(),
            height: Joi.number().optional(),
        }).optional(),
        color: Joi.string().optional(),
        size: Joi.string().optional(),
        material: Joi.string().optional(),
        brand: Joi.string().optional(),
        model: Joi.string().optional(),
    }).optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    tags: Joi.array().items(Joi.string().trim().lowercase()).optional(),
});

const stockUpdateSchema = Joi.object({
    stockQuantity: Joi.number().integer().min(0).required(),
});

// Get all products with pagination and filtering
exports.getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = { isActive: true };

        if (req.query.category) {
            filter.category = req.query.category;
        }

        if (req.query.search) {
            filter.$text = { $search: req.query.search };
        }

        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice)
                filter.price.$gte = parseFloat(req.query.minPrice);
            if (req.query.maxPrice)
                filter.price.$lte = parseFloat(req.query.maxPrice);
        }

        // Execute query
        const products = await Product.find(filter)
            .select("-reservations") // Don't include reservations in list view
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve products",
            error: error.message,
        });
    }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Clean expired reservations before returning
        await product.cleanExpiredReservations();

        res.status(200).json({
            success: true,
            data: {
                product,
                availableStock: product.availableStock,
            },
        });
    } catch (error) {
        console.error("Get product error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve product",
            error: error.message,
        });
    }
};

// Create new product
exports.createProduct = async (req, res) => {
    try {
        // Validate input
        const { error, value } = productValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                details: error.details.map((d) => d.message),
            });
        }

        // Check if SKU already exists
        if (value.sku) {
            const existingProduct = await Product.findOne({ sku: value.sku });
            if (existingProduct) {
                return res.status(400).json({
                    success: false,
                    message: "Product with this SKU already exists",
                });
            }
        }

        const product = new Product(value);
        await product.save();

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: { product },
        });
    } catch (error) {
        console.error("Create product error:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Product with this SKU already exists",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create product",
            error: error.message,
        });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { error, value } = productValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                details: error.details.map((d) => d.message),
            });
        }

        const product = await Product.findById(req.params.id);
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Check if SKU already exists (if changing SKU)
        if (value.sku && value.sku !== product.sku) {
            const existingProduct = await Product.findOne({ sku: value.sku });
            if (existingProduct) {
                return res.status(400).json({
                    success: false,
                    message: "Product with this SKU already exists",
                });
            }
        }

        Object.assign(product, value);
        await product.save();

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: { product },
        });
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: error.message,
        });
    }
};

// Update stock quantity
exports.updateStock = async (req, res) => {
    try {
        const { error, value } = stockUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                details: error.details.map((d) => d.message),
            });
        }

        const product = await Product.findById(req.params.id);
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        product.stockQuantity = value.stockQuantity;
        await product.save();

        res.status(200).json({
            success: true,
            message: "Stock updated successfully",
            data: {
                product: {
                    id: product._id,
                    sku: product.sku,
                    name: product.name,
                    stockQuantity: product.stockQuantity,
                    availableStock: product.availableStock,
                },
            },
        });
    } catch (error) {
        console.error("Update stock error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update stock",
            error: error.message,
        });
    }
};

// Soft delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Check if product has active reservations
        await product.cleanExpiredReservations();
        if (product.reservations.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete product with active reservations",
            });
        }

        product.isActive = false;
        await product.save();

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete product",
            error: error.message,
        });
    }
};
