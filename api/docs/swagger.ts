import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Native API",
      version: "1.0.0",
      description: "API documentation for the Native platform REST endpoints",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Recommendations",
        description: "Ranked opportunities for parents (full scoring and nearby-only)",
      },
      {
        name: "Facilities",
        description: "Reference data for venue, event, club, and route facility slugs",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        InterestSubCategoryTree: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            slug: { type: "string" },
            name: { type: "string" },
            suitableForAge: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            subCategories: {
              type: "array",
              items: { $ref: "#/components/schemas/InterestSubCategoryTree" },
            },
          },
        },
      },
    },
  },
  apis: [
    "api/modules/**/*.routes.ts",
    "api/modules/interests/routes.ts",
    "api/modules/facilities/routes.ts",
    "api/modules/children/routes.ts",
    "api/modules/parents/routes.ts",
    "api/modules/recommendations/recommendations.routes.ts",
    "api/modules/weather/routes.ts",
    // Nested Express routers named routes.ts (not *.routes.ts), e.g. opportunity/events|clubs|routes
    "api/modules/opportunity/**/routes.ts",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: any) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};