import React, { useState, useEffect } from "react";
import { ethers, Contract, BrowserProvider } from "ethers";
import { ERC20_ABI } from "../contracts/contracts";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  factoryAddress: string;
  defaultFundingToken: string;
  defaultRewardToken: string;
  provider: BrowserProvider | null;
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
  provider,
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

  const [fundingDecimals, setFundingDecimals] = useState<number>(18);
  const [rewardDecimals, setRewardDecimals] = useState<number>(18);
  const [fundingSymbol, setFundingSymbol] = useState<string>("FND");
  const [rewardSymbol, setRewardSymbol] = useState<string>("RWD");

  useEffect(() => {
    let isCancelled = false;
    const loadTokenInfo = async () => {
      if (!provider) return;

      if (ethers.isAddress(fundingToken)) {
        try {
          const f = new Contract(fundingToken, ERC20_ABI, provider);
          const [sym, dec] = await Promise.all([f.symbol(), f.decimals()]);
          if (!isCancelled) {
            setFundingSymbol(sym);
            setFundingDecimals(Number(dec));
          }
        } catch {
          if (!isCancelled) {
            setFundingSymbol("FND");
            setFundingDecimals(18);
          }
        }
      }

      if (ethers.isAddress(rewardToken)) {
        try {
          const r = new Contract(rewardToken, ERC20_ABI, provider);
          const [sym, dec] = await Promise.all([r.symbol(), r.decimals()]);
          if (!isCancelled) {
            setRewardSymbol(sym);
            setRewardDecimals(Number(dec));
          }
        } catch {
          if (!isCancelled) {
            setRewardSymbol("RWD");
            setRewardDecimals(18);
          }
        }
      }
    };

    loadTokenInfo();
    return () => {
      isCancelled = true;
    };
  }, [fundingToken, rewardToken, provider]);

  if (!isOpen) return null;

  const isSameToken =
    ethers.isAddress(fundingToken) &&
    ethers.isAddress(rewardToken) &&
    fundingToken.toLowerCase() === rewardToken.toLowerCase();

  // Multi-decimal calculation per ADR-004
  const rateScalar = 18 + rewardDecimals - fundingDecimals;
  let rewardRateBigInt = 0n;
  try {
    if (rateScalar >= 0) {
      rewardRateBigInt = ethers.parseUnits(rewardRateInput || "0", rateScalar);
    } else {
      rewardRateBigInt =
        ethers.parseUnits(rewardRateInput || "0", 0) / 10n ** BigInt(-rateScalar);
    }
  } catch {
    rewardRateBigInt = 0n;
  }

  let thresholdBigInt = 0n;
  try {
    thresholdBigInt = ethers.parseUnits(thresholdInput || "0", fundingDecimals);
  } catch {
    thresholdBigInt = 0n;
  }

  const requiredCollateral =
    thresholdBigInt > 0n && rewardRateBigInt > 0n
      ? (thresholdBigInt * rewardRateBigInt) / 10n ** 18n
      : 0n;

  const handleApprove = async () => {
    if (isSameToken) {
      alert("Funding token and Reward token cannot be the same address.");
      return;
    }
    try {
      await onApprove(rewardToken, factoryAddress, requiredCollateral);
      setStep("create");
    } catch (err: any) {
      alert("Approval failed: " + err.message);
    }
  };

  const handleCreate = async () => {
    if (isSameToken) {
      alert("Funding token and Reward token cannot be the same address.");
      return;
    }
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

        {isSameToken && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid var(--accent-danger)",
              padding: "0.75rem",
              borderRadius: "6px",
              marginBottom: "1rem",
              fontSize: "0.85rem",
              color: "#f87171",
            }}
          >
            ⚠️ Funding Token and Reward Token must be distinct contracts.
          </div>
        )}

        <div className="form-group">
          <label>
            Funding Token Contract ({fundingSymbol} — {fundingDecimals} Decimals)
          </label>
          <input
            type="text"
            className="form-input"
            value={fundingToken}
            onChange={(e) => setFundingToken(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>
            Reward Token Contract ({rewardSymbol} — {rewardDecimals} Decimals)
          </label>
          <input
            type="text"
            className="form-input"
            value={rewardToken}
            onChange={(e) => setRewardToken(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label>Funding Goal ({fundingSymbol})</label>
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
            <p className="form-help">
              {rewardRateInput} {rewardSymbol} : 1 {fundingSymbol}
            </p>
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
            {ethers.formatUnits(requiredCollateral, rewardDecimals)} {rewardSymbol}
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
            <button
              className="btn btn-primary"
              onClick={handleApprove}
              disabled={txPending || isSameToken || requiredCollateral === 0n}
            >
              {txPending ? "Approving..." : `Step 1: Approve ${rewardSymbol} Collateral`}
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleCreate}
              disabled={txPending || isSameToken || requiredCollateral === 0n}
            >
              {txPending ? "Deploying..." : "Step 2: Deploy Campaign"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
