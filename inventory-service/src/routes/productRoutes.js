const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// GET /api/products - Get all products with filtering and pagination
router.get("/", productController.getAllProducts);

// GET /api/products/:id - Get single product by ID
router.get("/:id", productController.getProductById);

// POST /api/products - Create new product
router.post("/", productController.createProduct);

// PUT /api/products/:id - Update product
router.put("/:id", productController.updateProduct);

// PUT /api/products/:id/stock - Update stock quantity
router.put("/:id/stock", productController.updateStock);

// DELETE /api/products/:id - Soft delete product
router.delete("/:id", productController.deleteProduct);

module.exports = router;
