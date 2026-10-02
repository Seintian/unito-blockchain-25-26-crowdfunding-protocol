export const CROWDFUNDING_FACTORY_ABI = [
  "event CampaignCreated(address indexed campaignAddress, address indexed creator, address indexed fundingToken, address rewardToken, uint256 threshold, uint256 rewardRate, uint256 deadline, uint256 rewardCollateral)",
  "error InvalidTokenAddress()",
  "error InvalidThreshold()",
  "error InvalidRewardRate()",
  "error InvalidDuration()",
  "error InsufficientCollateral()",
  "function createCampaign(address fundingToken, address rewardToken, uint256 threshold, uint256 rewardRate, uint256 duration) external returns (address campaignAddress)",
  "function getDeployedCampaigns() external view returns (address[] memory)",
  "function getDeployedCampaignsPaginated(uint256 offset, uint256 limit) external view returns (address[] memory campaigns, uint256 total)",
  "function getDeployedCampaignsCount() external view returns (uint256)",
  "function getCreatorCampaigns(address creator) external view returns (address[] memory)",
  "function getCreatorCampaignsPaginated(address creator, uint256 offset, uint256 limit) external view returns (address[] memory campaigns, uint256 total)",
  "function getCreatorCampaignsCount(address creator) external view returns (uint256)"
];

export const CROWDFUNDING_CAMPAIGN_ABI = [
  "event Pledged(address indexed backer, uint256 amount, uint256 newTotalRaised)",
  "event WithdrawnBeforeThreshold(address indexed backer, uint256 amount, uint256 newTotalRaised)",
  "event RewardsClaimed(address indexed backer, uint256 rewardAmount)",
  "event RefundClaimed(address indexed backer, uint256 refundAmount)",
  "event CreatorFundsClaimed(address indexed creator, uint256 fundsAmount)",
  "event CreatorCollateralRecovered(address indexed creator, uint256 collateralAmount)",
  "event ExcessRewardsRecovered(address indexed creator, uint256 amount)",
  "error CampaignNotActive()",
  "error CampaignNotSuccessful()",
  "error CampaignNotExpired()",
  "error DeadlinePassed()",
  "error ThresholdExceeded()",
  "error ZeroAmount()",
  "error InsufficientContribution()",
  "error RewardsAlreadyClaimed()",
  "error RefundsAlreadyClaimed()",
  "error CreatorFundsAlreadyClaimed()",
  "error CreatorCollateralAlreadyRefunded()",
  "error NoExcessRewards()",
  "error Unauthorized()",
  "error InvalidConfiguration()",
  "function state() external view returns (uint8)",
  "function creator() external view returns (address)",
  "function fundingToken() external view returns (address)",
  "function rewardToken() external view returns (address)",
  "function threshold() external view returns (uint256)",
  "function rewardRate() external view returns (uint256)",
  "function deadline() external view returns (uint256)",
  "function rewardCollateral() external view returns (uint256)",
  "function totalRaised() external view returns (uint256)",
  "function totalRewardsClaimed() external view returns (uint256)",
  "function contributions(address backer) external view returns (uint256)",
  "function rewardsClaimed(address backer) external view returns (bool)",
  "function refundsClaimed(address backer) external view returns (bool)",
  "function creatorFundsClaimed() external view returns (bool)",
  "function creatorCollateralRecovered() external view returns (bool)",
  "function calculateReward(uint256 contributionAmount) external view returns (uint256)",
  "function remainingToThreshold() external view returns (uint256)",
  "function pledge(uint256 amount) external",
  "function withdrawBeforeThreshold(uint256 amount) external",
  "function claimReward() external",
  "function claimRefund() external",
  "function claimFunds() external",
  "function recoverCollateral() external",
  "function recoverExcessRewards() external"
];

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address recipient, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function faucet(uint256 amount)"
];

// Environment-configurable contract addresses for Vercel / Sepolia / Localhost
export const CONTRACT_CONFIG = {
  factory:
    import.meta.env.VITE_FACTORY_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  fundingToken:
    import.meta.env.VITE_FUNDING_TOKEN_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  rewardToken:
    import.meta.env.VITE_REWARD_TOKEN_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  defaultChainId: Number(import.meta.env.VITE_DEFAULT_CHAIN_ID || 11155111), // Default: Sepolia
  sepoliaRpcUrl:
    import.meta.env.VITE_SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
};

export const DEFAULT_HARDHAT_ADDRESSES = CONTRACT_CONFIG;

export function parseContractError(err: any): string {
  if (!err) return "Unknown error occurred";
  if (typeof err === "string") return err;

  // Custom errors identified from ethers v6 interface
  const msg = err.message || "";
  if (msg.includes("CampaignNotActive")) return "Campaign is not currently active.";
  if (msg.includes("CampaignNotSuccessful")) return "Campaign has not reached its threshold.";
  if (msg.includes("CampaignNotExpired")) return "Campaign deadline has not passed yet.";
  if (msg.includes("DeadlinePassed")) return "Campaign deadline has already passed.";
  if (msg.includes("ThresholdExceeded")) return "Pledge amount would exceed the funding threshold.";
  if (msg.includes("ZeroAmount")) return "Amount cannot be zero.";
  if (msg.includes("InsufficientContribution")) return "You have not pledged enough tokens for this action.";
  if (msg.includes("RewardsAlreadyClaimed")) return "You have already claimed your rewards.";
  if (msg.includes("RefundsAlreadyClaimed")) return "You have already claimed your refund.";
  if (msg.includes("CreatorFundsAlreadyClaimed")) return "Creator has already withdrawn the campaign funds.";
  if (msg.includes("CreatorCollateralAlreadyRefunded")) return "Creator reward collateral has already been recovered.";
  if (msg.includes("NoExcessRewards")) return "No excess reward tokens or dust available to recover.";
  if (msg.includes("Unauthorized")) return "Only the campaign creator is authorized to perform this action.";
  if (msg.includes("InvalidConfiguration")) return "Invalid campaign parameters (tokens cannot be identical or zero).";
  if (msg.includes("InvalidTokenAddress")) return "Invalid token address or funding and reward tokens are identical.";
  if (msg.includes("InvalidThreshold")) return "Funding threshold must be greater than zero.";
  if (msg.includes("InvalidRewardRate")) return "Reward multiplier must be greater than zero.";
  if (msg.includes("InvalidDuration")) return "Campaign duration must be greater than zero.";
  if (msg.includes("InsufficientCollateral")) return "Insufficient reward token collateral deposited.";
  if (err.reason) return err.reason;
  if (err.shortMessage) return err.shortMessage;
  return err.message || "Transaction failed";
}
