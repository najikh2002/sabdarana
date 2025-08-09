import { ethers } from 'ethers';
import {
	currentAddress,
	loading,
	balance,
	reward,
	networkError
} from '$lib/stores/walletState';
import abi from '$lib/contracts/abi'; // pastikan ini benar

export async function connectWallet() {
	loading.set(true);
	try {
		const provider = new ethers.BrowserProvider(window.ethereum);
		const signer = await provider.getSigner();
		const address = await signer.getAddress();
		currentAddress.set(address);

		const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
		const userBalance = await contract.balanceOf(address);
		balance.set(userBalance);
	} catch (err) {
		console.error(err);
		networkError.set(String(err));
	} finally {
		loading.set(false);
	}
}
