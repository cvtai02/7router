# Handoff: Initial API Contract

Status: Pending
Direction: Backend to UI
Created: 2026-06-02
Owner: Backend

## Summary

Initial 7router API contract for access-token auth, providers, accounts, file browsing, manual sync, synced files, and settings.

## Context

The UI needs stable backend contracts to implement provider management, file browsing, and manual sync.

## Contract / Requirement

Implement the endpoints documented in the root project setup plan and app module DTOs.

## Files Changed or Expected

- app/src/modules/auth/dtos
- app/src/modules/settings/dtos
- app/src/modules/providers/dtos
- app/src/modules/accounts/dtos
- app/src/modules/files/dtos
- app/src/modules/sync/dtos
- api-clients/src/dtos
- ui/src/pages
- app/src/modules/*/controllers/*.api.ts

## Acceptance Criteria

- [ ] Requirement is implemented.
- [ ] API client is updated, if needed.
- [ ] Relevant `index.md` files are updated.
- [ ] Relevant `rules.md` files are updated, if needed.
- [ ] Smoke test passes, if applicable.

## Notes

The UI must send `Authorization: Bearer <access-token>` to protected endpoints.
