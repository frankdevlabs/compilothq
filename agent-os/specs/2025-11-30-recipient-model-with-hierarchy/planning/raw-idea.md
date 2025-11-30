# Recipient Model with Hierarchy

**Feature**: Recipient Model with Hierarchy

**Description**: Implement Recipient model with name, RecipientType enum (INTERNAL_DEPARTMENT, PROCESSOR, SUB_PROCESSOR, INDEPENDENT_CONTROLLER, JOINT_CONTROLLER, PUBLIC_AUTHORITY, THIRD_PARTY), description, optional vendorId reference for processor recipients, self-referential parentRecipientId for sub-processor chains, and audit timestamps; add indexes on type and parentRecipientId; create migrations and test hierarchical queries to enable recipient tracking with sub-processor visibility.

**Size**: S (Small)
