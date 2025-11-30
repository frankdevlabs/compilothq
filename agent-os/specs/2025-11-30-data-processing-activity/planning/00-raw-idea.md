# Processing Activity Model (Data Processing Activity)

## Feature Description

Implement DataProcessingActivity model with organizationId for multi-tenancy, workflow status tracking (DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, SUSPENDED, ARCHIVED), risk level assessment, DPIA requirement flags (requiresDPIA, dpiaStatus), review date tracking, business owner and processing owner fields, retention period tracking, and metadata JSON field; add compound indexes for dashboard queries (organizationId + status + requiresDPIA, organizationId + nextReviewDate, riskLevel + dpiaStatus); create migrations and test multi-tenant isolation to enable core processing activity management.

## Size

S (Small)

## Date Initiated

2025-11-30
