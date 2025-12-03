# Integration Test Documentation

## Overview

This directory contains integration tests for the `@compilothq/database` package. Integration tests use a real test database and verify that DAL functions, validation logic, and factories work correctly together.

## Test Organization

```
__tests__/integration/
├── dal/                                    # Data Access Layer tests
│   ├── externalOrganizations.integration.test.ts
│   ├── recipients.integration.test.ts
│   ├── recipients-hierarchy.integration.test.ts
│   ├── recipients-advanced-queries.integration.test.ts
│   ├── users.integration.test.ts
│   ├── organizations.integration.test.ts
│   └── ...
├── validation/                             # Validation logic tests
│   └── recipientHierarchyValidation.integration.test.ts
├── workflows/                              # End-to-end workflow tests
│   └── recipient-workflows.integration.test.ts
└── README.md                               # This file
```

## Test Data Setup Patterns

### Using Test Factories

All integration tests should use test factories to create consistent, isolated test data.

#### Creating Organizations (Tenants)

```typescript
import { createTestOrganization, cleanupTestOrganizations } from '@compilothq/database/test-utils'

let org: Organization

beforeAll(async () => {
  const { org: testOrg } = await createTestOrganization({
    slug: 'test-org-unique-name',
    userCount: 1, // Automatically creates 1 user (DPO)
  })
  org = testOrg
})

afterAll(async () => {
  await cleanupTestOrganizations([org.id])
})
```

**Key Points:**

- Use unique slugs to avoid conflicts: `test-org-${Date.now()}` or `test-org-your-feature`
- `userCount` parameter creates users automatically (first user is DPO)
- Always cleanup in `afterAll` to maintain test isolation

#### Creating External Organizations

```typescript
import {
  createTestExternalOrganization,
  cleanupTestExternalOrganizations,
} from '@compilothq/database/test-utils'

let externalOrg: ExternalOrganization

beforeAll(async () => {
  externalOrg = await createTestExternalOrganization({
    legalName: 'Test Vendor Inc.',
    tradingName: 'TestVendor',
    headquartersCountryId: country.id, // Optional: link to Country
  })
})

afterAll(async () => {
  await cleanupTestExternalOrganizations([externalOrg.id])
})
```

**Key Points:**

- External organizations are global (not scoped to tenants)
- `legalName` is required, all other fields optional
- Link to Country model for transfer risk assessment tests

#### Creating Recipients

```typescript
import {
  createTestRecipient,
  createTestRecipientHierarchy,
  cleanupTestRecipients,
} from '@compilothq/database/test-utils'

// Create a simple processor
const processor = await createTestRecipient(org.id, {
  type: 'PROCESSOR',
  name: 'AWS Cloud Services',
  externalOrganizationId: externalOrg.id,
})

// Create an internal department (no externalOrganizationId needed)
const department = await createTestRecipient(org.id, {
  type: 'INTERNAL_DEPARTMENT',
  name: 'HR Department',
})

// Create a sub-processor with parent
const subProcessor = await createTestRecipient(org.id, {
  type: 'SUB_PROCESSOR',
  name: 'AWS Sub-Processor',
  externalOrganizationId: subProcessorOrg.id,
  parentRecipientId: processor.id,
  hierarchyType: 'PROCESSOR_CHAIN',
})

// Create entire processor chain (4 levels)
const chain = await createTestRecipientHierarchy(org.id, 4, 'PROCESSOR_CHAIN', {
  externalOrganizationId: externalOrg.id,
  namePrefix: 'Processor', // Optional: customizes names
})
// Returns: [processor, subProcessor1, subProcessor2, subProcessor3]

// Create internal department hierarchy (5 levels)
const departments = await createTestRecipientHierarchy(org.id, 5, 'ORGANIZATIONAL', {
  namePrefix: 'Department',
})
// Returns: [dept1, dept2, dept3, dept4, dept5] with parent-child links

// Cleanup
await cleanupTestRecipients([processor.id, subProcessor.id])
await cleanupTestRecipients(chain.map((r) => r.id))
await cleanupTestRecipients(departments.map((d) => d.id))
```

**Key Points:**

