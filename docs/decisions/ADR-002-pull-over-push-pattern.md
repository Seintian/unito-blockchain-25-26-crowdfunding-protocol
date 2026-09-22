# ADR-002: Pull over Push Pattern for Token Distribution and Refunds

## Status

**Accepted**.

## Context

When a crowdfunding campaign reaches its final state (`Successful` or `Expired`), funds and tokens must be distributed to stakeholders:

- In a `Successful` campaign: backers receive reward tokens, and the creator receives the aggregate funding tokens.
- In an `Expired` campaign: backers receive a 100% refund of their funding tokens, and the creator recovers their reward collateral.

A naive implementation might attempt a **Push Pattern**, where a single transaction iterates over an array of all backers to automatically transfer tokens:

```solidity
// ANTIPATTERN: Vulnerable to DoS and gas limit exhaustion
for (uint256 i = 0; i < backers.length; i++) {
    rewardToken.transfer(backers[i], calculateReward(contributions[backers[i]]));
}
```

This pattern introduces two severe vulnerabilities:

1. **Denial of Service (DoS) with Block Gas Limit (SWC-128)**: As the number of backers grows, the gas required to iterate over the entire array exceeds the Ethereum block gas limit (30M gas), permanently locking all funds.
2. **Malicious Revert / Griefing**: If even a single backer is a malicious contract that reverts upon receiving tokens, the entire transaction reverts, preventing all other backers from receiving rewards or refunds.

## Decision

We enforce the **Pull over Push (Withdrawal Pattern)**:

- The contract maintains internal accounting balances in persistent storage mappings.
- Stakeholders independently initiate transactions to withdraw their entitled assets:
  - Backers call `claimReward()` upon success.
  - Backers call `claimRefund()` upon expiration.
  - The creator calls `claimFunds()` upon success.
  - The creator calls `recoverCollateral()` upon expiration.
- All mutating functions strictly adhere to the **Checks-Effects-Interactions (CEI)** pattern and OpenZeppelin's `nonReentrant` modifier.

## Consequences

### Positive

- **Guaranteed Liveness**: The protocol is completely immune to block gas limit exhaustion and griefing attacks.
- **Fair Gas Cost Allocation**: Each user pays only for the gas associated with their personal withdrawal transaction.
- **Audit Simplicity**: State transitions and transfer calls are atomic, isolated, and easy to formalize mathematically.

### Negative

- Users must submit an explicit transaction to claim rewards or refunds rather than receiving them automatically.
