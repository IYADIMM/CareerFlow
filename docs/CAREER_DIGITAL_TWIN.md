# Career Digital Twin

The local model contains a stable profile, evidence-labeled skills, and versioned career facts. Facts retain stable identity, category, claim, status, optional source document/quote, lock state, revision number, and prior claim/status history. A supporting quote must occur in the referenced source. Locked facts reject silent edits. Document approval is invalidated when content or referenced evidence changes.

Current statuses map to user provided, imported, user confirmed, derived, suggested, unknown, and conflicting. Only `user_confirmed` facts may enter the deterministic tailoring path; “user confirmed” is not independent verification. Inferred skills never improve the deterministic match score.

The hosted schema adds structured JSON data and categories for employment, responsibilities, achievements, education, certifications, skills, languages, preferences, projects, awards, publications, volunteering, strengths, values, and goals. It stores owner, organization, profile, source, confidence, lock, version, and timestamps.

Gaps: the local editor does not yet expose every structured field (industry, department, P&L, work eligibility, target industry, relocation, compensation), rejected suggestions and conflict resolution need dedicated UI, and the hosted model has not been executed. Account-wide export/deletion is implemented locally; approved-fact-only export remains a product refinement.
