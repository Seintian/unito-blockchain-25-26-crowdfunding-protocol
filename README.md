# Crowdfunding Protocol: All-or-Nothing Decentralized Escrow

#### Exam project for Blockchain, Distributed and Decentralised Systems (INF0422)

**Università degli Studi di Torino — Master's & Bachelor's in Computer Science (A.Y. 2025/2026)**  
**Instructors:** Prof. Andrea Bracciali, Prof. Claudio Schifanella  

A production-secure, mathematically verified, and intermediary-free decentralized crowdfunding protocol implemented in Solidity (`0.8.24`) running on the Ethereum Virtual Machine (EVM).

The system strictly enforces game-theoretic **All-or-Nothing (AON)** assurance contract mechanics while managing trustless escrows across two distinct ERC-20 tokens (**Funding Token** and **Reward Token**).

---

## 🏗️ Protocol Architecture

The protocol uses the **Factory-Instance Pattern** to deploy autonomous, isolated escrow contracts for each campaign, completely eliminating shared-state attack vectors.

```mermaid
graph TD
    subgraph "Presentation Layer"
        UI["React 18 + Vite Web3 dApp (frontend/)"]
        MM["MetaMask / Ethers.js v6"]
        UI <--> MM
    end

    subgraph "Smart Contract Layer (EVM)"
        FACTORY["CrowdfundingFactory.sol<br/>(Permissionless Registry & Deployer)"]
        CAMPAIGN["CrowdfundingCampaign.sol<br/>(Autonomous All-or-Nothing Escrow)"]
        
        MM -->|createCampaign()| FACTORY
        FACTORY -->|deploys (new)| CAMPAIGN
        MM -->|pledge() / claim()| CAMPAIGN
    end

    subgraph "Token Contracts"
        F_TOKEN[("Funding Token (ERC-20)<br/>e.g., USDC, DAI")]
        R_TOKEN[("Reward Token (ERC-20)<br/>e.g., Project GOV Token")]
        
        CAMPAIGN <-->|Escrows / Releases| F_TOKEN
        CAMPAIGN <-->|100% Collateral Escrow| R_TOKEN
    end
```

---

## ⚡ Key Protocol Features & Invariants

1. **100% Upfront Reward Collateralization**:
   - Project creators cannot launch a campaign on promises alone.
   - Upon campaign creation, the proposer must deposit 100% of the required reward tokens as escrow collateral:
     $$\text{Collateral} = \frac{\text{Threshold} \times \text{RewardRate}}{\text{RATE\_PRECISION}}$$
   - This eliminates creator **Moral Hazard** and guarantees solvency for all participating backers.

2. **Strict All-or-Nothing Settlement Exclusivity**:
   - **Successful Campaign ($\text{totalRaised} \ge \text{Threshold}$)**: Backers claim their entitled reward tokens; creator claims the total funding tokens raised. Early withdrawals and refunds are permanently disabled.
   - **Expired / Failed Campaign ($\text{timestamp} \ge \text{Deadline}$ and $\text{totalRaised} < \text{Threshold}$)**: Backers claim a guaranteed 100% refund of contributed principal; creator recovers their deposited reward collateral.

3. **Flexible Early Withdrawal Rights**:
   - Backers retain an absolute right to withdraw their contributed funds at any time *before* the campaign threshold is reached.

4. **Pull over Push (Withdrawal Pattern)**:
   - The contract never iterates across arrays to distribute funds, guaranteeing immunity against **Denial of Service (DoS) via Block Gas Limits (SWC-128)**.
   - Stakeholders pull their respective tokens independently (`claimReward`, `claimRefund`, `claimFunds`, `recoverCollateral`).

5. **Security Hardening**:
   - Protected against reentrancy attacks via strict **Checks-Effects-Interactions (CEI)** and OpenZeppelin's `ReentrancyGuard` (`nonReentrant`).
   - Standardized token safety with OpenZeppelin's `SafeERC20` (`safeTransfer`, `safeTransferFrom`).
   - Gas-optimized custom errors (`error ThresholdExceeded()`, `error CampaignNotActive()`).

