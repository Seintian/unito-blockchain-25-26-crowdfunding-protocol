export const CROWDFUNDING_FACTORY_ABI = [
  "event CampaignCreated(address indexed campaignAddress, address indexed creator, address indexed fundingToken, address rewardToken, uint256 threshold, uint256 rewardRate, uint256 deadline, uint256 rewardCollateral)",
  "function createCampaign(address fundingToken, address rewardToken, uint256 threshold, uint256 rewardRate, uint256 duration) external returns (address campaignAddress)",
  "function getDeployedCampaigns() external view returns (address[] memory)",
  "function getDeployedCampaignsCount() external view returns (uint256)",
  "function getCreatorCampaigns(address creator) external view returns (address[] memory)",
  "function getCreatorCampaignsCount(address creator) external view returns (uint256)"
];

export const CROWDFUNDING_CAMPAIGN_ABI = [
  "event Pledged(address indexed backer, uint256 amount, uint256 newTotalRaised)",
  "event WithdrawnBeforeThreshold(address indexed backer, uint256 amount, uint256 newTotalRaised)",
  "event RewardsClaimed(address indexed backer, uint256 rewardAmount)",
  "event RefundClaimed(address indexed backer, uint256 refundAmount)",
  "event CreatorFundsClaimed(address indexed creator, uint256 fundsAmount)",
  "event CreatorCollateralRecovered(address indexed creator, uint256 collateralAmount)",
  "function state() external view returns (uint8)",
  "function creator() external view returns (address)",
  "function fundingToken() external view returns (address)",
  "function rewardToken() external view returns (address)",
  "function threshold() external view returns (uint256)",
  "function rewardRate() external view returns (uint256)",
  "function deadline() external view returns (uint256)",
  "function rewardCollateral() external view returns (uint256)",
  "function totalRaised() external view returns (uint256)",
  "function contributions(address backer) external view returns (uint256)",
  "function rewardsClaimed(address backer) external view returns (bool)",
  "function refundsClaimed(address backer) external view returns (bool)",
  "function creatorFundsClaimed() external view returns (bool)",
  "function creatorCollateralRecovered() external view returns (bool)",
  "function calculateReward(uint256 contributionAmount) external view returns (uint256)",
  "function pledge(uint256 amount) external",
  "function withdrawBeforeThreshold(uint256 amount) external",
  "function claimReward() external",
  "function claimRefund() external",
  "function claimFunds() external",
  "function recoverCollateral() external"
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
