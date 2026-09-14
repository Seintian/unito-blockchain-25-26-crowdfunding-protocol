import React, { useState } from "react";
import { ethers } from "ethers";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  factoryAddress: string;
  defaultFundingToken: string;
  defaultRewardToken: string;
  onCreateCampaign: (
    fundingToken: string,
    rewardToken: string,
    threshold: bigint,
    rewardRate: bigint,
    durationSeconds: number
  ) => Promise<void>;
  onApprove: (tokenAddress: string, spender: string, amount: bigint) => Promise<void>;
  txPending: boolean;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  factoryAddress,
  defaultFundingToken,
  defaultRewardToken,
  onCreateCampaign,
  onApprove,
  txPending,
}) => {
  const [fundingToken, setFundingToken] = useState(defaultFundingToken);
  const [rewardToken, setRewardToken] = useState(defaultRewardToken);
  const [thresholdInput, setThresholdInput] = useState("5000");
  const [rewardRateInput, setRewardRateInput] = useState("2");
  const [durationDays, setDurationDays] = useState("14");
  const [step, setStep] = useState<"approve" | "create">("approve");

  if (!isOpen) return null;

  const thresholdBigInt = ethers.parseEther(thresholdInput || "0");
  const rewardRateBigInt = ethers.parseEther(rewardRateInput || "0");
  const requiredCollateral =
    (thresholdBigInt * rewardRateBigInt) / ethers.parseEther("1");

  const handleApprove = async () => {
    try {
      await onApprove(rewardToken, factoryAddress, requiredCollateral);
      setStep("create");
    } catch (err: any) {
      alert("Approval failed: " + err.message);
    }
  };

  const handleCreate = async () => {
    try {
      const durationSeconds = Number(durationDays) * 24 * 60 * 60;
      await onCreateCampaign(
        fundingToken,
        rewardToken,
        thresholdBigInt,
        rewardRateBigInt,
        durationSeconds
      );
      onClose();
    } catch (err: any) {
      alert("Creation failed: " + err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create Crowdfunding Campaign</h2>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: "0.25rem 0.5rem" }}>
            ✕
          </button>
        </div>

        <div className="form-group">
          <label>Funding Token Contract</label>
          <input
            type="text"
            className="form-input"
            value={fundingToken}
            onChange={(e) => setFundingToken(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Reward Token Contract</label>
          <input
            type="text"
            className="form-input"
            value={rewardToken}
            onChange={(e) => setRewardToken(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label>Funding Goal (Threshold)</label>
            <input
              type="number"
              className="form-input"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Reward Multiplier</label>
            <input
              type="number"
              className="form-input"
              value={rewardRateInput}
              onChange={(e) => setRewardRateInput(e.target.value)}
            />
            <p className="form-help">{rewardRateInput} Reward : 1 Funding</p>
          </div>
        </div>

        <div className="form-group">
          <label>Duration (Days)</label>
          <input
            type="number"
            className="form-input"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
          />
        </div>

        <div
          style={{
            background: "#1f2937",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Mandatory Upfront Escrow Collateral:
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#a855f7" }}>
            {ethers.formatEther(requiredCollateral)} Reward Tokens
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            100% of required reward tokens must be deposited into escrow to eliminate counterparty risk.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={txPending}>
            Cancel
          </button>
          {step === "approve" ? (
            <button className="btn btn-primary" onClick={handleApprove} disabled={txPending}>
              {txPending ? "Approving..." : "Step 1: Approve Collateral"}
            </button>
          ) : (
            <button className="btn btn-success" onClick={handleCreate} disabled={txPending}>
              {txPending ? "Deploying..." : "Step 2: Deploy Campaign"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