---

## 📂 Repository Layout

```text
crowdfunding-protocol/
├── contracts/
│   ├── CrowdfundingCampaign.sol         # Autonomous campaign escrow state machine
│   ├── CrowdfundingFactory.sol          # Factory deployer & registry
│   ├── interfaces/
│   │   ├── ICrowdfundingCampaign.sol    # Formal campaign interface
│   │   └── ICrowdfundingFactory.sol     # Formal factory interface
│   └── mocks/
│       ├── MockERC20.sol                # Configurable ERC-20 with test faucet
│       └── MaliciousReentrantToken.sol  # Attack vector mock for security tests
├── test/
│   ├── CrowdfundingCampaign.test.ts     # 100% branch/statement unit test suite
│   └── CrowdfundingFactory.test.ts      # Registry & deployment test suite
├── scripts/
│   ├── deploy.ts                        # Automated Sepolia / local deployment
│   └── seed.ts                          # Multi-scenario seeding for local demo
├── frontend/                            # Responsive React + Vite Web3 dApp
│   ├── src/
│   │   ├── components/                  # Header, CampaignCard, FaucetModal, CreateModal
│   │   ├── hooks/                       # useWeb3, useCampaigns
│   │   └── contracts/                   # ABIs and contract pointers
│   ├── index.html
│   └── vite.config.ts
├── docs/
│   ├── reports/
│   │   └── CROWDFUNDING_THEORY_AND_SPECIFICATION_REPORT.md  # Comprehensive academic report
│   └── decisions/
│       ├── ADR-001-factory-instance-pattern.md
│       ├── ADR-002-pull-over-push-pattern.md
│       ├── ADR-003-upfront-collateral-escrow.md
│       └── ADR-004-fixed-point-precision-and-decimals.md
├── hardhat.config.ts                    # Hardhat config (Solidity 0.8.24)
├── package.json
└── README.md
```

---

## 🚀 Quickstart & Development

### 1. Installation

```bash
# Install root smart contract toolchain
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Compilation

```bash
npx hardhat compile
```

### 3. Automated Test Suite (43 Passing Tests)

Run the full TypeScript test suite:

```bash
npx hardhat test
```

Run code coverage analysis:

```bash
npx hardhat coverage
```

*Achieves 100% statement, function, and line coverage on core contracts.*

---

## 🖥️ Local Simulation & Running the Web3 dApp

You can test the entire protocol without spending any money ($0.00 budget):

### Step 1: Start local Hardhat EVM Node

```bash
npm run node
```

### Step 2: Deploy & Seed Demo Campaigns

In a second terminal:

```bash
npm run seed:local
```

This deploys the contracts and seeds:

1. **Active Campaign**: A Clean Energy Microgrid campaign collecting pledges.
2. **Successful Campaign**: An AI Infrastructure campaign with threshold met, ready for reward claims.

### Step 3: Launch Frontend

In a third terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser. Connect MetaMask to `http://127.0.0.1:8545` (Chain ID: `31337`). Use the **🚰 Faucet** button to claim test tokens and interact with campaigns!

---

## 🌐 Deployment to Sepolia Testnet

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Set your `SEPOLIA_RPC_URL`, deployer `PRIVATE_KEY`, and optional `ETHERSCAN_API_KEY`.
3. Deploy to Sepolia:

   ```bash
   npm run deploy:sepolia
   ```

---

## 📖 Theoretical Documentation & ADRs

- [**Exhaustive Theoretical, Architectural, Security & Simulation Report**](docs/reports/EXHAUSTIVE_PROTOCOL_ANALYSIS_REPORT.md)
- [**Exhaustive Theoretical Treatise & Protocol Specification**](docs/reports/CROWDFUNDING_THEORY_AND_SPECIFICATION_REPORT.md)
- [**Architectural Decision Records (ADRs)**](docs/README.md)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
