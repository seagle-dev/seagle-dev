# Seagle Project Token Optimization Mandates

Adopted from [Caveman](https://github.com/JuliusBrussee/caveman) and [Context7](https://github.com/upstash/context7).

## 1. Response Brevity (Output Optimization)
- **High Signal Only:** Drop filler words, "Okay", "I will", "Successfully".
- **Direct Code:** Provide exact snippets without repeating the entire file unless necessary.
- **Concise Rationale:** 1-2 sentences for technical decisions.
- **Format:** Use fragments, lists, and tables. Avoid prose.

## 2. Context Management (Input Optimization)
- **Compressed Memory:** Keep `CLAUDE.md`, `BEST_PRACTICES.md`, and `GEMINI.md` lean. Remove redundant info.
- **Precision RAG:** Only read the specific parts of a file needed for the task (`start_line`, `end_line`).
- **No Search Bloat:** Avoid broad `grep_search` results. Narrow scope with `include_pattern`.

## 3. Library Precision (Context7 Style)
- **Version Pinning:** Always refer to specific versions used in the project to avoid "reasoning tokens" about API compatibility.
  - **Expo:** 54
  - **React Native:** 0.81
  - **Express:** 5
  - **React:** 19
- **Determinisitc Retrieval:** Use established library patterns (e.g. Supabase for Storage, Firebase for Auth) without re-validating unless a bug is suspected.

## 4. Periodic Pruning
- Weekly: Review and "caveman-compress" project documentation files to remove deprecated info and verbosity.
