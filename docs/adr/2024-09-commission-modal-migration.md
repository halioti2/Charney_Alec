# ADR: Commission Modal Migration Strategy

- **Date:** 2024-09-09
- **Context:** Migrating the legacy commission modal from DOM scripting to a React implementation while preparing for Supabase integration.

## Decision

- Model a canonical `CommissionRecord` by joining Supabase `transactions`, `agents`, `brokerages`, and `commission_evidences`.
- Add a new `transaction_events` table to persist audit trail entries that feed the broker panel/modal history.  
- Build dedicated React components for the modal (email chain, calculation form, actions, TRID view) and manage state through `DashboardContext`.  
- Maintain existing commission math via shared helper functions; future components can reuse them.  
- Keep modal actions mocked until Supabase RPC endpoints exist, but design handlers to swap in real calls.  
- Preserve printable TRID output using a React component rendered from the same data source.

## Consequences

- The dashboard can swap from mock data to Supabase with minimal UI changes.  
- Legacy modal code in `initLegacyDashboard` will be retired once React components replace it.  
- Audit history requires new backend support; until then, UI will rely on mock data.  
- Future features (real-time updates, multi-user editing) can hook into context state without large refactors.
