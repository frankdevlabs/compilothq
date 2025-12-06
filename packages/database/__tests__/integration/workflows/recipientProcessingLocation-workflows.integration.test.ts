import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
	createRecipientProcessingLocation,
	deactivateRecipientProcessingLocation,
	getActiveLocationsForRecipient,
	getAllLocationsForRecipient,
	getLocationsWithParentChain,
	moveRecipientProcessingLocation,
	prisma,
	updateRecipientProcessingLocation,
} from "../../../src/index";
import {
	cleanupTestOrganizations,
	createEuToUsTransferScenario,
	createProcessorChainScenario,
	createTestOrganization,
	createTestRecipient,
	createTestRecipientProcessingLocation,
} from "../../../src/test-utils/factories";

/**
 * Integration tests for RecipientProcessingLocation end-to-end workflows
 *
 * Tests complex scenarios that combine multiple operations:
 * - Complete lifecycle: create → update → move → deactivate → verify history
 * - Cross-border transfer scenarios: EU org with US processor
 * - Hierarchy traversal: processor chains with multiple locations
 * - Error paths: validation failures, missing entities, cross-org security
 * - Edge cases: deactivated locations, null purposes, empty ancestor chains
 *
 * Limit: 10 strategic tests maximum
 */
describe("RecipientProcessingLocation Workflows", () => {
	const testOrgIds: string[] = [];

	beforeAll(async () => {
		// Cleanup is handled per-test for isolation
	});

	afterAll(async () => {
		await cleanupTestOrganizations(testOrgIds);
	});

	describe("Complete location lifecycle", () => {
		it("should handle full lifecycle: create → move → verify history", async () => {
			// Arrange - Set up organization, recipient, countries
			const { org } = await createTestOrganization({
				slug: `lifecycle-${Date.now()}`,
			});
			testOrgIds.push(org.id);

			const recipient = await createTestRecipient(org.id, {
				name: "Lifecycle Test Processor",
				type: "PROCESSOR",
			});

			let euCountry = await prisma.country.findFirst({
				where: { isoCode: "FR" },
			});
			if (!euCountry) {
				euCountry = await prisma.country.create({
					data: {
						name: "France",
						isoCode: "FR",
						isoCode3: "FRA",
						gdprStatus: ["EU", "EEA"],
						isActive: true,
					},
				});
			}

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

			// Act 1: Create initial EU location
			const originalLocation = await createRecipientProcessingLocation({
				organizationId: org.id,
				recipientId: recipient.id,
				service: "Original EU service",
				countryId: euCountry.id,
				locationRole: "PROCESSING",
			});

			expect(originalLocation.isActive).toBe(true);
			expect(originalLocation.countryId).toBe(euCountry.id);

			// Act 2: Move to US
			const movedLocation = await moveRecipientProcessingLocation(
				originalLocation.id,
				{
					countryId: usCountry.id,
					service: "Moved to US service",
				},
			);

			expect(movedLocation.id).not.toBe(originalLocation.id); // New record created
			expect(movedLocation.countryId).toBe(usCountry.id);
			expect(movedLocation.isActive).toBe(true);

			// Assert 1: Original location deactivated
			const allLocations = await getAllLocationsForRecipient(recipient.id);
			const deactivatedOriginal = allLocations.find(
				(l) => l.id === originalLocation.id,
			);
			expect(deactivatedOriginal?.isActive).toBe(false);

			// Assert 2: Active locations only include moved location
			const activeLocations = await getActiveLocationsForRecipient(
				recipient.id,
			);
			expect(activeLocations).toHaveLength(1);
			expect(activeLocations[0]?.id).toBe(movedLocation.id);

			// Assert 3: Historical query includes both
			expect(allLocations).toHaveLength(2);
			const activeIds = allLocations.filter((l) => l.isActive).map((l) => l.id);
			const inactiveIds = allLocations
				.filter((l) => !l.isActive)
				.map((l) => l.id);
			expect(activeIds).toContain(movedLocation.id);
			expect(inactiveIds).toContain(originalLocation.id);
		});
	});

	describe("Cross-border transfer scenarios", () => {
		it("should reject EU→US location without transfer mechanism", async () => {
			// Arrange - Set up EU organization and US location
			let euCountry = await prisma.country.findFirst({
				where: { isoCode: "FR" },
			});
			if (!euCountry) {
				euCountry = await prisma.country.create({
					data: {
						name: "France",
						isoCode: "FR",
						isoCode3: "FRA",
						gdprStatus: ["EU", "EEA"],
						isActive: true,
					},
				});
			}

			const { org } = await createTestOrganization({
				slug: `eu-us-reject-${Date.now()}`,
				headquartersCountryId: euCountry.id,
			});
			testOrgIds.push(org.id);

			const recipient = await createTestRecipient(org.id, {
				name: "US Processor Without Mechanism",
				type: "PROCESSOR",
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

			// Act & Assert - Should reject EU→US transfer without mechanism
			await expect(
				createRecipientProcessingLocation({
					organizationId: org.id,
					recipientId: recipient.id,
					service: "US data center",
					countryId: usCountry.id,
					locationRole: "HOSTING",
					// No transferMechanismId - should FAIL validation
				})
			).rejects.toThrow(/transfer mechanism required/i);
		});

		it("should allow EU→US location with transfer mechanism", async () => {
			// Arrange
			const scenario = await createEuToUsTransferScenario();
			testOrgIds.push(scenario.org.id);

			// Assert - Location created successfully
			expect(scenario.location).toBeDefined();
			expect(scenario.location.countryId).toBe(scenario.usCountry.id);
			expect(scenario.location.transferMechanismId).toBe(
				scenario.sccMechanism.id,
			);
			expect(scenario.location.service).toBe(
				"Email delivery via US data center",
			);
		});
	});

	describe("Processor chain with locations", () => {
		it("should include parent locations when traversing hierarchy", async () => {
			// Arrange - Create processor chain with 3 levels
			const { org } = await createTestOrganization({
				slug: `chain-${Date.now()}`,
			});
			testOrgIds.push(org.id);

			const { processor, subProcessors, locations } =
				await createProcessorChainScenario(org.id, 2);

			expect(locations).toHaveLength(3); // Parent + 2 sub-processors

			// Act - Get locations with parent chain from bottom of hierarchy
			const bottomSubProcessor = subProcessors[1]!;
			const locationsWithChain = await getLocationsWithParentChain(
				bottomSubProcessor.id,
				org.id,
			);

			// Assert - All 3 levels included
			expect(locationsWithChain).toHaveLength(3);

			// Verify depth annotations
			const depths = locationsWithChain.map((l) => l.depth).sort();
			expect(depths).toEqual([0, 1, 2]); // Bottom (0), middle (1), top (2)

			// Verify all recipients in chain
			const recipientIds = locationsWithChain.map((l) => l.recipientId);
			expect(recipientIds).toContain(bottomSubProcessor.id); // Depth 0
			expect(recipientIds).toContain(subProcessors[0]!.id); // Depth 1
			expect(recipientIds).toContain(processor.id); // Depth 2
		});
	});

	describe("Error paths and validation", () => {
		it("should reject location for recipient in different organization", async () => {
			// Arrange - Create two separate organizations
			const { org: org1 } = await createTestOrganization({
				slug: `org1-${Date.now()}`,
			});
			const { org: org2 } = await createTestOrganization({
				slug: `org2-${Date.now()}`,
			});
			testOrgIds.push(org1.id, org2.id);

			const recipient = await createTestRecipient(org1.id, {
				name: "Org1 Recipient",
				type: "PROCESSOR",
			});

			let euCountry = await prisma.country.findFirst({
				where: { isoCode: "FR" },
			});
			if (!euCountry) {
				euCountry = await prisma.country.create({
					data: {
						name: "France",
						isoCode: "FR",
						isoCode3: "FRA",
						gdprStatus: ["EU", "EEA"],
						isActive: true,
					},
				});
			}

			// Act & Assert - Attempt to create location for org1's recipient under org2
			await expect(
				createRecipientProcessingLocation({
					organizationId: org2.id, // WRONG organization
					recipientId: recipient.id, // Belongs to org1
					service: "Cross-org service",
					countryId: euCountry.id,
					locationRole: "PROCESSING",
				}),
			).rejects.toThrow(/does not belong to organization/i);
		});

		it("should reject update to third country without mechanism", async () => {
			// Arrange - Create EU organization with location in EU, attempt update to US
			let euCountry = await prisma.country.findFirst({
				where: { isoCode: "FR" },
			});
			if (!euCountry) {
				euCountry = await prisma.country.create({
					data: {
						name: "France",
						isoCode: "FR",
						isoCode3: "FRA",
						gdprStatus: ["EU", "EEA"],
						isActive: true,
					},
				});
			}

			const { org } = await createTestOrganization({
				slug: `update-reject-${Date.now()}`,
				headquartersCountryId: euCountry.id,
			});
			testOrgIds.push(org.id);

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

			const location = await createTestRecipientProcessingLocation({
				organizationId: org.id,
				recipientId: (await createTestRecipient(org.id, { type: "PROCESSOR" }))
					.id,
				countryId: euCountry.id,
			});

			// Act & Assert - Should reject update to US without mechanism
			await expect(
				updateRecipientProcessingLocation(location.id, {
					countryId: usCountry.id
				})
			).rejects.toThrow(/transfer mechanism required/i);
		});
	});

	describe("Edge cases", () => {
		it("should exclude deactivated locations from active queries", async () => {
			// Arrange
			const { org } = await createTestOrganization({
				slug: `deactivated-${Date.now()}`,
			});
			testOrgIds.push(org.id);

			const recipient = await createTestRecipient(org.id, {
				type: "PROCESSOR",
			});

			let euCountry = await prisma.country.findFirst({
				where: { isoCode: "FR" },
			});
			if (!euCountry) {
				euCountry = await prisma.country.create({
					data: {
						name: "France",
						isoCode: "FR",
						isoCode3: "FRA",
						gdprStatus: ["EU", "EEA"],
						isActive: true,
					},
				});
			}

			const activeLocation = await createTestRecipientProcessingLocation({
				organizationId: org.id,
				recipientId: recipient.id,
				countryId: euCountry.id,
				service: "Active service",
			});

			const toDeactivate = await createTestRecipientProcessingLocation({
				organizationId: org.id,
				recipientId: recipient.id,
				countryId: euCountry.id,
				service: "To be deactivated",
			});

			// Act - Deactivate one location
			await deactivateRecipientProcessingLocation(toDeactivate.id);

			// Assert - Active query excludes deactivated
			const activeLocations = await getActiveLocationsForRecipient(
				recipient.id,
			);
			expect(activeLocations).toHaveLength(1);
			expect(activeLocations[0]?.id).toBe(activeLocation.id);

			// Assert - All query includes both
			const allLocations = await getAllLocationsForRecipient(recipient.id);
			expect(allLocations).toHaveLength(2);
		});

		it("should handle recipient with no parent (empty ancestor chain)", async () => {
			// Arrange - Recipient with no parent
			const { org } = await createTestOrganization({
				slug: `no-parent-${Date.now()}`,
			});
			testOrgIds.push(org.id);

			const recipient = await createTestRecipient(org.id, {
				name: "Standalone Recipient",
				type: "PROCESSOR",
				// No parentRecipientId
			});

			const location = await createTestRecipientProcessingLocation({
				organizationId: org.id,
				recipientId: recipient.id,
				countryId: (await prisma.country.findFirst({
					where: { isoCode: "FR" },
				}))!.id,
			});

			// Act - Get locations with parent chain (should only include self)
			const locationsWithChain = await getLocationsWithParentChain(
				recipient.id,
				org.id,
			);

			// Assert - Only one entry (self, no parents)
			expect(locationsWithChain).toHaveLength(1);
			expect(locationsWithChain[0]?.recipientId).toBe(recipient.id);
			expect(locationsWithChain[0]?.depth).toBe(0);
			expect(locationsWithChain[0]?.locations).toHaveLength(1);
			expect(locationsWithChain[0]?.locations[0]?.id).toBe(location.id);
		});

		it("should handle null purpose fields correctly", async () => {
			// Arrange
			const { org } = await createTestOrganization({
				slug: `null-purpose-${Date.now()}`,
			});
			testOrgIds.push(org.id);

			const recipient = await createTestRecipient(org.id, {
				type: "PROCESSOR",
			});

			// Act - Create location with null purpose fields
			const location = await createTestRecipientProcessingLocation({
				organizationId: org.id,
				recipientId: recipient.id,
				countryId: (await prisma.country.findFirst({
					where: { isoCode: "FR" },
				}))!.id,
				purposeId: null,
				purposeText: null,
			});

			// Assert - Null values stored correctly
			expect(location.purposeId).toBeNull();
			expect(location.purposeText).toBeNull();

			// Assert - Retrieval includes null purpose relation
			const activeLocations = await getActiveLocationsForRecipient(
				recipient.id,
			);
			expect(activeLocations[0]?.purpose).toBeNull();
		});

		it("should handle historical snapshot queries correctly", async () => {
			// Arrange - Create locations at different times
			const { org } = await createTestOrganization({
				slug: `snapshot-${Date.now()}`,
			});
			testOrgIds.push(org.id);

			const recipient = await createTestRecipient(org.id, {
				type: "PROCESSOR",
			});

			let euCountry = await prisma.country.findFirst({
				where: { isoCode: "FR" },
			});
			if (!euCountry) {
				euCountry = await prisma.country.create({
					data: {
						name: "France",
						isoCode: "FR",
						isoCode3: "FRA",
						gdprStatus: ["EU", "EEA"],
						isActive: true,
					},
				});
			}

			// Create first location
			const location1 = await createTestRecipientProcessingLocation({
				organizationId: org.id,
				recipientId: recipient.id,
				countryId: euCountry.id,
				service: "Service v1",
			});

			// Move location (deactivates old, creates new)
			const location2 = await moveRecipientProcessingLocation(location1.id, {
				service: "Service v2",
			});

			// Move again
			const location3 = await moveRecipientProcessingLocation(location2.id, {
				service: "Service v3",
			});

			// Act - Get all locations (historical snapshot)
			const allLocations = await getAllLocationsForRecipient(recipient.id);

			// Assert - All 3 records present (2 inactive, 1 active)
			expect(allLocations).toHaveLength(3);

			const activeCount = allLocations.filter((l) => l.isActive).length;
			const inactiveCount = allLocations.filter((l) => !l.isActive).length;

			expect(activeCount).toBe(1);
			expect(inactiveCount).toBe(2);

			// Assert - Most recent is active
			const mostRecent = allLocations[0]; // Ordered by createdAt desc
			expect(mostRecent?.id).toBe(location3.id);
			expect(mostRecent?.isActive).toBe(true);
		});
	});
});
