## tRPC endpoint standards and conventions

- **Type-Safe Procedures**: Define all procedures with full TypeScript types, ensuring end-to-end type safety from server to client
- **Consistent Naming**: Use clear, descriptive camelCase naming for procedures (e.g., `getUser`, `createProduct`, `updateOrderStatus`)
- **Router Organization**: Structure routers hierarchically by domain/feature, keeping related procedures together (e.g., `user.getById`, `user.list`, `user.create`)
- **Input Validation**: Use Zod schemas for all procedure inputs to validate data at runtime and provide type inference
- **Procedure Types**: Choose appropriate procedure types - `query` for data fetching, `mutation` for data modification, `subscription` for real-time updates
- **Error Handling**: Use tRPC error codes (BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, etc.) for consistent error responses
- **Context Usage**: Leverage context for authentication, database connections, and shared services rather than passing them as inputs
- **Middleware**: Implement reusable middleware for cross-cutting concerns like authentication, logging, and rate limiting
- **Batching**: Take advantage of tRPC's automatic request batching to optimize network performance
- **Nested Routers**: Keep router nesting to 2-3 levels maximum for maintainability and clear API structure
- **Documentation**: Add JSDoc comments to procedures describing their purpose, inputs, and expected behavior
