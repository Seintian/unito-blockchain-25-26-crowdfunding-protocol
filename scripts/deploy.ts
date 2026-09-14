import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("==================================================");
  console.log(`Deploying Crowdfunding Protocol on network: ${network.name}`);
  console.log(`Deployer address: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);
  console.log("==================================================");

  // 1. Deploy Mock Tokens for local / Sepolia testnet demo
  console.log("Deploying Mock ERC-20 Tokens...");
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");

  const fundingToken = await MockERC20Factory.deploy("USD Coin Mock", "USDC", 18);
  await fundingToken.waitForDeployment();
  const fundingTokenAddress = await fundingToken.getAddress();
  console.log(`Funding Token (USDC) deployed at: ${fundingTokenAddress}`);

  const rewardToken = await MockERC20Factory.deploy("Project Governance Token", "GOV", 18);
  await rewardToken.waitForDeployment();
  const rewardTokenAddress = await rewardToken.getAddress();
  console.log(`Reward Token (GOV) deployed at: ${rewardTokenAddress}`);

  // 2. Deploy CrowdfundingFactory
  console.log("Deploying CrowdfundingFactory...");
  const FactoryContract = await ethers.getContractFactory("CrowdfundingFactory");
  const factory = await FactoryContract.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`CrowdfundingFactory deployed at: ${factoryAddress}`);

  // 3. Save addresses for frontend consumption
  const deployedData = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    factory: factoryAddress,
    fundingToken: fundingTokenAddress,
    rewardToken: rewardTokenAddress,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "../deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployedData, null, 2));
  console.log(`Saved deployment addresses to: ${outputPath}`);
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