- `organizationId` is required (tenant scope)
- `externalOrganizationId` required for all types except `INTERNAL_DEPARTMENT`
- `createTestRecipientHierarchy` creates complete chains with proper parent-child relationships
- Max depth: 5 for processor chains, 10 for organizational hierarchies
- Use cleanup functions to avoid test data leakage

#### Creating Agreements

```typescript
import { createTestAgreement, cleanupTestAgreements } from '@compilothq/database/test-utils'

const dpa = await createTestAgreement({
  externalOrganizationId: externalOrg.id,
  type: 'DPA', // Data Processing Agreement
  status: 'ACTIVE',
  signedDate: new Date(),
  expiryDate: new Date('2025-12-31'), // Optional
})

await cleanupTestAgreements([dpa.id])
```

**Agreement Types:**

- `DPA`: Data Processing Agreement (Art. 28)
- `JOINT_CONTROLLER_AGREEMENT`: Joint Controller Agreement (Art. 26)
- `SCC`: Standard Contractual Clauses
- `BCR`: Binding Corporate Rules
- `DPF`: Data Privacy Framework
- `NDA`: Non-Disclosure Agreement

**Agreement Statuses:**

- `DRAFT`, `PENDING_SIGNATURE`, `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `TERMINATED`

## Factory Usage for Common Scenarios

### Scenario 1: Testing Processor with DPA

```typescript
// Setup
const externalOrg = await createTestExternalOrganization({
  legalName: 'Cloud Provider Inc.',
})
const dpa = await createTestAgreement({
  externalOrganizationId: externalOrg.id,
  type: 'DPA',
  status: 'ACTIVE',
})
const processor = await createTestRecipient(org.id, {
  type: 'PROCESSOR',
  externalOrganizationId: externalOrg.id,
})

// Test validation
const validation = await validateRequiredAgreements(processor.id, org.id)
expect(validation.warnings).toHaveLength(0) // Has DPA

// Cleanup
await cleanupTestRecipients([processor.id])
await cleanupTestAgreements([dpa.id])
await cleanupTestExternalOrganizations([externalOrg.id])
```

### Scenario 2: Testing Sub-Processor Hierarchy

```typescript
// Setup - Create 4-level processor chain
const externalOrg = await createTestExternalOrganization({
  legalName: 'Main Processor Ltd',
})
const chain = await createTestRecipientHierarchy(org.id, 4, 'PROCESSOR_CHAIN', {
  externalOrganizationId: externalOrg.id,
})

// Test descendant tree query
const tree = await getDescendantTree(chain[0].id, org.id, 10)
expect(tree).toHaveLength(3) // 3 sub-processors
expect(tree.find((r) => r.id === chain[1].id)?.depth).toBe(1)
expect(tree.find((r) => r.id === chain[3].id)?.depth).toBe(3)

// Cleanup
await cleanupTestRecipients(chain.map((r) => r.id))
await cleanupTestExternalOrganizations([externalOrg.id])
```

### Scenario 3: Testing Cross-Border Transfers

```typescript
// Setup - Create countries
const euCountry = await prisma.country.create({
  data: {
    name: 'Netherlands',
    isoCode: 'NL',
    isoCode3: 'NLD',
    gdprStatus: ['EU', 'EEA'],
    isActive: true,
  },
})
const thirdCountry = await prisma.country.create({
  data: {
    name: 'United States',
    isoCode: 'US',
    isoCode3: 'USA',
    gdprStatus: ['Third Country'],
    isActive: true,
  },
})

// Create organizations in different countries
const euOrg = await createTestExternalOrganization({
  legalName: 'EU Processor',
  headquartersCountryId: euCountry.id,
})
const usOrg = await createTestExternalOrganization({
  legalName: 'US Sub-Processor',
  headquartersCountryId: thirdCountry.id,
})

// Create chain with mixed country locations
const euProcessor = await createTestRecipient(org.id, {
  type: 'PROCESSOR',
  externalOrganizationId: euOrg.id,
})
const usSubProcessor = await createTestRecipient(org.id, {
  type: 'SUB_PROCESSOR',
  externalOrganizationId: usOrg.id,
  parentRecipientId: euProcessor.id,
  hierarchyType: 'PROCESSOR_CHAIN',
})

