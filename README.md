# Crowdfunding Protocol - "All-or-Nothing" Smart Contracts

#### Exam project for the Blockchain, Distributed and Decentralized Systems course (INF0422).

A fair, transparent, and intermediary-free decentralized crowdfunding protocol built in Solidity and running on the EVM (Ethereum Virtual Machine).

The system strictly enforces "All-or-Nothing" logic while securely managing the flow of two distinct ERC-20 tokens (Funding Token and Reward Token).

## Protocol Features

- **Automated Escrow**: Upon campaign creation, the proposer must deposit 100% of the required Reward Tokens as collateral into the contract.
- **Fairness Invariants**:
  - If the campaign reaches the predefined *threshold* before the *deadline*, backers receive their rewards and the proposer withdraws the funding tokens.
  - If the deadline passes without reaching the threshold, backers can fully redeem their contributions and the proposer recovers the deposited reward tokens.
- **Flexible Withdrawal**: Backers can withdraw their contributed funds at any time before the campaign threshold is reached.
- **Security**: Protection against reentrancy vulnerabilities and mathematical overflows, utilizing standard OpenZeppelin contracts.

## Repository Structure

- `/contracts/`: Solidity smart contracts (`CrowdfundingFactory.sol`, `CrowdfundingCampaign.sol`).
- `/test/`: Full suite of unit tests written in TypeScript to verify every scenario (success, failure, early withdrawals, reentrancy attacks).
- `/scripts/`: Deployment scripts for the Sepolia test network.
- `/frontend/`: A simple decentralized web interface (dApp) integrated with MetaMask and `ethers.js` to enable user interaction.

## Setup and Installation

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables by creating a `.env` file:

   ```bash
   cp .env.example .env
   ```

   Set up `SEPOLIA_RPC_URL` and `PRIVATE_KEY` for deployment.

## Compilation and Testing

```bash
# Compile the smart contracts
npx hardhat compile

# Run on-chain security tests
npx hardhat test
```

## Deployment to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```
