# Personal Data Category Model

**Feature Name**: Personal Data Category Model

**Size**: S (Small)

## Description

Implement DataCategory model with name, description, sensitivity levels (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED, NORMAL), special category flags (isSpecialCategory) for Article 9 data, example data fields array, references to DataNature for automatic GDPR classification, and audit timestamps; add indexes on sensitivity and isSpecialCategory; create migrations and test to enable automatic special category data detection and legal basis validation.
