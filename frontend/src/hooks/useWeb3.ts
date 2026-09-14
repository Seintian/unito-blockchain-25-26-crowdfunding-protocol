import { useState, useEffect, useCallback } from "react";
import { ethers, BrowserProvider, JsonRpcSigner } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWeb3() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateAccountState = useCallback(async (browserProvider: BrowserProvider) => {
    try {
      const net = await browserProvider.getNetwork();
      setChainId(net.chainId);

      const accounts = await browserProvider.listAccounts();
      if (accounts.length > 0) {
        const currentSigner = await browserProvider.getSigner();
        const address = await currentSigner.getAddress();
        setSigner(currentSigner);
        setAccount(address);

        const bal = await browserProvider.getBalance(address);
        setBalance(ethers.formatEther(bal));
      } else {
        setSigner(null);
        setAccount(null);
        setBalance("0");
      }
    } catch (err: any) {
      console.error("Error updating account state:", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const browserProvider = new BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      updateAccountState(browserProvider);

      const handleAccountsChanged = () => updateAccountState(browserProvider);
      const handleChainChanged = () => updateAccountState(browserProvider);

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [updateAccountState]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask or Web3 wallet is not installed.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      setProvider(browserProvider);
      await updateAccountState(browserProvider);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToNetwork = async (targetChainId: number) => {
    if (!window.ethereum) return;
    const hexChainId = "0x" + targetChainId.toString(16);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask
      if (switchError.code === 4902 && targetChainId === 31337) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hexChainId,
              chainName: "Hardhat Localhost",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      }
    }
  };

  return {
    provider,
    signer,
    account,
    chainId,
    balance,
    isConnecting,
    error,
    connectWallet,
    switchToNetwork,
    refreshBalance: () => provider && updateAccountState(provider),
  };
}
