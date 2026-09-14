# Crowdfunding Protocol: Architectural & Theoretical Documentation Suite

Welcome to the comprehensive technical and theoretical documentation of **Crowdfunding Protocol**, an enterprise-grade, production-secure educational and experimental implementation of an All-or-Nothing decentralized crowdfunding protocol on Ethereum EVM.

---

## 📚 Documentation Index

### 1. Fundamental Theory & Specifications (`docs/reports/`)

- [**Theoretical Foundations & Comprehensive Protocol Specification**](reports/CROWDFUNDING_THEORY_AND_SPECIFICATION_REPORT.md):
  EVM execution engine, account-based state machines, microeconomics of Assurance Contracts (Provision Point Mechanisms), dominant strategy equilibria, formal protocol invariants, dual-token collateral mathematics, and EVM security threat modeling.
- [**Security Audit & Gas Optimization Report**](reports/SECURITY_AUDIT_AND_OPTIMIZATION_REPORT.md):
  Comprehensive vulnerability assessment, static analysis triage, anti-reentrancy defense verification, fee-on-transfer hardening, and gas benchmarks.

### 2. Architectural Decision Records (`docs/decisions/`)

- [**ADR-001: Factory-Instance Pattern vs. Monolithic Multi-Campaign Contract**](decisions/ADR-001-factory-instance-pattern.md):
  Fault isolation, permissionless deployment, and decoupled state storage.
- [**ADR-002: Pull over Push Pattern for Token Distribution and Refunds**](decisions/ADR-002-pull-over-push-pattern.md):
  Elimination of block gas limit DoS attacks and griefing vulnerabilities.
- [**ADR-003: 100% Upfront Reward Collateralization**](decisions/ADR-003-upfront-collateral-escrow.md):
  Eradication of creator moral hazard and guaranteed backer solvency.
- [**ADR-004: Multi-Token Decimals and Fixed-Point Integer Arithmetic**](decisions/ADR-004-fixed-point-precision-and-decimals.md):
  Multiplication-before-division invariants, `RATE_PRECISION = 1e18`, and heterogeneous ERC-20 decimal normalization.

---

## 🛠️ Quick CLI Commands

```bash
# Compile contracts with Hardhat
npm run compile

# Run comprehensive test suite (45 unit & invariant tests)
npm run test

# Run code coverage (100% statements & lines on core contracts)
npm run coverage

# Deploy contracts and seed live scenarios locally
npm run node
npm run seed:local

# Launch responsive React Web3 frontend
cd frontend && npm run dev
```
