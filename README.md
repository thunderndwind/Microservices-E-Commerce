# Microservices E-Commerce Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)
![Java](https://img.shields.io/badge/java-17+-orange.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

A modern, scalable e-commerce platform built with microservices architecture, demonstrating best practices in distributed system design, containerization, and inter-service communication.

## 🏗️ Architecture Overview

This project implements a polyglot microservices architecture with the following components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   Web Client    │    │  Mobile Client  │
│   (Express.js)  │    │   (Optional)    │    │   (Optional)    │
└─────────┬───────┘    └─────────────────┘    └─────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Load Balancer                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
    ▼                     ▼                     ▼
┌─────────┐         ┌─────────┐         ┌─────────┐
│  User   │◄────────┤Inventory│◄────────┤ Payment │
│Service  │  gRPC   │ Service │  gRPC   │ Service │
│(Java)   │         │(Node.js)│         │ (Java)  │
└─────────┘         └─────────┘         └─────────┘
    │                     │                     │
    ▼                     ▼                     ▼
┌─────────┐         ┌─────────┐         ┌─────────┐
│ User DB │         │Inventory│         │Payment  │
│(PostgreSQL)       │   DB    │         │   DB    │
└─────────┘         │(MongoDB)│         │(PostgreSQL)
                    └─────────┘         └─────────┘
```

## 🚀 Features

-   **Microservices Architecture**: Independent, scalable services with clear separation of concerns
-   **Polyglot Persistence**: PostgreSQL for transactional data, MongoDB for flexible document storage
-   **gRPC Communication**: High-performance inter-service communication
-   **RESTful APIs**: Standard HTTP/REST endpoints for client communication
-   **API Gateway**: Centralized routing, authentication, and cross-cutting concerns
-   **Docker Containerization**: Fully containerized application with Docker Compose
-   **Security**: JWT authentication, CORS, security headers via Helmet
-   **Health Monitoring**: Health check endpoints for all services
-   **Input Validation**: Comprehensive request validation using Joi and Spring Validation

## 🛠️ Technology Stack

| Component              | Technology              | Purpose                                     |
| ---------------------- | ----------------------- | ------------------------------------------- |
| **API Gateway**        | Node.js + Express       | Request routing, authentication, middleware |
| **User Service**       | Java + Spring Boot      | User management, authentication             |
| **Inventory Service**  | Node.js + Express       | Product catalog, stock management           |
| **Payment Service**    | Java + Spring Boot      | Payment processing, transactions            |
| **User Database**      | PostgreSQL              | User profiles, authentication data          |
| **Inventory Database** | MongoDB                 | Product catalog, specifications             |
| **Payment Database**   | PostgreSQL              | Transaction records, payment history        |
| **Communication**      | gRPC + REST             | Inter-service and client communication      |
| **Containerization**   | Docker + Docker Compose | Service orchestration                       |

## 📦 Services

### API Gateway (Port 8080)

-   **Purpose**: Central entry point for all client requests
-   **Features**: Authentication, rate limiting, request routing, CORS handling
-   **Technology**: Node.js, Express, http-proxy-middleware

### User Service (Port 8081)

-   **Purpose**: User registration, authentication, profile management
-   **Features**: JWT token generation, password hashing, user CRUD operations
-   **Technology**: Java, Spring Boot, PostgreSQL, Spring Security

### Inventory Service (Port 8082)

-   **Purpose**: Product catalog management, stock control
-   **Features**: Product CRUD, search/filtering, stock reservations, pagination
-   **Technology**: Node.js, Express, MongoDB, Mongoose

### Payment Service (Port 8083)

-   **Purpose**: Payment processing, transaction management
-   **Features**: Payment simulation, transaction history, refund processing
-   **Technology**: Java, Spring Boot, PostgreSQL, JPA

## 🔧 Prerequisites

Before running this application, ensure you have the following installed:

-   **Docker & Docker Compose**: Latest version
-   **Node.js**: Version 18 or higher
-   **Java**: Version 17 or higher
-   **Maven**: Version 3.6 or higher (for Java services)
-   **curl or Postman**: For API testing

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/microservices-ecommerce.git
cd microservices-ecommerce
```

### 2. Environment Setup

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Initial setup (optional - for development)
./scripts/setup.sh setup
```

### 3. Start the Application

```bash
# Start all services with Docker Compose
docker compose up --build

# Or run in background
docker compose up --build -d
```

### 4. Verify Installation

```bash
# Check service health
curl http://localhost:8080/health

# Test user registration
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

## 🧪 Testing

### Using the Test Script

```bash
# Run comprehensive tests
./scripts/test.sh

# Quick health check
./scripts/test.sh quick

# Load testing
./scripts/test.sh load

# Create sample data
./scripts/test.sh data
```

### Using the Endpoint Test Script

```bash
# Test all endpoints end-to-end
./test-endpoints.sh
```

### Manual Testing with cURL

#### User Registration

```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "address": "123 Main St, City, State"
  }'
```

#### User Login

```bash
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### Create Product

```bash
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Laptop",
    "description": "High-performance gaming laptop",
    "price": 1599.99,
    "category": "Electronics",
    "stockQuantity": 25,
    "sku": "ELE-001",
    "tags": ["gaming", "laptop", "electronics"]
  }'
