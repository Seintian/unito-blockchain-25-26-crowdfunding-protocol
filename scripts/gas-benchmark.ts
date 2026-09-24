import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { CrowdfundingCampaign, CrowdfundingFactory, MockERC20 } from "../typechain-types";

interface GasMetric {
  step: string;
  actor: string;
  gasUsed: bigint;
  description: string;
}

async function getGas(txPromise: Promise<any>): Promise<bigint> {
  const tx = await txPromise;
  const receipt = await tx.wait();
  return receipt.gasUsed;
}

async function main() {
  console.log("==================================================================");
  console.log("STARTING EXHAUSTIVE GAS PROFILING FOR CROWDFUNDING PROTOCOL");
  console.log("==================================================================\n");

  const [deployer, creator, backer1, backer2, backer3] = await ethers.getSigners();
  const metrics: GasMetric[] = [];

  // 1. DEPLOYMENT COSTS
  console.log(">>> Profiling Deployment Costs...");
  const factoryFactory = await ethers.getContractFactory("CrowdfundingFactory");
  const factoryDeployTx = await factoryFactory.deploy();
  const factoryDeployReceipt = await factoryDeployTx.deploymentTransaction()?.wait();
  const factoryGas = factoryDeployReceipt?.gasUsed ?? 0n;
  metrics.push({
    step: "Factory Deployment",
    actor: "Protocol Deployer",
    gasUsed: factoryGas,
    description: "Deployment of CrowdfundingFactory bytecode and storage init"
  });

  const tokenFactory = await ethers.getContractFactory("MockERC20");
  const fundingToken = await tokenFactory.deploy("Funding USD", "FUSD", 18);
  const fundingDeployReceipt = await fundingToken.deploymentTransaction()?.wait();
  metrics.push({
    step: "ERC-20 Funding Token Deployment",
    actor: "Deployer",
    gasUsed: fundingDeployReceipt?.gasUsed ?? 0n,
    description: "Deployment of MockERC20 token contract (18 decimals)"
  });

  const rewardToken = await tokenFactory.deploy("Reward Token", "RWD", 18);
  const rewardDeployReceipt = await rewardToken.deploymentTransaction()?.wait();
  metrics.push({
    step: "ERC-20 Reward Token Deployment",
    actor: "Deployer",
    gasUsed: rewardDeployReceipt?.gasUsed ?? 0n,
    description: "Deployment of MockERC20 token contract (18 decimals)"
  });

  const campaignDirectFactory = await ethers.getContractFactory("CrowdfundingCampaign");
  const campaignDirectTx = await campaignDirectFactory.deploy(
    creator.address,
    await fundingToken.getAddress(),
    await rewardToken.getAddress(),
    ethers.parseEther("1000"),
    ethers.parseEther("2"),
    (await time.latest()) + 7 * 24 * 3600
  );
  const campaignDirectReceipt = await campaignDirectTx.deploymentTransaction()?.wait();
  metrics.push({
    step: "Direct CrowdfundingCampaign Deployment",
    actor: "Creator / Deployer",
    gasUsed: campaignDirectReceipt?.gasUsed ?? 0n,
    description: "Standalone bytecode deployment of CrowdfundingCampaign contract"
  });

  // Mint tokens to actors
  const initialMint = ethers.parseEther("1000000");
  await fundingToken.mint(backer1.address, initialMint);
  await fundingToken.mint(backer2.address, initialMint);
  await fundingToken.mint(backer3.address, initialMint);
  await rewardToken.mint(creator.address, initialMint);

  const factory = factoryFactory.attach(await factoryDeployTx.getAddress()) as CrowdfundingFactory;

  // 2. CAMPAIGN CREATION WORKFLOW (CREATOR)
  console.log(">>> Profiling Campaign Creation Workflow...");
  const threshold = ethers.parseEther("1000"); // 1000 FUSD
  const rewardRate = ethers.parseEther("2"); // 2 RWD per 1 FUSD
  const duration = 7 * 24 * 3600; // 7 days
  const collateral = (threshold * rewardRate) / ethers.parseEther("1"); // 2000 RWD

  // Approve reward tokens to factory
  const approveRewardGas = await getGas(
    rewardToken.connect(creator).approve(await factory.getAddress(), collateral * 10n)
  );
  metrics.push({
    step: "ERC-20 Reward Approval",
    actor: "Creator",
    gasUsed: approveRewardGas,
    description: "Approve Factory to transfer reward collateral from Creator"
  });

  // Create Campaign 1
  const createCampaignTx = await factory.connect(creator).createCampaign(
    await fundingToken.getAddress(),
    await rewardToken.getAddress(),
    threshold,
    rewardRate,
    duration
  );
  const createCampaignReceipt = await createCampaignTx.wait();
  const createCampaignGas = createCampaignReceipt.gasUsed;
  metrics.push({
    step: "Create Campaign (Deploy + Escrow)",
    actor: "Creator",
    gasUsed: createCampaignGas,
    description: "Factory calls new CrowdfundingCampaign, pushes to registry, safeTransferFrom collateral"
  });

  // Extract campaign address
  let campaignAddress = "";
  for (const log of createCampaignReceipt.logs) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed && parsed.name === "CampaignCreated") {
        campaignAddress = parsed.args.campaignAddress;
        break;
      }
    } catch {}
  }
  const campaignFactory = await ethers.getContractFactory("CrowdfundingCampaign");
  const campaign = campaignFactory.attach(campaignAddress) as CrowdfundingCampaign;

  // 3. BACKER PLEDGING WORKFLOWS
  console.log(">>> Profiling Pledging Workflows...");
  // Backer 1 Approves
  const approveFundingGas1 = await getGas(
    fundingToken.connect(backer1).approve(campaignAddress, ethers.parseEther("10000"))
  );
  metrics.push({
    step: "ERC-20 Funding Approval (Backer 1)",
    actor: "Backer 1",
    gasUsed: approveFundingGas1,
    description: "Approve Campaign contract to spend funding token"
  });

  // Initial Pledge: Backer 1 pledges 300 FUSD (Cold mapping write)
  const pledgeGas1 = await getGas(
    campaign.connect(backer1).pledge(ethers.parseEther("300"))
  );
  metrics.push({
    step: "Initial Pledge (First Contribution - Cold Storage)",
    actor: "Backer 1",
    gasUsed: pledgeGas1,
    description: "Pledge 300 FUSD: cold SSTORE for contributions[backer], safeTransferFrom, balance checks"
  });

  // Subsequent Pledge: Backer 1 pledges another 100 FUSD (Warm mapping write)
  const pledgeGas2 = await getGas(
    campaign.connect(backer1).pledge(ethers.parseEther("100"))
  );
  metrics.push({
    step: "Subsequent Pledge (Same Backer - Warm Storage)",
    actor: "Backer 1",
    gasUsed: pledgeGas2,
    description: "Pledge 100 FUSD: warm SSTORE for contributions[backer], warm totalRaised update"
  });

  // 4. FLEXIBLE WITHDRAWAL WORKFLOW (PRE-THRESHOLD)
  console.log(">>> Profiling Early Withdrawal Workflows...");
  // Partial Withdrawal: Backer 1 withdraws 50 FUSD (contributions stays > 0)
  const withdrawPartialGas = await getGas(
    campaign.connect(backer1).withdrawBeforeThreshold(ethers.parseEther("50"))
  );
  metrics.push({
    step: "Early Partial Withdrawal",
    actor: "Backer 1",
    gasUsed: withdrawPartialGas,
    description: "Withdraw 50 FUSD before threshold: non-zero to non-zero storage update, safeTransfer"
  });

  // Full Withdrawal: Backer 1 withdraws remaining 350 FUSD (contributions goes to 0)
  const withdrawFullGas = await getGas(
    campaign.connect(backer1).withdrawBeforeThreshold(ethers.parseEther("350"))
  );
  metrics.push({
    step: "Early Full Withdrawal",
    actor: "Backer 1",
    gasUsed: withdrawFullGas,
    description: "Withdraw 350 FUSD (entire balance): storage reset to zero (gas refund eligible), safeTransfer"
  });

  // Backer 1 Re-pledges 400 FUSD
  const repledgeGas = await getGas(
    campaign.connect(backer1).pledge(ethers.parseEther("400"))
  );
  metrics.push({
    step: "Re-Pledge After Full Withdrawal",
    actor: "Backer 1",
    gasUsed: repledgeGas,
    description: "Pledge 400 FUSD after balance was zeroed: 0 -> non-zero SSTORE"
  });

  // Backer 2 Approves & Pledges 500 FUSD
  await fundingToken.connect(backer2).approve(campaignAddress, ethers.parseEther("10000"));
  const pledgeBacker2Gas = await getGas(
    campaign.connect(backer2).pledge(ethers.parseEther("500"))
  );
  metrics.push({
    step: "New Backer Pledge (Backer 2)",
    actor: "Backer 2",
    gasUsed: pledgeBacker2Gas,
    description: "Pledge 500 FUSD from second backer: cold SSTORE for contributions[backer2]"
  });

  // Threshold Crossing Pledge: Backer 3 pledges 100 FUSD to reach exactly 1000 FUSD (threshold met!)
  await fundingToken.connect(backer3).approve(campaignAddress, ethers.parseEther("10000"));
  const thresholdPledgeGas = await getGas(
    campaign.connect(backer3).pledge(ethers.parseEther("100"))
  );
  metrics.push({
    step: "Threshold-Crossing Pledge (Completes Funding)",
    actor: "Backer 3",
    gasUsed: thresholdPledgeGas,
    description: "Pledge 100 FUSD that exactly meets threshold (totalRaised == threshold)"
  });

  // 5. SUCCESSFUL CAMPAIGN WORKFLOWS
  console.log(">>> Profiling Successful Campaign Claim Workflows...");
  // Creator Claims Raised Funds
  const claimFundsGas = await getGas(
    campaign.connect(creator).claimFunds()
  );
  metrics.push({
    step: "Creator Claim Funds",
    actor: "Creator",
    gasUsed: claimFundsGas,
    description: "Creator withdraws totalRaised funding tokens: sets creatorFundsClaimed = true, safeTransfer"
  });

  // Backer 1 Claims Reward
  const claimRewardGas1 = await getGas(
    campaign.connect(backer1).claimReward()
  );
  metrics.push({
    step: "Backer 1 Claim Reward",
    actor: "Backer 1",
    gasUsed: claimRewardGas1,
    description: "Backer 1 claims 800 RWD: marks rewardsClaimed=true, safeTransfer reward tokens"
  });

  // Backer 2 Claims Reward
  const claimRewardGas2 = await getGas(
    campaign.connect(backer2).claimReward()
  );
  metrics.push({
    step: "Backer 2 Claim Reward",
    actor: "Backer 2",
    gasUsed: claimRewardGas2,
    description: "Backer 2 claims 1000 RWD: marks rewardsClaimed=true, safeTransfer reward tokens"
  });

  // Backer 3 Claims Reward
  const claimRewardGas3 = await getGas(
    campaign.connect(backer3).claimReward()
  );
  metrics.push({
    step: "Backer 3 Claim Reward",
    actor: "Backer 3",
    gasUsed: claimRewardGas3,
    description: "Backer 3 claims 200 RWD: marks rewardsClaimed=true, safeTransfer reward tokens"
  });

  // Creator Recovers Excess Rewards (e.g., if a donation/rounding surplus occurred)
  // Let's donate 10 RWD to campaign to simulate dust / surplus
  await rewardToken.mint(campaignAddress, ethers.parseEther("10"));
  const recoverExcessGas = await getGas(
    campaign.connect(creator).recoverExcessRewards()
  );
  metrics.push({
    step: "Creator Recover Excess Rewards",
    actor: "Creator",
    gasUsed: recoverExcessGas,
    description: "Creator sweeps non-liability reward tokens (rounding dust / surplus)"
  });

  // 6. EXPIRED / FAILED CAMPAIGN WORKFLOWS
  console.log(">>> Profiling Expired/Failed Campaign Workflows...");
  // Create Campaign 2 for expiration testing
  const createCampaignTx2 = await factory.connect(creator).createCampaign(
    await fundingToken.getAddress(),
    await rewardToken.getAddress(),
    threshold,
    rewardRate,
    duration
  );
  const rc2 = await createCampaignTx2.wait();
  let campaign2Address = "";
  for (const log of rc2.logs) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed && parsed.name === "CampaignCreated") {
        campaign2Address = parsed.args.campaignAddress;
        break;
      }
    } catch {}
  }
  const campaign2 = campaignFactory.attach(campaign2Address) as CrowdfundingCampaign;

  // Backer 1 & 2 pledge partially (total 600 < 1000)
  await fundingToken.connect(backer1).approve(campaign2Address, ethers.parseEther("10000"));
  await fundingToken.connect(backer2).approve(campaign2Address, ethers.parseEther("10000"));
  await campaign2.connect(backer1).pledge(ethers.parseEther("400"));
  await campaign2.connect(backer2).pledge(ethers.parseEther("200"));

  // Advance time past deadline
  await time.increase(duration + 100);

  // Backer 1 Claims Refund
  const claimRefundGas1 = await getGas(
    campaign2.connect(backer1).claimRefund()
  );
  metrics.push({
    step: "Backer 1 Claim Refund",
    actor: "Backer 1",
    gasUsed: claimRefundGas1,
    description: "Backer 1 claims 100% refund of 400 FUSD: marks refundsClaimed=true, safeTransfer"
  });

  // Backer 2 Claims Refund
  const claimRefundGas2 = await getGas(
    campaign2.connect(backer2).claimRefund()
  );
  metrics.push({
    step: "Backer 2 Claim Refund",
    actor: "Backer 2",
    gasUsed: claimRefundGas2,
    description: "Backer 2 claims 100% refund of 200 FUSD: marks refundsClaimed=true, safeTransfer"
  });

  // Creator Recovers 100% Collateral
  const recoverCollateralGas = await getGas(
    campaign2.connect(creator).recoverCollateral()
  );
  metrics.push({
    step: "Creator Recover Collateral",
    actor: "Creator",
    gasUsed: recoverCollateralGas,
    description: "Creator recovers 2000 RWD deposited collateral: creatorCollateralRecovered=true, safeTransfer"
  });

  // 7. REGISTRY / VIEW FUNCTIONS (Simulating eth_estimateGas or execution costs)
  console.log(">>> Profiling View Gas Costs...");
  const viewStateGas = await campaign.state.estimateGas();
  const viewCalcRewardGas = await campaign.calculateReward.estimateGas(ethers.parseEther("500"));
  const viewRemainingGas = await campaign.remainingToThreshold.estimateGas();
  const viewFactoryAllGas = await factory.getDeployedCampaigns.estimateGas();
  const viewFactoryPaginatedGas = await factory.getDeployedCampaignsPaginated.estimateGas(0, 10);

  console.log("\n==================================================================");
  console.log("RAW RESULTS SUMMARY TABLE");
  console.log("==================================================================");
  console.table(
    metrics.map(m => ({
      Step: m.step,
      Actor: m.actor,
      "Gas Used": m.gasUsed.toString(),
      Description: m.description,
    }))
  );

  console.log("\nView Function Gas Estimates (Read-only simulation):");
  console.log(`- campaign.state(): ${viewStateGas.toString()} gas`);
  console.log(`- campaign.calculateReward(500): ${viewCalcRewardGas.toString()} gas`);
  console.log(`- campaign.remainingToThreshold(): ${viewRemainingGas.toString()} gas`);
  console.log(`- factory.getDeployedCampaigns(): ${viewFactoryAllGas.toString()} gas`);
  console.log(`- factory.getDeployedCampaignsPaginated(0, 10): ${viewFactoryPaginatedGas.toString()} gas`);

  // Print JSON metrics for precise markdown generation
  console.log("\nMETRICS_JSON_START");
  console.log(JSON.stringify(metrics, (key, value) => typeof value === "bigint" ? value.toString() : value));
  console.log("METRICS_JSON_END");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
