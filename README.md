# zk-qrcode

A QR code-based distributed anonymous credential system using zero-knowledge proofs.

Prove claims about yourself (age, driving licence, profession) **without revealing personal data** — by scanning a QR code containing a ZK-SNARK proof.

> For the full academic treatment, see the [project manuscript](https://github.com/Yue-Zhou1/zk-qrcode/blob/main/zk_qrcode_full.pdf).

---

## How It Works

A user generates a QR code on their phone that embeds a cryptographic proof of a specific claim (e.g. "I am over 18"). A verifier scans the QR code and confirms the claim is valid — without ever seeing the user's actual date of birth or identity details.

The system uses a **two-step verification process**:

1. **Identity authentication** — Merkle tree proof confirms the user exists in the trusted credential set
2. **Claim validation** — Plonk range proof verifies the specific claim (e.g. `age >= 18`) without revealing the underlying value

### What's in the QR code?

| Field | Description |
|-------|-------------|
| **Transcript** | Plonk commitments (elliptic curve points) and field elements for verification |
| **Protocol** | Proof system identifier (e.g. `plonk`) |
| **Curve** | Elliptic curve used (e.g. `bn128`) |
| **Public signals** | Public parameters for the verifier |
| **Merkle proof** | Path proving the user's membership in the credential set |

### Supported Claims

| Claim | What it proves | Threshold |
|-------|---------------|-----------|
| `age` | User's age meets minimum | >= 18 |
| `drive` | Driving qualification level | >= 2 |

---

## Architecture

```
                  ┌─────────────┐
                  │   MongoDB   │
                  │ (users &    │
                  │  Merkle     │
                  │  trees)     │
                  └──────┬──────┘
                         │
┌───────────┐      ┌──────┴──────┐      ┌──────────────┐
│  Mobile   │◄────►│   Express   │◄────►│  ZK Circuit  │
│  App      │ API  │   Backend   │      │  (Circom +   │
│ (Expo/RN) │      │ (TypeScript)│      │   snarkjs)   │
└───────────┘      └─────────────┘      └──────────────┘
```

**Backend** — Express.js + TypeScript API that handles proof generation, verification, and MongoDB persistence

**ZK Circuit** — Circom `GreaterEqThan` circuit compiled to WASM, with Plonk proving/verification via snarkjs

**Mobile** — React Native (Expo) app with two roles: **User** (generate proof QR codes) and **Verifier** (scan and verify)

### Cryptographic Details

- **Proof system**: Plonk (with Groth16 as alternative)
- **Elliptic curve**: alt-BabyJubjub BN128
- **Hash function**: Poseidon (for Plonk challenges), SHA-256 (for Merkle tree)
- **Security parameter**: λ = 128

---

## Diagrams

> **a.** Converting a real-world problem into a zk-SNARK proof within the zk-qrcode framework
![lowlevel](https://github.com/user-attachments/assets/01d3ad5a-214c-42f9-a528-447094f6a39b)

> **b.** Privacy-preserving access criteria verification via QR code
![workflow](https://github.com/user-attachments/assets/ec1edf33-b29c-4339-a3e0-5d6a65d764f3)

> **c.** Example QR code containing a Plonk age proof generated before entering a bar
![ageproof](https://github.com/user-attachments/assets/d521c8bc-1d97-42f1-9603-50a6f6c12743)

---

## Getting Started

### Prerequisites

- Node.js (>= 16)
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- [Circom](https://docs.circom.io/getting-started/installation/) (only needed to regenerate ZK artifacts)

### Backend

```bash
cp .env.example .env          # configure MongoDB URI and ZK file paths
npm install
npm run dev                    # development (TypeScript via tsx)
```

For production:

```bash
npm run build                  # minified bundle via esbuild
npm run start:prod             # node dist/server.js
```

### Mobile App

```bash
cp mobile/.env.example mobile/.env
# set EXPO_PUBLIC_API_URL to your backend address

cd mobile
npm install
npm run start                  # Expo dev client
npm run android                # or: npm run ios / npm run web
```

### Reproducing ZK Artifacts

The runtime requires three files in `controllers/`: `circuit.wasm`, `circuit_final.zkey`, and `verification_key.json`. These are checked into the repo, but to regenerate from source:

```bash
# requires: circom CLI + Node.js
./scripts/zk/reproduce-runtime-artifacts.sh
```

The circuit source is at [`controllers/circuit.circom`](controllers/circuit.circom).

---

## API Reference

### v1 Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/proofs` | Generate a ZK proof for a claim |
| `POST` | `/api/v1/proofs/verify` | Verify a claim proof from QR data |
| `POST` | `/api/v1/identity-qr` | Generate an identity Merkle root QR |
| `POST` | `/api/v1/identity-qr/verify` | Verify user identity via Merkle root |
| `GET`  | `/api/v1/health` | Health check |

### Legacy Routes

Backward-compatible endpoints: `/cp`, `/vp`, `/cmt`, `/vmt`

---

## Project Structure

```
zk-qrcode/
├── app.ts                     # Express server entry point
├── controllers/
│   ├── circuit.circom         # Circom circuit source
│   ├── circuit.wasm           # Compiled circuit (WASM)
│   ├── circuit_final.zkey     # Plonk proving key
│   ├── verification_key.json  # Plonk verification key
│   └── qrcZk.ts              # Proof generation & Merkle logic
├── routes/
│   └── routes.ts              # API route definitions
├── server/
│   ├── config.ts              # Environment & path configuration
│   ├── db.ts                  # MongoDB operations & claim definitions
│   ├── http.ts                # Error handling middleware
│   └── payloads.ts            # Proof/root payload serialization
├── mobile/
│   ├── screens/               # RN screens (User, Home, Auth, Verify)
│   ├── services/apiClient.js  # Centralized API client
│   └── App.js                 # Navigation root
├── scripts/
│   ├── build-server.mjs       # esbuild production config
│   └── zk/                    # ZK setup automation
└── types/
    └── ambient.d.ts           # TypeScript declarations
```

---

## Key Dependencies

| Library | Purpose |
|---------|---------|
| [snarkjs](https://github.com/iden3/snarkjs) | ZK proof generation & verification (Plonk, Groth16) |
| [merkletreejs](https://github.com/merkletreejs/merkletreejs) | Merkle tree construction & proof generation |
| [MongoDB](https://www.mongodb.com/) | User credential & Merkle tree storage |
| [Expo](https://expo.dev/) | Cross-platform mobile development |
| [expo-camera](https://docs.expo.dev/versions/latest/sdk/camera/) | QR code scanning |

---

## License

[MIT](LICENSE)