```

#### Purchase Workflow

```bash
# First login to get token, then:
curl -X POST http://localhost:8080/api/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "PRODUCT_ID",
    "quantity": 1,
    "paymentDetails": {
      "paymentMethod": "CreditCard",
      "cardInfo": {
        "cardNumber": "1234-5678-9012-3456",
        "expiryDate": "12/25",
        "cvv": "123"
      }
    }
  }'
```

## 📊 API Documentation

### Service Endpoints

| Service           | Port | Health Check       | Swagger/Docs       |
| ----------------- | ---- | ------------------ | ------------------ |
| API Gateway       | 8080 | `/health`          | -                  |
| User Service      | 8081 | `/actuator/health` | `/swagger-ui.html` |
| Inventory Service | 8082 | `/health`          | -                  |
| Payment Service   | 8083 | `/actuator/health` | `/swagger-ui.html` |

### Key API Endpoints

| Method | Endpoint                | Description         | Auth Required |
| ------ | ----------------------- | ------------------- | ------------- |
| `GET`  | `/health`               | API Gateway health  | No            |
| `POST` | `/api/users/register`   | User registration   | No            |
| `POST` | `/api/users/login`      | User login          | No            |
| `GET`  | `/api/users/profile`    | Get user profile    | Yes           |
| `GET`  | `/api/products`         | List products       | No            |
| `POST` | `/api/products`         | Create product      | No            |
| `GET`  | `/api/products/{id}`    | Get product details | No            |
| `POST` | `/api/purchase`         | Complete purchase   | Yes           |
| `POST` | `/api/payments/process` | Process payment     | Yes           |

## 🐳 Docker Configuration

### Services and Ports

| Service           | Internal Port | External Port | Database          |
| ----------------- | ------------- | ------------- | ----------------- |
| API Gateway       | 8080          | 8080          | -                 |
| User Service      | 8081, 9091    | 8081, 9091    | PostgreSQL (5434) |
| Inventory Service | 8082, 9092    | 8082, 9092    | MongoDB (27017)   |
| Payment Service   | 8083, 9093    | 8083, 9093    | PostgreSQL (5433) |

### Docker Commands

```bash
# Build and start all services
docker compose up --build

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild specific service
docker compose build user-service
docker compose up user-service
```

## 🔧 Development

### Running Services Locally

#### Prerequisites

1. Start databases:

```bash
./scripts/setup.sh dev
```

2. Run each service in separate terminals:

#### API Gateway

```bash
cd api-gateway
npm install
npm run dev
```

#### User Service

```bash
cd user-service
mvn spring-boot:run
```

#### Inventory Service

```bash
cd inventory-service
npm install
npm run dev
```

#### Payment Service

```bash
cd payment-service
mvn spring-boot:run
```

### Environment Variables

Create `.env` files in each service directory for local development:

#### API Gateway (.env)

```env
SERVER_PORT=8080
USER_SERVICE_HOST=localhost
USER_SERVICE_PORT=9091
USER_SERVICE_REST_PORT=8081
INVENTORY_SERVICE_HOST=localhost
INVENTORY_SERVICE_PORT=9092
INVENTORY_SERVICE_REST_PORT=8082
PAYMENT_SERVICE_HOST=localhost
PAYMENT_SERVICE_PORT=9093
PAYMENT_SERVICE_REST_PORT=8083
JWT_SECRET=your-secret-key
```

#### User Service (application.properties)

```properties
server.port=8081
grpc.server.port=9091
spring.datasource.url=jdbc:postgresql://localhost:5434/users_db
spring.datasource.username=user_service
spring.datasource.password=user_password
```

#### Inventory Service (.env)

```env
SERVER_PORT=8082
GRPC_PORT=9092
MONGODB_URI=mongodb://admin:admin_password@localhost:27017/inventory_db?authSource=admin
```

## 📁 Project Structure

```
microservices-ecommerce/
├── api-gateway/                 # API Gateway service
│   ├── src/
│   │   ├── app.js              # Main application file
│   │   ├── config/             # Configuration files
│   │   ├── middleware/         # Custom middleware
│   │   └── routes/             # Route definitions
│   ├── package.json
│   └── Dockerfile
├── user-service/               # User management service
│   ├── src/main/java/
│   │   └── com/ecommerce/
│   │       ├── controller/     # REST controllers
│   │       ├── service/        # Business logic
│   │       ├── model/          # Data models
│   │       ├── repository/     # Data access
│   │       └── config/         # Configuration
│   ├── pom.xml
│   └── Dockerfile
├── inventory-service/          # Inventory management service
│   ├── src/
│   │   ├── app.js              # Main application file
│   │   ├── controllers/        # Request handlers
│   │   ├── models/             # Database models
│   │   ├── routes/             # Route definitions
│   │   ├── grpc/               # gRPC server
│   │   └── config/             # Configuration
│   ├── package.json
│   └── Dockerfile
├── payment-service/            # Payment processing service
│   ├── src/main/java/
│   │   └── com/ecommerce/
│   │       ├── controller/     # REST controllers
│   │       ├── service/        # Business logic
│   │       ├── model/          # Data models
│   │       ├── repository/     # Data access
│   │       └── config/         # Configuration
│   ├── pom.xml
│   └── Dockerfile
├── proto/                      # Protocol Buffer definitions
│   ├── user.proto
│   ├── inventory.proto
│   └── payment.proto
├── scripts/                    # Utility scripts
│   ├── setup.sh               # Setup script
│   └── test.sh                # Testing script
├── docker-compose.yml          # Docker Compose configuration
├── test-endpoints.sh           # End-to-end testing script
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## 🔒 Security Features

