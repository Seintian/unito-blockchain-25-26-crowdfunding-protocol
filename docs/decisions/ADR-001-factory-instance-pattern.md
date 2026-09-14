# ADR-001: Factory-Instance Pattern vs. Monolithic Multi-Campaign Contract

## Status
**Accepted**

## Context
In decentralized crowdfunding protocol design, two primary smart contract architectural models exist:
1. **Monolithic Architecture**: A single monolithic smart contract manages all campaigns via storage arrays or mappings (`mapping(uint256 => Campaign)`).
2. **Factory-Instance Architecture**: A central factory registry (`CrowdfundingFactory.sol`) deploys independent, isolated smart contract instances (`CrowdfundingCampaign.sol`) for each individual campaign.

In a monolithic architecture, a vulnerability, state corruption, or reentrancy flaw in one campaign could compromise the entire protocol balance or lock the assets of unrelated creators and backers. Furthermore, managing heterogeneous ERC-20 tokens within a single storage context significantly increases execution complexity and `SLOAD`/`SSTORE` gas costs.

## Decision
We adopt the **Factory-Instance Pattern**:
- `CrowdfundingFactory.sol` acts as the permissionless deployer and global registry.
- Each campaign is deployed as a distinct, autonomous `CrowdfundingCampaign.sol` instance with immutable parameters (`creator`, `fundingToken`, `rewardToken`, `threshold`, `rewardRate`, `deadline`, `rewardCollateral`).
- 100% of the required reward token collateral is deposited directly into the newly created campaign instance upon instantiation.

## Consequences

### Positive
- **Fault Isolation**: An exploit or unexpected revert in one campaign contract cannot impact any other campaign or drain foreign tokens.
- **Gas Predictability**: Storage layout is completely decoupled; state access relies on direct slot reads rather than deeply nested mappings.
- **Permissionless Extension**: Anyone can deploy custom campaigns without requiring admin privileges or governance proposals.
- **Immutable Trust**: Each campaign instance's terms (tokens, rates, thresholds, deadlines) are immutably set in the constructor and cannot be altered by anyone, including the factory deployer.

### Negative
- Higher deployment gas cost when launching a new campaign (deploys a new contract rather than simply writing to a mapping). This is heavily mitigated by the security gains and modern Layer 2 / rollup gas cost structures.
