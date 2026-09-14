import React from "react";

interface HeaderProps {
  account: string | null;
  chainId: bigint | null;
  balance: string;
  isConnecting: boolean;
  onConnect: () => void;
  onSwitchNetwork: (chainId: number) => void;
  onOpenFaucet: () => void;
  onOpenCreate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  chainId,
  balance,
  isConnecting,
  onConnect,
  onSwitchNetwork,
  onOpenFaucet,
  onOpenCreate,
}) => {
  const isSepolia = chainId === 11155111n;
  const isHardhat = chainId === 31337n;

  const getNetworkName = () => {
    if (isSepolia) return "Sepolia Testnet";
    if (isHardhat) return "Hardhat Local (31337)";
    if (chainId) return `Chain ${chainId.toString()}`;
    return "Disconnected";
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-group">
          <div className="logo-badge">AON</div>
          <div className="title-group">
            <h1>All-or-Nothing Crowdfunding</h1>
            <p>UniTO INF0422 Blockchain Protocol</p>
          </div>
        </div>

        <div className="header-actions">
          {account && (
            <>
              <button className="btn btn-secondary" onClick={onOpenFaucet}>
                🚰 Faucet
              </button>
              <button className="btn btn-primary" onClick={onOpenCreate}>
                + New Campaign
              </button>
              <div
                className="btn btn-secondary"
                style={{ cursor: "pointer" }}
                onClick={() => onSwitchNetwork(isHardhat ? 11155111 : 31337)}
                title="Click to toggle network"
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: isHardhat || isSepolia ? "#10b981" : "#f59e0b",
                    display: "inline-block",
                  }}
                />
                {getNetworkName()}
              </div>
            </>
          )}

          {account ? (
            <div className="btn btn-secondary" style={{ fontFamily: "var(--font-mono)" }}>
              <span>{parseFloat(balance).toFixed(3)} ETH</span>
              <span style={{ color: "var(--text-muted)" }}>|</span>
              <span>
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </span>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={onConnect} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect MetaMask"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