-   **JWT Authentication**: Secure token-based authentication
-   **Password Hashing**: BCrypt password encryption
-   **CORS Protection**: Cross-origin request protection
-   **Security Headers**: Helmet.js security headers
-   **Input Validation**: Request validation and sanitization
-   **SQL Injection Protection**: Parameterized queries
-   **NoSQL Injection Protection**: MongoDB query sanitization

## 🚦 Health Monitoring

All services include health check endpoints:

```bash
# API Gateway
curl http://localhost:8080/health

# User Service
curl http://localhost:8081/actuator/health

# Inventory Service
curl http://localhost:8082/health

# Payment Service
curl http://localhost:8083/actuator/health
```

## 🐛 Troubleshooting

### Common Issues

#### Services Not Starting

```bash
# Check Docker container status
docker ps -a

# View service logs
docker compose logs user-service
```

#### Database Connection Issues

```bash
# Restart databases
docker compose restart postgres-user postgres-payment mongodb

# Check database logs
docker compose logs postgres-user
docker compose logs mongodb
```

#### Port Conflicts

```bash
# Check what's using ports
sudo netstat -tulpn | grep :8080
sudo lsof -i :8080

# Kill processes using ports
sudo kill -9 $(sudo lsof -t -i:8080)
```

#### gRPC Connection Issues

```bash
# Verify gRPC ports are accessible
telnet localhost 9091
telnet localhost 9092
telnet localhost 9093
```

### Reset Everything

```bash
# Stop all containers and remove volumes
docker compose down -v

# Remove Docker images
docker rmi $(docker images -q microservices-e-commerce*)

# Start fresh
docker compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

-   Spring Boot team for the excellent Java framework
-   Express.js community for the lightweight Node.js framework
-   Docker team for containerization technology
-   gRPC team for high-performance RPC framework

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the [Issues](https://github.com/yourusername/microservices-ecommerce/issues) page
3. Create a new issue with detailed information about your problem

---

**Happy coding! 🚀**
