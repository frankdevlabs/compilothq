/**
 * Test factory for RecipientProcessingLocation entities
 *
 * RecipientProcessingLocation tracks WHERE a recipient processes data
 * for cross-border transfer detection and GDPR Article 44-46 compliance.
 *
 * Usage:
 *   // Create a simple processing location
 *   const location = await createTestRecipientProcessingLocation({
 *     organizationId: org.id,
 *     recipientId: recipient.id,
 *     countryId: country.id,
 *   })
 *
 *   // Create EU org with US processor (cross-border transfer scenario)
 *   const scenario = await createEuToUsTransferScenario()
 *   // Returns: { org, recipient, location, usCountry, sccMechanism }
 *
 *   // Create processor chain with multiple locations
 *   const chain = await createProcessorChainScenario(org.id, 3)
 *   // Returns: { processor, subProcessors, locations }
 */

import type { LocationRole, RecipientProcessingLocation } from "../../index";
import { type Prisma, prisma } from "../../index";
import { createTestOrganization } from "./organizationFactory";
import {
	createTestRecipient,
	createTestRecipientHierarchy,
} from "./recipientFactory";

let sequenceNumber = 0;

/**
 * Create a test recipient processing location with sensible defaults
 *
 * @param overrides - Partial location data to override defaults
 * @returns Promise<RecipientProcessingLocation>
 *
 * @example
 * ```typescript
 * // Create a simple EU location
 * const location = await createTestRecipientProcessingLocation({
 *   organizationId: org.id,
 *   recipientId: recipient.id,
 *   countryId: euCountry.id,
 *   locationRole: 'PROCESSING',
 * })
 *
 * // Create US location with transfer mechanism
 * const usLocation = await createTestRecipientProcessingLocation({
 *   organizationId: org.id,
 *   recipientId: recipient.id,
 *   countryId: usCountry.id,
 *   transferMechanismId: sccMechanism.id,
 *   service: 'Email delivery via US data center',
 * })
 * ```
 */
export async function createTestRecipientProcessingLocation(overrides: {
	organizationId: string;
	recipientId: string;
	countryId: string;
	service?: string;
	locationRole?: LocationRole;
	purposeId?: string | null;
	purposeText?: string | null;
	transferMechanismId?: string | null;
	isActive?: boolean;
	metadata?: Prisma.InputJsonValue;
}): Promise<RecipientProcessingLocation> {
	sequenceNumber++;

	const defaults = {
		service: overrides.service ?? `Processing Service ${sequenceNumber}`,
		locationRole: (overrides.locationRole ?? "PROCESSING") as LocationRole,
		purposeId: overrides.purposeId ?? null,
		purposeText: overrides.purposeText ?? null,
		transferMechanismId: overrides.transferMechanismId ?? null,
		isActive: overrides.isActive ?? true,
		metadata: overrides.metadata ?? undefined,
	};

	return await prisma.recipientProcessingLocation.create({
		data: {
			organizationId: overrides.organizationId,
			recipientId: overrides.recipientId,
			countryId: overrides.countryId,
			...defaults,
		},
	});
}

/**
 * Create a complete EU-to-US cross-border transfer scenario for testing
 *
 * Sets up:
 * - EU organization (France)
 * - US country (third country)
 * - Recipient (processor)
 * - US processing location with SCC mechanism
 *
 * @returns Promise with complete scenario entities
 *
 * @example
 * ```typescript
 * const { org, recipient, location, usCountry, sccMechanism } = await createEuToUsTransferScenario()
 *
 * // Now you can test cross-border transfer detection
 * const transfers = await detectCrossBorderTransfers(org.id)
 * expect(transfers).toHaveLength(1)
 * expect(transfers[0].transferRisk.level).toBe('MEDIUM') // Safeguards in place
 * ```
 */
export async function createEuToUsTransferScenario(): Promise<{
	org: Awaited<ReturnType<typeof createTestOrganization>>["org"];
	recipient: Awaited<ReturnType<typeof createTestRecipient>>;
	location: RecipientProcessingLocation;
	euCountry: Awaited<ReturnType<typeof prisma.country.create>>;
	usCountry: Awaited<ReturnType<typeof prisma.country.create>>;
	sccMechanism: Awaited<ReturnType<typeof prisma.transferMechanism.create>>;
}> {
	// Create or find EU country (France)
	let euCountry = await prisma.country.findFirst({
		where: { isoCode: "FR" },
	});

	euCountry ??= await prisma.country.create({
		data: {
			name: "France",
			isoCode: "FR",
			isoCode3: "FRA",
			gdprStatus: ["EU", "EEA"],
			isActive: true,
		},
	});

	// Create or find US country (third country)
	let usCountry = await prisma.country.findFirst({
		where: { isoCode: "US" },
	});

	if (!usCountry) {
		usCountry = await prisma.country.create({
			data: {
				name: "United States",
				isoCode: "US",
				isoCode3: "USA",
				gdprStatus: ["Third Country"],
				isActive: true,
			},
		});
	}

	// Create or find SCC transfer mechanism
	let sccMechanism = await prisma.transferMechanism.findFirst({
		where: { code: "SCC" },
	});

	if (!sccMechanism) {
		sccMechanism = await prisma.transferMechanism.create({
			data: {
				code: "SCC",
				name: "Standard Contractual Clauses",
				category: "SAFEGUARD",
				description:
					"EU Commission approved standard contractual clauses for third-country transfers",
				typicalUseCase: "Third-country transfers with appropriate safeguards",
				gdprArticle: "Article 46(2)(c)",
				isDerogation: false,
				requiresAdequacy: false,
				requiresDocumentation: true,
				isActive: true,
			},
		});
	}

	// Create test organization
	const { org } = await createTestOrganization({
		slug: `test-eu-org-${Date.now()}`,
	});

	// Create recipient
	const recipient = await createTestRecipient(org.id, {
		name: "US Processor",
		type: "PROCESSOR",
	});

	// Create US processing location with SCC mechanism
	const location = await createTestRecipientProcessingLocation({
		organizationId: org.id,
		recipientId: recipient.id,
		countryId: usCountry.id,
		transferMechanismId: sccMechanism.id,
		service: "Email delivery via US data center",
		locationRole: "BOTH",
	});

	return { org, recipient, location, euCountry, usCountry, sccMechanism };
}

