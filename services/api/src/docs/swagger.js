const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "PY01 Restaurantes API",
      version: "1.0.0",
      description:
        "API REST para gestión de restaurantes, usuarios, menús, productos, categorías y reservas.\n\n" +
        "## Autenticación\n" +
        "La mayoría de endpoints requieren un token JWT. Para obtener uno:\n" +
        "1. Usa `POST /api/auth/login` con email y contraseña, o sin body para obtener un token demo.\n" +
        "2. Copia el token de la respuesta.\n" +
        "3. Haz clic en el botón **Authorize** 🔒 arriba y pega: `Bearer <tu_token>`\n\n" +
        "## Persistencia Políglota\n" +
        "- **PostgreSQL**: Usuarios, restaurantes, menús, productos, categorías, reservas (vía Prisma ORM)\n" +
        "- **MongoDB**: Restaurantes (repositorio alternativo, según DB_ENGINE)\n" +
        "- **Redis**: Caché de consultas frecuentes\n" +
        "- **Elasticsearch**: Búsqueda full-text de restaurantes (microservicio Search)",
      contact: {
        name: "Equipo de Desarrollo"
      },
      license: {
        name: "MIT"
      }
    },
    servers: [
      {
        url: "http://localhost",
        description: "Vía Nginx gateway (puerto 80) — usar siempre este"
      },
      {
        url: "/",
        description: "Relativo al host actual"
      }
    ],
    tags: [
      {
        name: "Autenticación",
        description: "Login y generación de tokens JWT"
      },
      {
        name: "Restaurantes",
        description: "CRUD de restaurantes"
      },
      {
        name: "Usuarios",
        description: "Registro y gestión de usuarios (PostgreSQL)"
      },
      {
        name: "Menús",
        description: "Gestión de menús por restaurante"
      },
      {
        name: "Productos",
        description: "Gestión de productos y categorías"
      },
      {
        name: "Categorías",
        description: "Categorías de productos"
      },
      {
        name: "Reservas",
        description: "Gestión de reservaciones"
      },
      {
        name: "Búsqueda",
        description: "Búsqueda full-text vía Elasticsearch"
      },
      {
        name: "Caché",
        description: "Estadísticas de Redis"
      },
      {
        name: "Salud",
        description: "Health checks de los servicios"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Token JWT para autenticación. Obtén un token en POST /api/auth/login y pégalo aquí sin el prefijo 'Bearer'."
        }
      },
      schemas: {
        // ===== Auth =====
        LoginRequest: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "demo@local",
              description: "Email del usuario"
            },
            role: {
              type: "string",
              enum: ["customer", "admin", "staff"],
              default: "customer",
              description: "Rol del usuario"
            }
            ,
            password: {
              type: "string",
              minLength: 6,
              example: "secret123",
              description: "Contraseña del usuario"
            }
          }
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "JWT válido por 1 hora"
            }
          }
        },

        // ===== User =====
        User: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID único (cuid)" },
            name: { type: "string" },
            email: {
              type: "string",
              format: "email"
            },
            role: {
              type: "string",
              enum: ["admin", "customer"]
            },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        UserInput: {
          type: "object",
          required: ["email", "password", "role"],
          properties: {
            name: {
              type: "string",
              example: "Juan Pérez",
              description: "Opcional; si no se envía, se deriva del email"
            },
            email: {
              type: "string",
              format: "email",
              example: "juan@example.com"
            },
            password: {
              type: "string",
              minLength: 6,
              example: "secret123"
            },
            role: {
              type: "string",
              enum: ["admin", "customer"],
              example: "customer"
            }
          }
        },

        // ===== Restaurant =====
        Restaurant: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID único" },
            name: { type: "string" },
            address: {
              type: "string"
            },
            phone: { type: "string" },
            description: {
              type: "string"
            },
            rating: {
              type: "number",
              format: "float",
              minimum: 0,
              maximum: 5
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          }
        },
        RestaurantInput: {
          type: "object",
          required: ["name", "address"],
          properties: {
            name: { type: "string", example: "La Trattoria" },
            address: {
              type: "string",
              example: "Calle Principal 123"
            },
            phone: { type: "string", example: "555-1234" },
            description: {
              type: "string",
              example: "Restaurante italiano familiar"
            },
            rating: {
              type: "number",
              format: "float",
              minimum: 0,
              maximum: 5,
              example: 4.5
            }
          }
        },

        // ===== Category =====
        Category: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: {
              type: "string"
            },
            icon: { type: "string" }
          }
        },
        CategoryInput: {
          type: "object",
          required: ["name", "description", "icon"],
          properties: {
            name: { type: "string", example: "Entradas" },
            description: {
              type: "string",
              example: "Platos para empezar"
            },
            icon: { type: "string", example: "🥗" }
          }
        },

        // ===== Product =====
        Product: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: {
              type: "string"
            },
            price: { type: "number", format: "decimal" },
            imageUrl: {
              type: "string"
            },
            available: { type: "boolean", default: true },
            categoryId: { type: "string" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        ProductInput: {
          type: "object",
          required: ["name", "description", "price", "imageUrl", "categoryId"],
          properties: {
            name: { type: "string", example: "Bruschetta" },
            description: {
              type: "string",
              example: "Pan tostado con tomate fresco"
            },
            price: { type: "number", format: "decimal", example: 8.5 },
            imageUrl: {
              type: "string",
              example: "https://example.com/img.jpg"
            },
            available: { type: "boolean", default: true },
            categoryId: { type: "string" }
          }
        },

        // ===== Menu =====
        Menu: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: {
              type: "string"
            },
            active: { type: "boolean", default: true },
            restaurantId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            products: {
              type: "array",
              items: { $ref: "#/components/schemas/MenuProduct" }
            }
          }
        },
        MenuInput: {
          type: "object",
          required: ["name", "description", "restaurantId"],
          properties: {
            name: { type: "string", example: "Menú del día" },
            description: {
              type: "string",
              example: "Selección especial de hoy"
            },
            active: { type: "boolean", default: true },
            restaurantId: { type: "string" }
          }
        },
        MenuProduct: {
          type: "object",
          properties: {
            id: { type: "string" },
            menuId: { type: "string" },
            productId: { type: "string" },
            displayOrder: { type: "integer", default: 0 }
          }
        },

        // ===== Reservation =====
        Reservation: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            restaurantId: { type: "string" },
            reservationDate: { type: "string", format: "date-time" },
            partySize: {
              type: "integer",
              minimum: 1
            },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "cancelled", "completed"],
              default: "pending"
            },
            specialRequests: {
              type: "string",
              nullable: true
            },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        ReservationInput: {
          type: "object",
          required: [
            "userId",
            "restaurantId",
            "reservationDate",
            "partySize"
          ],
          properties: {
            userId: { type: "string" },
            restaurantId: { type: "string" },
            reservationDate: {
              type: "string",
              format: "date-time",
              example: "2026-05-01T19:00:00Z"
            },
            partySize: {
              type: "integer",
              minimum: 1,
              example: 4
            },
            specialRequests: {
              type: "string",
              nullable: true,
              example: "Mesa cerca de la ventana"
            }
          }
        },

        // ===== Utility =====
        ServiceStatus: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["up", "down"],
              description: "Estado del servicio"
            },
            latency: {
              type: "integer",
              description: "Latencia en milisegundos"
            },
            error: {
              type: "string",
              description: "Mensaje de error si el servicio está down"
            }
          }
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string", description: "Mensaje de error" },
            error: {
              type: "string",
              description: "Detalles adicionales del error"
            }
          }
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: {} },
            total: {
              type: "integer",
              description: "Total de registros"
            },
            limit: { type: "integer" },
            offset: { type: "integer" }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  // Use absolute path so it works regardless of CWD (npm workspace runs from /app)
  apis: [path.join(__dirname, "../routes/*.js")]
};

// Generate the spec and ensure every operation has at least a minimal `responses` object
const swaggerSpec = swaggerJsdoc(options);

// Add default responses where missing so the UI shows response sections
Object.keys(swaggerSpec.paths || {}).forEach((p) => {
  const pathItem = swaggerSpec.paths[p];
  ["get", "post", "put", "delete", "patch"].forEach((method) => {
    if (pathItem[method] && !pathItem[method].responses) {
      if (method === "post") {
        pathItem[method].responses = {
          "201": { description: "Created" },
          "400": { description: "Bad request" },
          "401": { description: "Unauthorized" },
          "500": { description: "Internal server error" }
        };
      } else {
        pathItem[method].responses = {
          "200": { description: "Successful response" },
          "401": { description: "Unauthorized" },
          "500": { description: "Internal server error" }
        };
      }
    }
  });
});

module.exports = swaggerSpec;
