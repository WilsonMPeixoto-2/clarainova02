# Archived Migration History

On 2026-04-01, the active migration history under `supabase/migrations/` was reconciled with the
canonical history recorded in the remote Supabase project `jasqctuzeznwdtbcuixn`.

The production project no longer tracks the original 19 incremental migrations from March 2026.
Instead, it records 3 consolidated migrations:

- `20260328230351_clara_foundation_tables_and_indexes.sql`
- `20260329001517_clara_rls_policies_and_search_functions.sql`
- `20260329001619_clara_check_rate_limit_function.sql`

The older incremental files were moved here so the repository preserves the original work history
without leaving stale migrations in the active execution path for fresh environments.

Do not move these archived files back into `supabase/migrations/`.
