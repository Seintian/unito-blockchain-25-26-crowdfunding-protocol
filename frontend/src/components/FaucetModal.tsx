import React, { useState } from "react";
import { ethers } from "ethers";

interface FaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
  fundingTokenAddress: string;
  rewardTokenAddress: string;
  fundingSymbol: string;
  rewardSymbol: string;
  onFaucetMint: (tokenAddress: string, amount: bigint) => Promise<void>;
  txPending: boolean;
}

export const FaucetModal: React.FC<FaucetModalProps> = ({
  isOpen,
  onClose,
  fundingTokenAddress,
  rewardTokenAddress,
  fundingSymbol,
  rewardSymbol,
  onFaucetMint,
  txPending,
}) => {
  const [fundingAmount, setFundingAmount] = useState("5000");
  const [rewardAmount, setRewardAmount] = useState("10000");

  if (!isOpen) return null;

  const handleMintFunding = async () => {
    try {
      const amount = ethers.parseEther(fundingAmount);
      await onFaucetMint(fundingTokenAddress, amount);
    } catch (err: any) {
      alert("Mint failed: " + err.message);
    }
  };

  const handleMintReward = async () => {
    try {
      const amount = ethers.parseEther(rewardAmount);
      await onFaucetMint(rewardTokenAddress, amount);
    } catch (err: any) {
      alert("Mint failed: " + err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>🚰 Testnet Token Faucet</h2>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: "0.25rem 0.5rem" }}>
            ✕
          </button>
        </div>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Mint free test tokens directly to your connected account to back projects or create campaigns.
        </p>

        <div className="form-group">
          <label>Funding Token ({fundingSymbol || "USDC"})</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="number"
              className="form-input"
              value={fundingAmount}
              onChange={(e) => setFundingAmount(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleMintFunding} disabled={txPending}>
              {txPending ? "Minting..." : "Mint"}
            </button>
          </div>
          <p className="form-help">Contract: {fundingTokenAddress}</p>
        </div>

        <div className="form-group">
          <label>Reward Token ({rewardSymbol || "GOV"})</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="number"
              className="form-input"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleMintReward} disabled={txPending}>
              {txPending ? "Minting..." : "Mint"}
            </button>
          </div>
          <p className="form-help">Contract: {rewardTokenAddress}</p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
