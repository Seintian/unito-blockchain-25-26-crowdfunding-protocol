# ADR-003: 100% Upfront Reward Collateralization

## Status
**Accepted**

## Context
Traditional Web2 crowdfunding platforms suffer from severe **Moral Hazard**:
- Project creators collect money upfront based on a pitch.
- Once funding is received, creators may fail to manufacture products, issue promised vouchers, or distribute promised digital tokens.
- Backers bear 100% of the counterparty execution risk with negligible legal recourse.

In a Web3 decentralized protocol, a naive approach might allow creators to launch a campaign with only a promise to mint or deposit reward tokens after the funding goal is met. However, this reintroduces the exact moral hazard that smart contracts are designed to eliminate.

## Decision
We enforce **Mandatory 100% Upfront Escrow Collateralization**:
1. At the time of campaign creation, the required collateral is strictly computed as:
   $$\text{rewardCollateral} = \frac{\text{threshold} \times \text{rewardRate}}{\text{RATE\_PRECISION}}$$
2. In `CrowdfundingFactory.createCampaign(...)`, the factory executes `safeTransferFrom(msg.sender, campaignAddress, rewardCollateral)` before finalizing deployment.
3. If the creator has not approved or does not possess the full collateral, deployment reverts atomically.
4. If the campaign succeeds, backers have an un-ruggable cryptographic guarantee that 100% of their rewards are already present in the contract.
5. If the campaign fails or expires, the creator safely reclaims the entire collateral via `recoverCollateral()`.

## Consequences

### Positive
- **Zero Counterparty Risk for Backers**: Backers know with mathematical certainty that reward tokens cannot be withheld if the goal is met.
- **Symmetric Fairness**: Both parties deposit their assets into trustless escrow; settlement is entirely deterministic.
- **Proposer Asset Safety**: Creators are not penalized if a campaign fails; their collateral is safely preserved and recoverable.

### Negative
- Creators must possess or mint their reward tokens prior to launching the campaign.
