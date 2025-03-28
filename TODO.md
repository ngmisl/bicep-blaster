# TODO

## Short Term

- [ ] Fix resume button?
- [ ] Weight Selector
- [ ] History

## Core Architecture & Zero-Knowledge Verification

- [ ] Implement Trusted Execution Environment (TEE) integration (e.g., OP-TEE or Intel SGX).
- [ ] Develop TEE module to securely access raw GPS/Wi-Fi/cell data.
- [ ] Encrypt and store gym geofence coordinates within the TEE.
- [ ] Integrate a ZKP library (e.g., Circom/SnarkJS) to generate proofs of gym presence.
- [ ] Design ZKP circuit to verify:
  - User is within a gym’s geofence.
  - GPS data is genuine (no spoofing).
  - Timestamp aligns with gym operating hours.

## Frontend (PWA) Development

- [ ] Build "Claim Reward" UI component.
- [ ] Implement Geolocation API to trigger TEE/ZKP process on claim.
- [ ] Add QR code scanner (optional) for gym partnerships.
- [ ] Ensure all data transmission uses HTTPS encryption.

## Backend Development

- [ ] Set up ZKP verification server to validate proofs without exposing user data.
- [ ] Create reward issuance logic (e.g., token minting via blockchain).
- [ ] Maintain encrypted gym geofence database (coordinates and radii).
- [ ] Implement anti-spoofing checks (satellite count, Wi-Fi consistency, etc.).

## Geofence & Gym Data

- [ ] Populate encrypted geofence database with gym coordinates (partner with gyms or use third-party APIs).
- [ ] Develop backend endpoint to securely update geofence data via TEE.

## Security & Anti-Spoofing

- [ ] Implement TEE-based anti-spoofing checks (GPS consistency, time validation).
- [ ] Add device fingerprinting to detect suspicious patterns.
- [ ] Implement IP geolocation cross-check (e.g., via IPAPI.co).
- [ ] Set up rate-limiting for claims per user.

## Blockchain Integration (Optional)

- [ ] Deploy smart contract for tamper-proof reward logging (e.g., Ethereum Polygon).
- [ ] Link ZKP verification to blockchain transactions (e.g., mint tokens on valid claims).

## Testing & Validation

- [ ] Test GPS spoofing scenarios (e.g., Fake GPS apps) to ensure detection.
- [ ] Validate ZKP generation and verification end-to-end.
- [ ] Perform penetration testing for backend vulnerabilities.
- [ ] Test QR code scanning workflow with partner gyms.

## Deployment & CI/CD

- [ ] Set up CI/CD pipeline for TEE/PWA/backend updates.
- [ ] Deploy backend on a secure cloud server (e.g., AWS, Google Cloud).
- [ ] Publish PWA to a HTTPS-enabled domain.

## Documentation & Compliance

- [ ] Write end-user privacy policy emphasizing zero-data collection.
- [ ] Document TEE/ZKP implementation details for auditors.
- [ ] Create developer documentation for gym partnerships (QR code setup, geofence updates).

## Optional Enhancements

- [ ] Integrate Bluetooth beacon systems for gym verification (e.g., iBeacon).
- [ ] Add support for gyms to self-report their locations via a portal.
- [ ] Implement blockchain-based audit logs for reward claims.

---

### Notes:
- Prioritize TEE/ZKP implementation first to ensure core security.
- Conduct regular security audits for zero-day vulnerabilities.
- Always validate third-party APIs (e.g., geolocation services) for compliance with zero-knowledge requirements.