// Test cross-border assessment
const transferAssessment = await assessCrossBorderTransfers(euProcessor.id, org.id)
expect(transferAssessment).toHaveLength(2)
const countryNames = transferAssessment.map((t) => t.country.name)
expect(countryNames).toContain('Netherlands')
expect(countryNames).toContain('United States')

// Cleanup
await cleanupTestRecipients([euProcessor.id, usSubProcessor.id])
await cleanupTestExternalOrganizations([euOrg.id, usOrg.id])
await prisma.country.deleteMany({
  where: { id: { in: [euCountry.id, thirdCountry.id] } },
})
```

### Scenario 4: Testing Multi-Tenancy Isolation

```typescript
// Setup - Create two organizations
const { org: org1 } = await createTestOrganization({ slug: 'tenant-1' })
const { org: org2 } = await createTestOrganization({ slug: 'tenant-2' })
const externalOrg = await createTestExternalOrganization({ legalName: 'Shared Vendor' })

// Create identical chains in both orgs
const org1Chain = await createTestRecipientHierarchy(org1.id, 3, 'PROCESSOR_CHAIN', {
  externalOrganizationId: externalOrg.id,
})
const org2Chain = await createTestRecipientHierarchy(org2.id, 3, 'PROCESSOR_CHAIN', {
  externalOrganizationId: externalOrg.id,
})

// Test tenant isolation in descendant tree
const org1Tree = await getDescendantTree(org1Chain[0].id, org1.id, 10)
const org2Tree = await getDescendantTree(org2Chain[0].id, org2.id, 10)

// Verify no cross-tenant leakage
expect(org1Tree.every((r) => r.organizationId === org1.id)).toBe(true)
expect(org2Tree.every((r) => r.organizationId === org2.id)).toBe(true)

// Cleanup
await cleanupTestRecipients([...org1Chain.map((r) => r.id), ...org2Chain.map((r) => r.id)])
await cleanupTestExternalOrganizations([externalOrg.id])
await cleanupTestOrganizations([org1.id, org2.id])
```

## Cleanup Patterns for Test Isolation

### Cleanup Order Matters

Due to foreign key constraints, cleanup must follow the correct order:

```typescript
// Correct order (children before parents, referencing tables before referenced):
await cleanupTestRecipients([recipient.id]) // References externalOrganization
await cleanupTestAgreements([agreement.id]) // References externalOrganization
await cleanupTestExternalOrganizations([externalOrg.id]) // Referenced by recipients and agreements
await cleanupTestOrganizations([org.id]) // Referenced by recipients
```

### Cleanup in beforeAll/afterAll

For shared test data across multiple tests:

```typescript
let org: Organization
let externalOrg: ExternalOrganization
let recipientsToCleanup: string[] = []

beforeAll(async () => {
  const { org: testOrg } = await createTestOrganization({ slug: 'shared-org' })
  org = testOrg
  externalOrg = await createTestExternalOrganization({ legalName: 'Shared Vendor' })
})

afterAll(async () => {
  // Cleanup test data created across all tests
  await cleanupTestRecipients(recipientsToCleanup)
  await cleanupTestExternalOrganizations([externalOrg.id])
  await cleanupTestOrganizations([org.id])
})

it('test 1', async () => {
  const recipient = await createTestRecipient(org.id, {
    /* ... */
  })
  recipientsToCleanup.push(recipient.id)
  // Test logic...
})

it('test 2', async () => {
  const recipient = await createTestRecipient(org.id, {
    /* ... */
  })
  recipientsToCleanup.push(recipient.id)
  // Test logic...
})
```

### Cleanup in Individual Tests

For test-specific data:

```typescript
it('should handle processor chain', async () => {
  const externalOrg = await createTestExternalOrganization({ legalName: 'Test Org' })

  try {
    const chain = await createTestRecipientHierarchy(org.id, 3, 'PROCESSOR_CHAIN', {
      externalOrganizationId: externalOrg.id,
    })

    // Test logic...

    // Cleanup on success
    await cleanupTestRecipients(chain.map((r) => r.id))
    await cleanupTestExternalOrganizations([externalOrg.id])
  } catch (error) {
    // Cleanup on error
    await cleanupTestExternalOrganizations([externalOrg.id])
    throw error
  }
})
```

## Running Tests

```bash
# Run all integration tests
pnpm test:integration

