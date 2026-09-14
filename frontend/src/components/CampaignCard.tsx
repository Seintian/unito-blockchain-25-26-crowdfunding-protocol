import React, { useState } from "react";
import { ethers } from "ethers";
import { CampaignData } from "../hooks/useCampaigns";

interface CampaignCardProps {
  campaign: CampaignData;
  account: string | null;
  onApprove: (tokenAddress: string, spender: string, amount: bigint) => Promise<void>;
  onPledge: (campaignAddress: string, amount: bigint) => Promise<void>;
  onWithdraw: (campaignAddress: string, amount: bigint) => Promise<void>;
  onClaimReward: (campaignAddress: string) => Promise<void>;
  onClaimRefund: (campaignAddress: string) => Promise<void>;
  onClaimFunds: (campaignAddress: string) => Promise<void>;
  onRecoverCollateral: (campaignAddress: string) => Promise<void>;
  txPending: boolean;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  account,
  onApprove,
  onPledge,
  onWithdraw,
  onClaimReward,
  onClaimRefund,
  onClaimFunds,
  onRecoverCollateral,
  txPending,
}) => {
  const [pledgeInput, setPledgeInput] = useState("500");
  const [withdrawInput, setWithdrawInput] = useState("");

  const formatUnits = (val: bigint, decimals: number = 18) => {
    return parseFloat(ethers.formatUnits(val, decimals)).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  };

  const percentRaised = Math.min(
    100,
    campaign.threshold > 0n
      ? Number((campaign.totalRaised * 10000n) / campaign.threshold) / 100
      : 0
  );

  const now = Math.floor(Date.now() / 1000);
  const secondsRemaining = campaign.deadline - now;
  const isExpired = secondsRemaining <= 0;

  const formatTime = () => {
    if (isExpired) return "Deadline Passed";
    const days = Math.floor(secondsRemaining / 86400);
    const hours = Math.floor((secondsRemaining % 86400) / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h ${minutes}m left`;
  };

  const stateBadge = () => {
    if (campaign.state === 1) return <span className="badge badge-successful">Successful</span>;
    if (campaign.state === 2 || isExpired) return <span className="badge badge-expired">Expired</span>;
    return <span className="badge badge-active">Active</span>;
  };

  const isCreator = account && campaign.creator.toLowerCase() === account.toLowerCase();
  const pledgeAmountBigInt = ethers.parseUnits(pledgeInput || "0", campaign.fundingDecimals);
  const needsApproval = campaign.userFundingAllowance < pledgeAmountBigInt;

  const handleApprove = async () => {
    try {
      await onApprove(campaign.fundingTokenAddress, campaign.address, ethers.MaxUint256);
    } catch (err: any) {
      alert("Approve failed: " + err.message);
    }
  };

  const handlePledge = async () => {
    try {
      await onPledge(campaign.address, pledgeAmountBigInt);
      setPledgeInput("");
    } catch (err: any) {
      alert("Pledge failed: " + err.message);
    }
  };

  const handleWithdraw = async () => {
    try {
      const amountToWithdraw = withdrawInput
        ? ethers.parseUnits(withdrawInput, campaign.fundingDecimals)
        : campaign.userContribution;
      await onWithdraw(campaign.address, amountToWithdraw);
      setWithdrawInput("");
    } catch (err: any) {
      alert("Withdraw failed: " + err.message);
    }
  };

  return (
    <div className="campaign-card">
      <div className="card-header">
        <div>
          <div className="card-title" title={campaign.address}>
            Campaign {campaign.address.substring(0, 6)}...
            {campaign.address.substring(campaign.address.length - 4)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Creator: {campaign.creator.substring(0, 6)}...
            {campaign.creator.substring(campaign.creator.length - 4)}{" "}
            {isCreator && <strong style={{ color: "#a855f7" }}>(You)</strong>}
          </div>
        </div>
        {stateBadge()}
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${percentRaised}%` }} />
      </div>

      <div className="campaign-metrics">
        <div className="metric-item">
          <span className="metric-label">Raised / Goal</span>
          <span className="metric-val">
            {formatUnits(campaign.totalRaised, campaign.fundingDecimals)} /{" "}
            {formatUnits(campaign.threshold, campaign.fundingDecimals)} {campaign.fundingSymbol}
          </span>
        </div>

        <div className="metric-item">
          <span className="metric-label">Progress</span>
          <span className="metric-val">{percentRaised.toFixed(1)}%</span>
        </div>

        <div className="metric-item">
          <span className="metric-label">Reward Rate</span>
          <span className="metric-val">
            {formatUnits(campaign.rewardRate, 18)} {campaign.rewardSymbol} / {campaign.fundingSymbol}
          </span>
        </div>

        <div className="metric-item">
          <span className="metric-label">Timeline</span>
          <span className="metric-val">{formatTime()}</span>
        </div>
      </div>

      {/* User's contribution badge */}
      {account && campaign.userContribution > 0n && (
        <div
          style={{
            background: "#1f2937",
            padding: "0.6rem 0.8rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            fontSize: "0.8rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Your Pledge:</span>
            <strong>
              {formatUnits(campaign.userContribution, campaign.fundingDecimals)}{" "}
              {campaign.fundingSymbol}
            </strong>
          </div>
        </div>
      )}

      {/* Card Actions */}
      <div className="card-actions">
        {/* Scenario 1: Campaign is Active */}
        {campaign.state === 0 && !isExpired && (
          <>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="number"
                className="form-input"
                placeholder="Pledge amount"
                value={pledgeInput}
                onChange={(e) => setPledgeInput(e.target.value)}
                disabled={!account || txPending}
              />
              {needsApproval ? (
                <button
                  className="btn btn-primary"
                  onClick={handleApprove}
                  disabled={!account || txPending}
                >
                  Approve
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handlePledge}
                  disabled={!account || txPending || !pledgeInput}
                >
                  Pledge
                </button>
              )}
            </div>

            {/* Flexible Early Withdrawal before threshold */}
            {campaign.userContribution > 0n && (
              <div style={{ marginTop: "0.5rem" }}>
                <button
                  className="btn btn-secondary"
                  style={{ width: "100%", fontSize: "0.8rem" }}
                  onClick={handleWithdraw}
                  disabled={txPending}
                >
                  Withdraw Pledge ({formatUnits(campaign.userContribution, campaign.fundingDecimals)}{" "}
                  {campaign.fundingSymbol})
                </button>
              </div>
            )}
          </>
        )}

        {/* Scenario 2: Campaign is Successful */}
        {campaign.state === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {account && campaign.userContribution > 0n && !campaign.userRewardsClaimed && (
              <button
                className="btn btn-success"
                onClick={() => onClaimReward(campaign.address)}
                disabled={txPending}
              >
                Claim Rewards (
                {formatUnits(
                  (campaign.userContribution * campaign.rewardRate) / ethers.parseEther("1"),
                  campaign.rewardDecimals
                )}{" "}
                {campaign.rewardSymbol})
              </button>
            )}

            {account && campaign.userContribution > 0n && campaign.userRewardsClaimed && (
              <div style={{ color: "#34d399", fontSize: "0.85rem", textAlign: "center" }}>
                ✓ Rewards Claimed
              </div>
            )}

            {isCreator && !campaign.creatorFundsClaimed && (
              <button
                className="btn btn-primary"
                onClick={() => onClaimFunds(campaign.address)}
                disabled={txPending}
              >
                Withdraw Total Funds (
                {formatUnits(campaign.totalRaised, campaign.fundingDecimals)}{" "}
                {campaign.fundingSymbol})
              </button>
            )}

            {isCreator && campaign.creatorFundsClaimed && (
              <div style={{ color: "#818cf8", fontSize: "0.85rem", textAlign: "center" }}>
                ✓ Creator Funds Claimed
              </div>
            )}
          </div>
        )}

        {/* Scenario 3: Campaign is Expired */}
        {(campaign.state === 2 || (campaign.state === 0 && isExpired)) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {account && campaign.userContribution > 0n && !campaign.userRefundsClaimed && (
              <button
                className="btn btn-danger"
                onClick={() => onClaimRefund(campaign.address)}
                disabled={txPending}
              >
                Claim 100% Refund (
                {formatUnits(campaign.userContribution, campaign.fundingDecimals)}{" "}
                {campaign.fundingSymbol})
              </button>
            )}

            {account && campaign.userContribution > 0n && campaign.userRefundsClaimed && (
              <div style={{ color: "#34d399", fontSize: "0.85rem", textAlign: "center" }}>
                ✓ Refund Claimed
              </div>
            )}

            {isCreator && !campaign.creatorCollateralRecovered && (
              <button
                className="btn btn-secondary"
                onClick={() => onRecoverCollateral(campaign.address)}
                disabled={txPending}
              >
                Recover Reward Collateral (
                {formatUnits(campaign.rewardCollateral, campaign.rewardDecimals)}{" "}
                {campaign.rewardSymbol})
              </button>
            )}

            {isCreator && campaign.creatorCollateralRecovered && (
              <div style={{ color: "#818cf8", fontSize: "0.85rem", textAlign: "center" }}>
                ✓ Collateral Recovered
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
