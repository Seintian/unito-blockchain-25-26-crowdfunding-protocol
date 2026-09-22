# ADR-004: Multi-Token Decimals and Fixed-Point Integer Arithmetic

## Status

**Accepted**.

## Context

EVM execution is strictly integer-based. Floating-point types do not exist in Solidity. Standard ERC-20 tokens use different decimal precision standards:

- Most governance/utility tokens: 18 decimals (e.g., $10^{18}$ base units per whole token).
- Common stablecoins: 6 decimals (e.g., USDC, USDT with $10^6$ base units).
- Wrapped Bitcoin: 8 decimals (e.g., WBTC with $10^8$ base units).

Integer division in the EVM truncates toward zero:
$$\lfloor a / b \rfloor$$

If a naive exchange calculation performs division before multiplication:

```solidity
// ANTIPATTERN: Truncation causes reward to evaluate to 0
uint256 reward = (contribution / threshold) * totalReward;
```

Any contribution less than the threshold results in `0` rewards.

## Decision

We enforce two core mathematical rules:

1. **Multiplication Before Division**:
   $$\text{rewardAmount} = \frac{\text{contribution} \times \text{rewardRate}}{\text{RATE\_PRECISION}}$$
2. **Fixed-Point Scaling Factor (`RATE_PRECISION = 1e18`)**:
   - The exchange rate is expressed as a normalized 18-decimal fixed-point scalar.
   - For tokens with identical decimals (e.g., 18 decimals each), `rewardRate = 1e18` represents a 1:1 conversion.
   - For heterogeneous decimals (e.g., 6-decimal funding token and 18-decimal reward token), the rate accounts for decimal normalization ($10^{d_R - d_F}$), ensuring zero precision loss.

## Consequences

### Positive

- **Zero Truncation Loss**: Backers receive exact proportional rewards even for micro-contributions.
- **Heterogeneous Token Compatibility**: Supports any combination of funding and reward ERC-20 tokens.
- **Gas Efficiency**: Pure integer operations avoid external math library overhead.

### Negative

- Callers (or frontend interfaces) must provide properly scaled rate multipliers when creating campaigns with non-18 decimal tokens.