# Run specific test file
pnpm vitest run __tests__/integration/dal/recipients.integration.test.ts

# Run tests in watch mode
pnpm vitest watch __tests__/integration/dal/recipients.integration.test.ts

# Run only recipient-related tests
pnpm vitest run __tests__/integration/dal/recipients*.integration.test.ts

# Run with coverage
pnpm test:integration --coverage
```

## Best Practices

### 1. Use Unique Test Data

```typescript
// Good: Unique slug to avoid conflicts
const { org } = await createTestOrganization({
  slug: `test-org-${Date.now()}`,
})

// Better: Descriptive and unique
const { org } = await createTestOrganization({
  slug: 'test-processor-chain-validation',
})
```

### 2. Test Real Database Behavior

```typescript
// Good: Test actual persistence and retrieval
const created = await createRecipient({
  /* data */
})
const retrieved = await getRecipientById(created.id)
expect(retrieved?.name).toBe(created.name)

// Bad: Don't mock Prisma in integration tests
const mockPrisma = vi.fn() // ❌ This defeats the purpose
```

### 3. Test Multi-Tenancy

```typescript
// Always verify tenant isolation
const org1Recipient = await createTestRecipient(org1.id, {
  /* ... */
})
const org2Recipient = await createTestRecipient(org2.id, {
  /* ... */
})

// Verify org1 cannot access org2's data
const result = await getRecipientByIdForOrg(org1Recipient.id, org2.id)
expect(result).toBeNull()
```

### 4. Test Edge Cases

```typescript
// Test hierarchy depth limits
const chain = await createTestRecipientHierarchy(org.id, 6, 'PROCESSOR_CHAIN', {
  externalOrganizationId: externalOrg.id,
})
const validation = await validateRecipientHierarchy(
  chain[5].id,
  'SUB_PROCESSOR',
  chain[4].id,
  org.id
)
expect(validation.isValid).toBe(false) // Exceeds maxDepth=5

// Test circular references
const parent = await createTestRecipient(org.id, {
  /* ... */
})
const child = await createTestRecipient(org.id, {
  parentRecipientId: parent.id,
  /* ... */
})
const circularCheck = await checkCircularReference(parent.id, child.id, org.id)
expect(circularCheck).toBe(true) // Would create cycle
```

### 5. Clean Up Properly

```typescript
// Good: Clean up in correct order
await cleanupTestRecipients([recipient.id])
await cleanupTestExternalOrganizations([externalOrg.id])
await cleanupTestOrganizations([org.id])

// Good: Use try/catch for cleanup on errors
try {
  // Test logic...
} catch (error) {
  // Cleanup even if test fails
  await cleanupTestRecipients([recipient.id])
  throw error
}
```

## Test Database Configuration

Integration tests use a separate test database configured in `.env.test`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/compilothq_test?sslmode=prefer"
```

The test database is:

- Automatically created if it doesn't exist
- Migrated to the latest schema before tests run
- Isolated from development and production databases
- Cleaned between test files for isolation

## Writing New Integration Tests

When adding new DAL functions or features:

1. **Create test file** in appropriate directory:
   - `/dal/` for Data Access Layer functions
   - `/validation/` for validation logic
   - `/workflows/` for end-to-end user workflows

2. **Use factories** for all test data creation

3. **Follow patterns** from existing tests

4. **Test critical paths**:
   - Happy path (expected usage)
   - Edge cases (depth limits, circular refs)
   - Error cases (invalid data, missing refs)
   - Multi-tenancy isolation

5. **Document complex scenarios** with comments

6. **Clean up properly** to maintain test isolation

## Additional Resources

- **Factory Code**: `/packages/database/src/test-utils/factories/`
- **DAL Functions**: `/packages/database/src/dal/`
- **Validation Logic**: `/packages/database/src/validation/`
- **Database Package README**: `/packages/database/README.md`
