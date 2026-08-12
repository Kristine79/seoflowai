# SEOFlow — Directory Knowledge Base & RAG (Roadmap)

> **STATUS: ROADMAP — NOT IMPLEMENTED.**
>
> Nothing described in this document exists in the codebase yet. It is a proposed future architecture, documented separately from current behavior so the roadmap is **not** confused with the current engine (see `DIRECTORY_ENGINE.md`).

## Vision

The long-term direction is a **Directory Knowledge Base** system built on **Embeddings → RAG → Flow Classification → Reusable workflow selection** that lets SEOFlow learn from every directory it touches:

```
New site
   ↓ analyze structure
   ↓ search for similar previously-processed flows (RAG over the knowledge base)
   ↓ choose a generic workflow
   ↓ human-in-the-loop when necessary
   ↓ result
   ↓ store the new experience back into the knowledge base
```

### Idea
- **Directory Knowledge Base** — a structured store of adapter notes, flow metadata, field mappings, verification patterns, anti-bot situations, and outcomes from previously processed directories.
- **Embeddings** — encode flows/fields/situations into vectors so similar registrations, claim flows, field mappings, verification patterns, anti-bot situations, and successful workflows can be found by similarity.
- **RAG (retrieval-augmented generation)** — retrieve the most similar past experience when a new platform is encountered and use it to pick the best generic workflow and guidance — with human-in-the-loop when confidence is low.
- **Flow Classification** — map a new site structure to a known generic flow pattern.
- **Reusable workflow selection** — pick the best generic workflow with guidance from past experience.

### Important clarifications
- **RAG does not replace browser automation.** Automation (Playwright harness, form filling, submission) stays as-is; RAG would only act as a **memory/retrieval layer** that improves flow selection and guidance.
- Embeddings are proposed to find similar: registration flows, claim flows, field mappings, verification patterns, anti-bot situations, and successful workflows.

## What is needed to implement it (currently absent)

- A persistence layer for the knowledge base (embeddings + metadata).
- An embedding pipeline for existing adapter notes and per-platform run data.
- A retrieval step integrated into the engine (before choosing a workflow).
- A flow classifier to map a new site structure to a known generic pattern.
- Reporting/curation for human-in-the-loop decisions and storing new experience.

## Current state

**Current implementation does not yet include this architecture.**

None of the above is implemented today. The current engine operates per-directory with hardcoded flow logic, adapter `*.md` notes, and a scripted pipeline (see `DIRECTORY_ENGINE.md` and `DIRECTORY_ADAPTERS.md`). Adapter notes are the seed material a future knowledge base would ingest.
