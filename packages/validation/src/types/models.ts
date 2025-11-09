// Placeholder types for future Prisma entities

export type ProcessingActivity = {
  id: string
  name: string
  description: string | null
  purpose: string
  legalBasis: string
  createdAt: Date
  updatedAt: Date
  // Future: Add relations and full schema
}

export type DataProcessor = {
  id: string
  name: string
  description: string | null
  contactEmail: string
  contactPhone: string | null
  createdAt: Date
  updatedAt: Date
}

export type PersonalDataCategory = {
  id: string
  name: string
  description: string | null
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH'
  examples: string[]
  createdAt: Date
  updatedAt: Date
}

export type Risk = {
  id: string
  title: string
  description: string
  likelihood: 'LOW' | 'MEDIUM' | 'HIGH'
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  createdAt: Date
  updatedAt: Date
}

export type Control = {
  id: string
  title: string
  description: string
  controlType: 'TECHNICAL' | 'ORGANIZATIONAL'
  effectiveness: 'LOW' | 'MEDIUM' | 'HIGH'
  createdAt: Date
  updatedAt: Date
}
