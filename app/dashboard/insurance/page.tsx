"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Contract ABI (simplified to include only the functions we need)
const ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_beneficiary",
        type: "address",
      },
    ],
    name: "addBenificiary",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "depositePremium",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "beneficiaries",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "individualdeposite",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]

// Contract address on Core testnet
const CONTRACT_ADDRESS = "0x601488dbbb08b80fbc33bef553a6b39a7b454d85"

export default function InsurancePage() {
  const [account, setAccount] = useState("")
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("")
  const [premiumAmount, setPremiumAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState({ type: "", message: "" })
  const [userDeposit, setUserDeposit] = useState("0")
  const [userBeneficiary, setUserBeneficiary] = useState("")
  const [activeTab, setActiveTab] = useState("deposit")

  // Connect to wallet and setup contract
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
        const accounts = await provider.send("eth_requestAccounts", [])

        setAccount(accounts[0])
        setProvider(provider)
        setContract(contract)

        // Get user's deposit and beneficiary
        await updateUserInfo(accounts[0], contract)
      } else {
        showNotification("error", "Please install MetaMask to use this application")
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      showNotification("error", "Failed to connect wallet")
    }
  }

  const updateUserInfo = async (userAddress: string, contract: ethers.Contract) => {
    try {
      const deposit = await contract.individualdeposite(userAddress)
      const beneficiary = await contract.beneficiaries(userAddress)

      setUserDeposit(ethers.formatEther(deposit))
      setUserBeneficiary(beneficiary !== ethers.ZeroAddress ? beneficiary : "")
    } catch (error) {
      console.error("Error fetching user info:", error)
    }
  }

  // Add beneficiary function
  const addBeneficiary = async () => {
    if (!contract) return showNotification("error", "Please connect your wallet first")
    if (!ethers.isAddress(beneficiaryAddress)) return showNotification("error", "Invalid address format")

    setLoading(true)
    try {
      const tx = await contract.addBenificiary(beneficiaryAddress)
      showNotification("loading", "Adding beneficiary... Please wait for confirmation")
      await tx.wait()
      showNotification("success", "Beneficiary added successfully")
      setBeneficiaryAddress("")

      // Update user info
      if (account) {
        await updateUserInfo(account, contract)
      }
    } catch (error: any) {
      console.error("Error adding beneficiary:", error)
      showNotification("error", error.message || "Failed to add beneficiary")
    } finally {
      setLoading(false)
    }
  }

  // Deposit premium function
  const depositPremium = async () => {
    if (!contract) return showNotification("error", "Please connect your wallet first")
    if (!premiumAmount || Number.parseFloat(premiumAmount) <= 0)
      return showNotification("error", "Please enter a valid amount")

    setLoading(true)
    try {
      const amountInWei = ethers.parseEther(premiumAmount)
      const tx = await contract.depositePremium({ value: amountInWei })
      showNotification("loading", "Depositing premium... Please wait for confirmation")
      await tx.wait()
      showNotification("success", "Premium deposited successfully")
      setPremiumAmount("")

      // Update user info
      if (account) {
        await updateUserInfo(account, contract)
      }
    } catch (error: any) {
      console.error("Error depositing premium:", error)
      showNotification("error", error.message || "Failed to deposit premium")
    } finally {
      setLoading(false)
    }
  }

  // Claim funds function
  const claimFunds = async () => {
    if (!contract) return showNotification("error", "Please connect your wallet first")

    setLoading(true)
    try {
      const tx = await contract.claim()
      showNotification("loading", "Claiming funds... Please wait for confirmation")
      await tx.wait()
      showNotification("success", "Funds claimed successfully")

      // Update user info
      if (account) {
        await updateUserInfo(account, contract)
      }
    } catch (error: any) {
      console.error("Error claiming funds:", error)
      showNotification("error", error.message || "Failed to claim funds")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to show notifications
  const showNotification = (type: string, message: string) => {
    setNotification({ type, message })
    if (type !== "loading") {
      setTimeout(() => setNotification({ type: "", message: "" }), 5000)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Insurance</h1>

      <div className="min-h-screen bg-transparent text-white">
        <div className="max-w-4xl mx-auto">
          {!account ? (
            <div className="flex justify-center items-center">
              <Card className="w-full max-w-md backdrop-blur-md bg-gray-900 rounded-2xl overflow-hidden shadow-xl p-8 border border-purple-400/20">
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-6">
                    <div className="p-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-lg">
                      <Wallet className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2 text-cyan-300">Connect Your Wallet</CardTitle>
                  <CardDescription className="text-purple-200">
                    Connect your wallet to access William Insurance features
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Button
                    onClick={connectWallet}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 py-6 rounded-xl font-medium text-lg shadow-lg transition-all duration-300"
                  >
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <Card className="mb-8 p-4 backdrop-blur-sm bg-gray-900 rounded-xl">
                <CardContent className="p-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <p className="text-sm text-purple-200">Connected Account</p>
                    <p className="font-mono text-sm truncate max-w-[300px] text-white">{account}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-sm text-purple-200">Your Premium Balance</p>
                    <p className="font-bold text-xl text-cyan-300">{userDeposit} Core</p>
                  </div>
                </CardContent>
              </Card>

              {notification.message && (
                <Alert
                  className={`mb-6 backdrop-blur-sm border-0 shadow-lg animate-fadeIn ${
                    notification.type === "error"
                      ? "bg-red-500/20 text-red-200"
                      : notification.type === "success"
                        ? "bg-green-500/20 text-green-200"
                        : "bg-blue-500/20 text-blue-200"
                  }`}
                >
                  {notification.type === "error" && <AlertCircle className="h-5 w-5" />}
                  {notification.type === "success" && <CheckCircle2 className="h-5 w-5" />}
                  {notification.type === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
                  <AlertTitle className="font-semibold">
                    {notification.type === "error"
                      ? "Error"
                      : notification.type === "success"
                        ? "Success"
                        : "Processing"}
                  </AlertTitle>
                  <AlertDescription>{notification.message}</AlertDescription>
                </Alert>
              )}

              <Card className="backdrop-blur-md bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
                <div className="grid grid-cols-3 border-b border-white/10">
                  {["deposit", "beneficiary", "claim"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-2 text-center transition-all duration-300 ${
                        activeTab === tab
                          ? "bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white font-medium"
                          : "text-purple-200 hover:bg-white/5"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <CardContent className="p-6">
                  {activeTab === "deposit" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-semibold mb-2 text-cyan-300">Deposit Premium</h2>
                        <p className="text-purple-200 mb-4">Deposit Core to your insurance premium account</p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="amount" className="text-sm font-medium text-purple-100">
                            Amount (Core)
                          </label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="0.1"
                            value={premiumAmount}
                            onChange={(e) => setPremiumAmount(e.target.value)}
                            step="0.01"
                            min="0"
                            className="bg-white/10 border-purple-400/30 text-white placeholder:text-purple-300/50 focus:border-cyan-400 transition-all"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={depositPremium}
                        disabled={loading || !premiumAmount}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 py-6 rounded-xl font-medium text-lg shadow-lg transition-all duration-300"
                      >
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        Deposit Premium
                      </Button>
                    </div>
                  )}

                  {activeTab === "beneficiary" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-semibold mb-2 text-cyan-300">Add Beneficiary</h2>
                        <p className="text-purple-200 mb-4">Add a beneficiary who can claim your insurance funds</p>
                      </div>
                      <div className="space-y-4">
                        {userBeneficiary && (
                          <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-400/20">
                            <p className="text-sm text-purple-200">Current Beneficiary</p>
                            <p className="font-mono text-sm break-all text-cyan-300">{userBeneficiary}</p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <label htmlFor="beneficiary" className="text-sm font-medium text-purple-100">
                            Beneficiary Address
                          </label>
                          <Input
                            id="beneficiary"
                            placeholder="0x..."
                            value={beneficiaryAddress}
                            onChange={(e) => setBeneficiaryAddress(e.target.value)}
                            className="bg-white/10 border-purple-400/30 text-white placeholder:text-purple-300/50 focus:border-cyan-400 transition-all"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={addBeneficiary}
                        disabled={loading || !beneficiaryAddress}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 py-6 rounded-xl font-medium text-lg shadow-lg transition-all duration-300"
                      >
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        Add Beneficiary
                      </Button>
                    </div>
                  )}

                  {activeTab === "claim" && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-semibold mb-2 text-cyan-300">Claim Funds</h2>
                        <p className="text-purple-200 mb-4">Claim insurance funds as a beneficiary</p>
                      </div>
                      <div className="p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-400/20">
                        <p className="text-purple-100 mb-3">
                          This function allows beneficiaries to claim the insurance funds (0.1 Core) when the conditions
                          are met.
                        </p>
                      </div>
                      <Button
                        onClick={claimFunds}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 py-6 rounded-xl font-medium text-lg shadow-lg transition-all duration-300"
                      >
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        Claim Funds
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

