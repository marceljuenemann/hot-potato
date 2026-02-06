import { BrowserProvider } from "ethers";

/**
 * Simple MetaMask provider.
 *
 * TODO: Support WalletConnect and more.
 */
export async function browserProviderForChain(chainId: bigint): Promise<BrowserProvider> {
  if ((window as any).ethereum == null) throw new Error("MetaMask not installed");
  const provider = new BrowserProvider((window as any).ethereum);
  await provider.send('wallet_switchEthereumChain', [{
    chainId: '0x' + chainId.toString(16)
  }]);
  const network = await provider.getNetwork();
  if (network.chainId !== chainId) {
    throw new Error(`Connected to wrong network: ${network.chainId}, expected ${chainId}`);
  }
  return provider;
}
