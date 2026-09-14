import React, { useState } from "react";
import { Header } from "./components/Header";
import { CampaignCard } from "./components/CampaignCard";
import { FaucetModal } from "./components/FaucetModal";
import { CreateCampaignModal } from "./components/CreateCampaignModal";
import { useWeb3 } from "./hooks/useWeb3";
import { useCampaigns } from "./hooks/useCampaigns";
import { DEFAULT_HARDHAT_ADDRESSES } from "./contracts/contracts";
import { ethers } from "ethers";

export const App: React.FC = () => {
  const {
    provider,
    signer,
    account,
    chainId,
    balance,
    isConnecting,
    connectWallet,
    switchToNetwork,
  } = useWeb3();

  const [activeTab, setActiveTab] = useState<"all" | "active" | "successful" | "expired">("all");
  const [isFaucetOpen, setIsFaucetOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    campaigns,
    loading,
    txPending,
    error,
    approveToken,
    pledge,
    withdrawBeforeThreshold,
    claimReward,
    claimRefund,
    claimFunds,
    recoverCollateral,
    createCampaign,
    faucetMint,
    refreshCampaigns,
  } = useCampaigns(provider, signer, account);

  // Global Statistics
  const totalCampaignsCount = campaigns.length;
  const activeCount = campaigns.filter((c) => c.state === 0).length;
  const successfulCount = campaigns.filter((c) => c.state === 1).length;
  const expiredCount = campaigns.filter((c) => c.state === 2).length;

  const totalRaisedBigInt = campaigns.reduce((acc, c) => acc + c.totalRaised, 0n);
  const formattedTotalRaised = parseFloat(
    ethers.formatEther(totalRaisedBigInt)
  ).toLocaleString(undefined, { maximumFractionDigits: 2 });

  // Filtered Campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === "active" && c.state !== 0) return false;
    if (activeTab === "successful" && c.state !== 1) return false;
    if (activeTab === "expired" && c.state !== 2) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.address.toLowerCase().includes(q) ||
        c.creator.toLowerCase().includes(q) ||
        c.fundingSymbol.toLowerCase().includes(q) ||
        c.rewardSymbol.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <Header
        account={account}
        chainId={chainId}
        balance={balance}
        isConnecting={isConnecting}
        onConnect={connectWallet}
        onSwitchNetwork={switchToNetwork}
        onOpenFaucet={() => setIsFaucetOpen(true)}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      <main className="container">
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid var(--accent-danger)",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              color: "#f87171",
            }}
          >
            {error}
          </div>
        )}

        {/* Global Statistics Banner */}
        <section className="stats-banner">
          <div className="stat-card">
            <div className="stat-label">Total Volume Raised</div>
            <div className="stat-val">{formattedTotalRaised} USDC</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Campaigns</div>
            <div className="stat-val" style={{ color: "#34d399" }}>
              {activeCount}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Successful Campaigns</div>
            <div className="stat-val" style={{ color: "#818cf8" }}>
              {successfulCount}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Protocol Contracts</div>
            <div className="stat-val">{totalCampaignsCount}</div>
          </div>
        </section>

        {/* Filters and Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div className="tabs" style={{ margin: 0, border: "none" }}>
            <button
              className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All ({totalCampaignsCount})
            </button>
            <button
              className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
              onClick={() => setActiveTab("active")}
            >
              Active ({activeCount})
            </button>
            <button
              className={`tab-btn ${activeTab === "successful" ? "active" : ""}`}
              onClick={() => setActiveTab("successful")}
            >
              Successful ({successfulCount})
            </button>
            <button
              className={`tab-btn ${activeTab === "expired" ? "active" : ""}`}
              onClick={() => setActiveTab("expired")}
            >
              Expired ({expiredCount})
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              className="form-input"
              style={{ width: "240px", padding: "0.45rem 0.75rem" }}
              placeholder="Search by address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-secondary" onClick={refreshCampaigns} disabled={loading}>
              🔄
            </button>
          </div>
        </div>

        {/* Campaign Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
            Loading blockchain state...
          </div>
        ) : filteredCampaigns.length > 0 ? (
          <div className="campaign-grid">
            {filteredCampaigns.map((camp) => (
              <CampaignCard
                key={camp.address}
                campaign={camp}
                account={account}
                onApprove={approveToken}
                onPledge={pledge}
                onWithdraw={withdrawBeforeThreshold}
                onClaimReward={claimReward}
                onClaimRefund={claimRefund}
                onClaimFunds={claimFunds}
                onRecoverCollateral={recoverCollateral}
                txPending={txPending}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 1rem",
              background: "var(--bg-surface)",
              borderRadius: "16px",
              border: "1px dashed var(--border-color)",
            }}
          >
            <h3 style={{ marginBottom: "0.5rem" }}>No Campaigns Found</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Deploy a new crowdfunding campaign or start local demo seeding.
            </p>
            <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
              + Launch First Campaign
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <FaucetModal
        isOpen={isFaucetOpen}
        onClose={() => setIsFaucetOpen(false)}
        fundingTokenAddress={DEFAULT_HARDHAT_ADDRESSES.fundingToken}
        rewardTokenAddress={DEFAULT_HARDHAT_ADDRESSES.rewardToken}
        fundingSymbol="USDC"
        rewardSymbol="GOV"
        onFaucetMint={faucetMint}
        txPending={txPending}
      />

      <CreateCampaignModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        factoryAddress={DEFAULT_HARDHAT_ADDRESSES.factory}
        defaultFundingToken={DEFAULT_HARDHAT_ADDRESSES.fundingToken}
        defaultRewardToken={DEFAULT_HARDHAT_ADDRESSES.rewardToken}
        onCreateCampaign={createCampaign}
        onApprove={approveToken}
        txPending={txPending}
      />
    </div>
  );
};
export default App;