/**
 * Create a processor chain scenario with multiple locations for testing
 *
 * Sets up:
 * - Parent processor with EU location
 * - N sub-processors with various locations (EU, US with SCC, etc.)
 * - Complete hierarchy with processing locations at each level
 *
 * @param organizationId - The organization ID to create recipients under
 * @param chainLength - Number of sub-processors to create (default: 2)
 * @returns Promise with processor hierarchy and locations
 *
 * @example
 * ```typescript
 * const { processor, subProcessors, locations } = await createProcessorChainScenario(org.id, 2)
 *
 * // Verify hierarchy traversal includes all locations
 * const locationsWithChain = await getLocationsWithParentChain(subProcessors[1].id, org.id)
 * expect(locationsWithChain).toHaveLength(3) // Sub-processor + parent + grandparent
 * ```
 */
export async function createProcessorChainScenario(
	organizationId: string,
	chainLength: number = 2,
): Promise<{
	processor: Awaited<ReturnType<typeof createTestRecipient>>;
	subProcessors: Awaited<ReturnType<typeof createTestRecipient>>[];
	locations: RecipientProcessingLocation[];
}> {
	// Get or create test countries
	let euCountry = await prisma.country.findFirst({
		where: { isoCode: "FR" },
	});

	euCountry ??= await prisma.country.create({
		data: {
			name: "France",
			isoCode: "FR",
			isoCode3: "FRA",
			gdprStatus: ["EU", "EEA"],
			isActive: true,
		},
	});

	let usCountry = await prisma.country.findFirst({
		where: { isoCode: "US" },
	});

	if (!usCountry) {
		usCountry = await prisma.country.create({
			data: {
				name: "United States",
				isoCode: "US",
				isoCode3: "USA",
				gdprStatus: ["Third Country"],
				isActive: true,
			},
		});
	}

	// Get or create SCC mechanism
	let sccMechanism = await prisma.transferMechanism.findFirst({
		where: { code: "SCC" },
	});

	if (!sccMechanism) {
		sccMechanism = await prisma.transferMechanism.create({
			data: {
				code: "SCC",
				name: "Standard Contractual Clauses",
				category: "SAFEGUARD",
				description: "EU Commission approved standard contractual clauses",
				typicalUseCase: "Third-country transfers with appropriate safeguards",
				gdprArticle: "Article 46(2)(c)",
				isDerogation: false,
				requiresAdequacy: false,
				requiresDocumentation: true,
				isActive: true,
			},
		});
	}

	// Create processor hierarchy
	const hierarchy = await createTestRecipientHierarchy(
		organizationId,
		chainLength + 1,
		"PROCESSOR_CHAIN",
	);
	const processor = hierarchy[0]!;
	const subProcessors = hierarchy.slice(1);

	// Create locations for each level in hierarchy
	const locations: RecipientProcessingLocation[] = [];

	// Parent processor: EU location
	const processorLocation = await createTestRecipientProcessingLocation({
		organizationId,
		recipientId: processor.id,
		countryId: euCountry.id,
		service: "Parent processor EU service",
		locationRole: "PROCESSING",
	});
	locations.push(processorLocation);

	// Sub-processors: Alternate between EU and US locations
	for (let i = 0; i < subProcessors.length; i++) {
		// eslint-disable-next-line security/detect-object-injection
		const subProcessor = subProcessors[i]!;
		const isUsLocation = i % 2 === 0; // Alternate: US, EU, US, ...

		const subProcessorLocation = await createTestRecipientProcessingLocation({
			organizationId,
			recipientId: subProcessor.id,
			countryId: isUsLocation ? usCountry.id : euCountry.id,
			transferMechanismId: isUsLocation ? sccMechanism.id : null,
			service: `Sub-processor ${i + 1} ${isUsLocation ? "US" : "EU"} service`,
			locationRole: "BOTH",
		});
		locations.push(subProcessorLocation);
	}

	return { processor, subProcessors, locations };
}
