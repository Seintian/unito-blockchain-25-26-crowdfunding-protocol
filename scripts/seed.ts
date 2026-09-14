import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { CrowdfundingFactory, MockERC20, CrowdfundingCampaign } from "../typechain-types";

async function main() {
  const [deployer, creator, backer1, backer2] = await ethers.getSigners();
  const ONE_DAY = 24 * 60 * 60;

  const deployedPath = path.join(__dirname, "../deployed-addresses.json");
  let factoryAddress: string;
  let fundingTokenAddress: string;
  let rewardTokenAddress: string;

  // Check if deployed contract already exists on this network
  let needsDeploy = true;
  if (fs.existsSync(deployedPath)) {
    const deployedData = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
    const code = await ethers.provider.getCode(deployedData.factory);
    if (code !== "0x") {
      needsDeploy = false;
      factoryAddress = deployedData.factory;
      fundingTokenAddress = deployedData.fundingToken;
      rewardTokenAddress = deployedData.rewardToken;
    }
  }

  if (needsDeploy) {
    console.log(`No active contracts found on ${network.name}. Deploying fresh contracts...`);
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const fToken = await MockERC20Factory.deploy("USD Coin Mock", "USDC", 18);
    await fToken.waitForDeployment();
    fundingTokenAddress = await fToken.getAddress();

    const rToken = await MockERC20Factory.deploy("Project Governance Token", "GOV", 18);
    await rToken.waitForDeployment();
    rewardTokenAddress = await rToken.getAddress();

    const FactoryContract = await ethers.getContractFactory("CrowdfundingFactory");
    const fact = await FactoryContract.deploy();
    await fact.waitForDeployment();
    factoryAddress = await fact.getAddress();

    const deployedData = {
      network: network.name,
      chainId: (await ethers.provider.getNetwork()).chainId.toString(),
      factory: factoryAddress,
      fundingToken: fundingTokenAddress,
      rewardToken: rewardTokenAddress,
      deployedAt: new Date().toISOString(),
    };
    fs.writeFileSync(deployedPath, JSON.stringify(deployedData, null, 2));
    console.log(`Fresh contracts deployed and addresses saved to ${deployedPath}`);
  }

  const factory = (await ethers.getContractAt(
    "CrowdfundingFactory",
    factoryAddress!
  )) as CrowdfundingFactory;
  const fundingToken = (await ethers.getContractAt(
    "MockERC20",
    fundingTokenAddress!
  )) as MockERC20;
  const rewardToken = (await ethers.getContractAt(
    "MockERC20",
    rewardTokenAddress!
  )) as MockERC20;

  console.log("Seeding demo campaigns...");
  // Mint tokens to signers
  await fundingToken.mint(backer1.address, ethers.parseEther("50000"));
  await fundingToken.mint(backer2.address, ethers.parseEther("50000"));
  await rewardToken.mint(creator.address, ethers.parseEther("100000"));

  // Creator approves factory for collateral
  await rewardToken.connect(creator).approve(factoryAddress!, ethers.parseEther("100000"));

  // 1. Create Active Campaign (5,000 threshold, 2:1 reward, 14 days duration)
  console.log("Creating Active Campaign (Decentralized Clean Energy Microgrid)...");
  const threshold1 = ethers.parseEther("5000");
  const rewardRate1 = ethers.parseEther("2");
  const duration1 = ONE_DAY * 14;

  const tx1 = await factory.connect(creator).createCampaign(
    fundingTokenAddress!,
    rewardTokenAddress!,
    threshold1,
    rewardRate1,
    duration1
  );
  await tx1.wait();

  const campaigns = await factory.getDeployedCampaigns();
  const campaign1Address = campaigns[campaigns.length - 1];
  console.log(`Active Campaign deployed at: ${campaign1Address}`);

  // Backer1 pledges 2,000 to Active Campaign
  await fundingToken.connect(backer1).approve(campaign1Address, ethers.parseEther("2000"));
  const c1 = (await ethers.getContractAt(
    "CrowdfundingCampaign",
    campaign1Address
  )) as CrowdfundingCampaign;
  await c1.connect(backer1).pledge(ethers.parseEther("2000"));
  console.log(`Backer 1 pledged 2,000 USDC to Campaign 1 (Total: 2,000 / 5,000)`);

  // 2. Create Successful Campaign (1,000 threshold, 1.5:1 reward, 7 days duration)
  console.log("Creating Successful Campaign (Autonomous AI Agent Infrastructure)...");
  const threshold2 = ethers.parseEther("1000");
  const rewardRate2 = ethers.parseEther("1.5");
  const duration2 = ONE_DAY * 7;

  const tx2 = await factory.connect(creator).createCampaign(
    fundingTokenAddress!,
    rewardTokenAddress!,
    threshold2,
    rewardRate2,
    duration2
  );
  await tx2.wait();

  const campaignsAfter2 = await factory.getDeployedCampaigns();
  const campaign2Address = campaignsAfter2[campaignsAfter2.length - 1];
  console.log(`Successful Campaign deployed at: ${campaign2Address}`);

  const c2 = (await ethers.getContractAt(
    "CrowdfundingCampaign",
    campaign2Address
  )) as CrowdfundingCampaign;
  await fundingToken.connect(backer1).approve(campaign2Address, ethers.parseEther("600"));
  await c2.connect(backer1).pledge(ethers.parseEther("600"));
  await fundingToken.connect(backer2).approve(campaign2Address, ethers.parseEther("400"));
  await c2.connect(backer2).pledge(ethers.parseEther("400"));
  console.log(
    `Backers met threshold on Campaign 2! State is now: ${await c2.state()} (1 = Successful)`
  );

  console.log("==================================================");
  console.log("Seeding complete! 2 live campaigns configured.");
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
