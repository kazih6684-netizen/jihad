# Security Specification - Unity Portal

## Data Invariants
1. A staff member must have a name, category, payment method, and valid number.
2. Only authorized admins (listed in `/admins/`) can perform write operations.
3. Payment methods are restricted to 'bKash', 'Nagad', and 'Rocket'.
4. Staff categories are restricted to a specific set of 6 roles.
5. All staff records must have a `createdBy` field matching the admin's UID.
6. `createdAt` must be set to the server time.

## The Dirty Dozen Payloads (Target: /staff/{staffId})

1. **Identity Spoofing**: Attempt to create a staff member with `createdBy` set to someone else's UID.
2. **Schema Break (Ghost Field)**: Attempt to add an `isVerified: true` field to a staff record.
3. **Invalid Method**: Payment method set to 'PayPal'.
4. **Invalid Category**: Category set to 'CEO'.
5. **Resource Poisoning**: Name string > 500 characters.
6. **ID Poisoning**: Document ID containing malicious script or 5KB of junk.
7. **Unauthenticated Write**: Attempting to create a record without a valid session.
8. **Impersonation**: Authenticated user (non-admin) trying to delete a record.
9. **Update Gap (Immutable Field)**: Attempting to change `createdAt` or `createdBy` on an existing record.
10. **State Shortcutting**: Skipping required fields during creation.
11. **Type Poisoning**: `number` field sent as an integer instead of a string.
12. **PII Leak (Unprotected Read)**: Attempting to list admins if you are not an admin.

## Test Strategy
The `firestore.rules` will be designed to block all the above payloads via:
- `isValidStaffMember` helper for type and size checks.
- `isAdmin` check for all writes.
- `affectedKeys().hasOnly()` for granular update control.
- `allow list` restrictions on sensitive collections.
