import { useState, useEffect, useCallback } from "react";
import { Contract, BrowserProvider, JsonRpcSigner } from "ethers";
import {
  CROWDFUNDING_FACTORY_ABI,
  CROWDFUNDING_CAMPAIGN_ABI,
  ERC20_ABI,
  DEFAULT_HARDHAT_ADDRESSES,
} from "../contracts/contracts";

export interface CampaignData {
  address: string;
  creator: string;
  fundingTokenAddress: string;
  rewardTokenAddress: string;
  fundingSymbol: string;
  rewardSymbol: string;
  fundingDecimals: number;
  rewardDecimals: number;
  threshold: bigint;
  rewardRate: bigint;
  deadline: number;
  rewardCollateral: bigint;
  totalRaised: bigint;
  state: number; // 0: Active, 1: Successful, 2: Expired
  creatorFundsClaimed: boolean;
  creatorCollateralRecovered: boolean;
  userContribution: bigint;
  userRewardsClaimed: boolean;
  userRefundsClaimed: boolean;
  userFundingBalance: bigint;
  userFundingAllowance: bigint;
}

export function useCampaigns(
  provider: BrowserProvider | null,
  signer: JsonRpcSigner | null,
  account: string | null,
  factoryAddress: string = DEFAULT_HARDHAT_ADDRESSES.factory
) {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [txPending, setTxPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!provider) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Check if code exists at factory address
      const code = await provider.getCode(factoryAddress);
      if (code === "0x") {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      const factory = new Contract(factoryAddress, CROWDFUNDING_FACTORY_ABI, provider);
      const addresses: string[] = await factory.getDeployedCampaigns();

      const campaignDataList: CampaignData[] = await Promise.all(
        addresses.map(async (campAddr) => {
          const camp = new Contract(campAddr, CROWDFUNDING_CAMPAIGN_ABI, provider);

          const [
            creator,
            fundingTokenAddr,
            rewardTokenAddr,
            threshold,
            rewardRate,
            deadline,
            rewardCollateral,
            totalRaised,
            state,
            creatorFundsClaimed,
            creatorCollateralRecovered,
          ] = await Promise.all([
            camp.creator(),
            camp.fundingToken(),
            camp.rewardToken(),
            camp.threshold(),
            camp.rewardRate(),
            camp.deadline(),
            camp.rewardCollateral(),
            camp.totalRaised(),
            camp.state(),
            camp.creatorFundsClaimed(),
            camp.creatorCollateralRecovered(),
          ]);

          const fToken = new Contract(fundingTokenAddr, ERC20_ABI, provider);
          const rToken = new Contract(rewardTokenAddr, ERC20_ABI, provider);

          const [fSymbol, rSymbol, fDecimals, rDecimals] = await Promise.all([
            fToken.symbol().catch(() => "FND"),
            rToken.symbol().catch(() => "RWD"),
            fToken.decimals().catch(() => 18),
            rToken.decimals().catch(() => 18),
          ]);

          let userContribution = 0n;
          let userRewardsClaimed = false;
          let userRefundsClaimed = false;
          let userFundingBalance = 0n;
          let userFundingAllowance = 0n;

          if (account) {
            [
              userContribution,
              userRewardsClaimed,
              userRefundsClaimed,
              userFundingBalance,
              userFundingAllowance,
            ] = await Promise.all([
              camp.contributions(account).catch(() => 0n),
              camp.rewardsClaimed(account).catch(() => false),
              camp.refundsClaimed(account).catch(() => false),
              fToken.balanceOf(account).catch(() => 0n),
              fToken.allowance(account, campAddr).catch(() => 0n),
            ]);
          }

          return {
            address: campAddr,
            creator,
            fundingTokenAddress: fundingTokenAddr,
            rewardTokenAddress: rewardTokenAddr,
            fundingSymbol: fSymbol,
            rewardSymbol: rSymbol,
            fundingDecimals: Number(fDecimals),
            rewardDecimals: Number(rDecimals),
            threshold,
            rewardRate,
            deadline: Number(deadline),
            rewardCollateral,
            totalRaised,
            state: Number(state),
            creatorFundsClaimed,
            creatorCollateralRecovered,
            userContribution,
            userRewardsClaimed,
            userRefundsClaimed,
            userFundingBalance,
            userFundingAllowance,
          };
        })
      );

      setCampaigns(campaignDataList);
    } catch (err: any) {
      console.error("Error loading campaigns:", err);
      setError(err.message || "Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  }, [provider, account, factoryAddress]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Actions
  const approveToken = async (tokenAddress: string, spender: string, amount: bigint) => {
    if (!signer) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const token = new Contract(tokenAddress, ERC20_ABI, signer);
      const tx = await token.approve(spender, amount);
      await tx.wait();
      await fetchCampaigns();
    } finally {
      setTxPending(false);
    }
  };

  const pledge = async (campaignAddress: string, amount: bigint) => {
    if (!signer) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const campaign = new Contract(campaignAddress, CROWDFUNDING_CAMPAIGN_ABI, signer);
      const tx = await campaign.pledge(amount);
      await tx.wait();
      await fetchCampaigns();
    } finally {
      setTxPending(false);
    }
  };

  const withdrawBeforeThreshold = async (campaignAddress: string, amount: bigint) => {
    if (!signer) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const campaign = new Contract(campaignAddress, CROWDFUNDING_CAMPAIGN_ABI, signer);
      const tx = await campaign.withdrawBeforeThreshold(amount);
      await tx.wait();
      await fetchCampaigns();
    } finally {
      setTxPending(false);
    }
  };

  const claimReward = async (campaignAddress: string) => {
    if (!signer) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const campaign = new Contract(campaignAddress, CROWDFUNDING_CAMPAIGN_ABI, signer);
      const tx = await campaign.claimReward();
      await tx.wait();
      await fetchCampaigns();
    } finally {
      setTxPending(false);
    }
  };

  const claimRefund = async (campaignAddress: string) => {
    if (!signer) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const campaign = new Contract(campaignAddress, CROWDFUNDING_CAMPAIGN_ABI, signer);
      const tx = await campaign.claimRefund();
      await tx.wait();
      await fetchCampaigns();
    } finally {
      setTxPending(false);
    }
  };

  const claimFunds = async (campaignAddress: string) => {
    if (!signer) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const campaign = new Contract(campaignAddress, CROWDFUNDING_CAMPAIGN_ABI, signer);
      const tx = await campaign.claimFunds();
      await tx.wait();
      await fetchCampaigns();
    } finally {
      setTxPending(false);
    }
  };

  const recoverCollateral = async (campaignAddress: string) => {
    if (!signer) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const campaign = new Contract(campaignAddress, CROWDFUNDING_CAMPAIGN_ABI, signer);
      const tx = await campaign.recoverCollateral();
      await tx.wait();
      await fetchCampaigns();
    } finally {
      setTxPending(false);
    }
  };

  const createCampaign = async (
    fundingToken: string,
    rewardToken: string,
    threshold: bigint,
    rewardRate: bigint,
    durationSeconds: number
  ) => {
    if (!signer) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const factory = new Contract(factoryAddress, CROWDFUNDING_FACTORY_ABI, signer);
      const tx = await factory.createCampaign(
        fundingToken,
        rewardToken,
        threshold,
        rewardRate,
        durationSeconds
      );
      await tx.wait();
      await fetchCampaigns();
    } finally {
      setTxPending(false);
    }
  };

  const faucetMint = async (tokenAddress: string, amount: bigint) => {
    if (!signer) throw new Error("Wallet not connected");
    setTxPending(true);
    try {
      const token = new Contract(tokenAddress, ERC20_ABI, signer);
      const tx = await token.faucet(amount);
      await tx.wait();
      await fetchCampaigns();
    } finally {
      setTxPending(false);
    }
  };

  return {
    campaigns,
    loading,
    txPending,
    error,
    refreshCampaigns: fetchCampaigns,
    approveToken,
    pledge,
    withdrawBeforeThreshold,
    claimReward,
    claimRefund,
    claimFunds,
    recoverCollateral,
    createCampaign,
    faucetMint,
  };
}
