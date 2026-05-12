# SOVR Bridge — Distributed Treasury Ledger

SOVR Bridge is a high-performance, production-ready treasury management platform built on React Native and Expo. It leverages a deterministic accounting engine inspired by **TigerBeetle** to provide a secure, auditable, and distributed ledger for managing real-world USD credits and digital asset burn-pools.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React Native](https://img.shields.io/badge/React_Native-0.81.5-blue.svg?logo=react)
![Expo](https://img.shields.io/badge/Expo-54-black.svg?logo=expo)
![TigerBeetle](https://img.shields.io/badge/Ledger-TigerBeetle_Inspired-gold.svg)

## 🏛️ Architecture Overview

The platform is designed around a **double-entry bookkeeping** core that ensures absolute mathematical correctness across all asset movements.

### Deterministic Ledger Core (`lib/ledger.ts`)
Inspired by TigerBeetle's design, our accounting engine uses 128-bit identifiers and tracking of four distinct balance states per account:
- `credits_pending` / `credits_posted`
- `debits_pending` / `debits_posted`

This structure prevents race conditions and ensures that every transaction is atomic and immutable once posted.

### Privileged Account Structures
- **Public Vault**: Standard treasury operations for verified principals.
- **Private Vault**: An isolated, privileged tier requiring **KYC Level 2** and **Passkey Enrollment**. Used for sovereign reserves and high-value secret settlement.

## ✨ Features

- **🔥 Proof-of-Burn On-Ramp**: Convert digital assets (SOVR, TBND) into real-world USD credit via verified on-chain burn events.
- **💸 P2P Credit Transfers**: Instantly send USD credit to other principals with atomic fee collection and distributed sync logic.
- **🏦 Multi-Rail Withdrawals**: Support for ACH (Standard/Same-Day), RTP (Real-Time Payments), and Debit Push.
- **🛡️ Security Posture**: NIST SP 800-63 compliant identity verification with biometric step-up and passkey support.
- **📜 Audit Trail**: A complete, cryptographically sealed ledger of every transaction.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS)
- [Bun](https://bun.sh/) (Recommended for package management and testing)
- [Expo Go](https://expo.dev/go) on your mobile device

### Installation
1. Clone the repository
2. Navigate to the app directory:
   ```bash
   cd expo
   ```
3. Install dependencies:
   ```bash
   bun install
   ```

### Development
Start the development server with a tunnel for easy mobile testing:
```bash
bun run start
```
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan the QR code with **Expo Go** to test on a physical device

## 🧪 Testing

We prioritize ledger integrity. Run the deterministic accounting suite using Bun:

```bash
cd expo
bun test providers/__tests__/accounting.test.ts
```

This verifies:
- Atomic multi-account transfers
- Overdraw protection (Balance Invariants)
- Multi-stage settlement lifecycles

## 📂 Project Structure

```
├── app/                  # File-based routing (Expo Router)
│   ├── (tabs)/          # Main dashboard tabs (Vault, Send, Ledger, etc.)
│   └── receipt/         # Detailed transaction receipts
├── components/          # Reusable UI primitives and design system
├── lib/                 # Core deterministic accounting logic (TigerBeetle)
├── providers/           # State management & Real-world connectivity
├── types/               # Strict TypeScript definitions for treasury logic
└── constants/           # Design tokens and global config
```

## 🔐 Security & Compliance

- **Deterministic Logic**: No floating-point math; all balances tracked in integer cents.
- **NIST SP 800-63**: Implementation of secure authentication and identity management.
- **Audit Ready**: Every ledger entry is a sealed record with unique cryptographic hashes and block confirmation tracking.

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ by Sovereign Treasury Engineering.*
