"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowDown, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// William01 ABI
const william01ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "addressToValue",
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
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "benAdd",
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
    inputs: [],
    name: "benTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "depositCore",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractBalance",
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
  {
    inputs: [],
    name: "owner",
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
        name: "_benAdd",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_percentage",
        type: "uint256",
      },
    ],
    name: "storeBenificiary",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalDeposited",
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

export default function MainDashboard() {
  const { toast } = useToast()
  const [contractAddress, setContractAddress] = useState("")
  const [balance, setBalance] = useState("0")
  const [depositAmount, setDepositAmount] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDepositing, setIsDepositing] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [isDissipating, setIsDissipating] = useState(false)
  const [hasBeneficiaries, setHasBeneficiaries] = useState(false)

  useEffect(() => {
    const storedAddress = localStorage.getItem("william_contract_address")
    if (storedAddress) {
      setContractAddress(storedAddress)
      fetchContractBalance(storedAddress)

      // Check localStorage for beneficiaries
      const storedBeneficiaries = localStorage.getItem("william_beneficiaries")
      if (storedBeneficiaries) {
        const beneficiaries = JSON.parse(storedBeneficiaries)
        if (beneficiaries.length > 0) {
          setHasBeneficiaries(true)
        } else {
          checkBeneficiaries(storedAddress)
        }
      } else {
        checkBeneficiaries(storedAddress)
      }
    }

    // Initialize with empty transactions
    setTransactions([])

    // Listen for beneficiary updates
    const handleBeneficiaryUpdate = () => {
      const storedBeneficiaries = localStorage.getItem("william_beneficiaries")
      if (storedBeneficiaries) {
        const beneficiaries = JSON.parse(storedBeneficiaries)
        setHasBeneficiaries(beneficiaries.length > 0)
      }
    }

    window.addEventListener("william_beneficiaries_updated", handleBeneficiaryUpdate)
    window.addEventListener("storage", (e) => {
      if (e.key === "william_beneficiaries") {
        handleBeneficiaryUpdate()
      }
    })

    return () => {
      window.removeEventListener("william_beneficiaries_updated", handleBeneficiaryUpdate)
      window.removeEventListener("storage", handleBeneficiaryUpdate)
    }
  }, [])

  const checkBeneficiaries = async (address: string) => {
    // Update the checkBeneficiaries function to also check localStorage
    // Add this to the beginning of the checkBeneficiaries function:
    const storedBeneficiaries = localStorage.getItem("william_beneficiaries")
    if (storedBeneficiaries) {
      const beneficiaries = JSON.parse(storedBeneficiaries)
      if (beneficiaries.length > 0) {
        setHasBeneficiaries(true)
        return
      }
    }

    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const william01Contract = new ethers.Contract(address, william01ABI, provider)

        // Create a temporary array to store beneficiary addresses
        let hasBens = false
        let index = 0
        let hasMore = true

        // Loop through benAdd array until we get an error
        while (hasMore && !hasBens) {
          try {
            const beneficiaryAddress = await william01Contract.benAdd(index)

            if (beneficiaryAddress && beneficiaryAddress !== ethers.ZeroAddress) {
              // Get the percentage for this address
              const percentageValue = await william01Contract.addressToValue(beneficiaryAddress)

              // Only count if percentage is greater than 0 (active beneficiary)
              if (Number(percentageValue) > 0) {
                hasBens = true
                break
              }

              index++
            } else {
              hasMore = false
            }
          } catch (error) {
            console.log("No more beneficiaries or error:", error)
            hasMore = false
          }
        }

        setHasBeneficiaries(hasBens)
        console.log("Has beneficiaries:", hasBens)
      }
    } catch (error) {
      console.error("Error checking beneficiaries:", error)
      setHasBeneficiaries(false)
    }
  }

  const fetchContractBalance = async (address: string) => {
    try {
      setIsLoading(true)

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const william01Contract = new ethers.Contract(address, william01ABI, provider)

        const balanceWei = await william01Contract.getContractBalance()
        const balanceEth = ethers.formatEther(balanceWei)
        console.log("Contract balance:", balanceEth)

        setBalance(balanceEth)
      }
    } catch (error) {
      console.error("Error fetching balance:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch contract balance. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!depositAmount || Number.parseFloat(depositAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount to deposit.",
      })
      return
    }

    try {
      setIsDepositing(true)

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const william01Contract = new ethers.Contract(contractAddress, william01ABI, signer)

        const amountWei = ethers.parseEther(depositAmount)
        console.log("Depositing amount (wei):", amountWei.toString())

        const tx = await william01Contract.depositCore({ value: amountWei })
        console.log("Deposit transaction submitted:", tx.hash)

        const receipt = await tx.wait()
        console.log("Deposit transaction confirmed:", receipt)

        // Update balance
        await fetchContractBalance(contractAddress)

        // Add transaction to history
        const newTransaction = {
          id: Date.now(),
          type: "Deposit",
          amount: `${depositAmount} CORE`,
          date: new Date().toISOString().split("T")[0],
          status: "Completed",
        }

        setTransactions([newTransaction, ...transactions])
        setDepositAmount("")

        toast({
          title: "Deposit successful",
          description: `Successfully deposited ${depositAmount} CORE to your contract.`,
        })
      }
    } catch (error) {
      console.error("Error depositing:", error)
      toast({
        variant: "destructive",
        title: "Deposit failed",
        description: "Failed to deposit CORE tokens. Please try again.",
      })
    } finally {
      setIsDepositing(false)
    }
  }

  const handleDissipate = async () => {
    try {
      setIsDissipating(true)

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const william01Contract = new ethers.Contract(contractAddress, william01ABI, signer)

        // Check if there are beneficiaries
        await checkBeneficiaries(contractAddress)

        if (!hasBeneficiaries) {
          toast({
            variant: "destructive",
            title: "No beneficiaries",
            description: "You need to add beneficiaries before dissipating funds.",
          })
          setIsDissipating(false)
          return
        }

        console.log("Calling benTransfer function...")

        // Call the benTransfer function directly
        const tx = await william01Contract.benTransfer()
        console.log("Dissipate transaction submitted:", tx.hash)

        // Wait for the transaction to be mined
        const receipt = await tx.wait()
        console.log("Dissipate transaction confirmed:", receipt)

        // Update balance
        await fetchContractBalance(contractAddress)

        // Add transaction to history
        const newTransaction = {
          id: Date.now(),
          type: "Dissipate",
          amount: `${balance} CORE`,
          date: new Date().toISOString().split("T")[0],
          status: "Completed",
        }

        setTransactions([newTransaction, ...transactions])

        toast({
          title: "Funds dissipated",
          description: "Successfully distributed funds to all beneficiaries.",
        })
      }
    } catch (error) {
      console.error("Error dissipating funds:", error)
      toast({
        variant: "destructive",
        title: "Transaction failed",
        description: "Failed to distribute funds. Please check if you have beneficiaries set up and try again.",
      })
    } finally {
      setIsDissipating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Main Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchContractBalance(contractAddress)
            checkBeneficiaries(contractAddress)
          }}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-gray-800 bg-gray-900 shadow-lg">
          <CardHeader>
            <CardTitle>Total Assets</CardTitle>
            <CardDescription>Your current balance in CORE tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6">
              <div className="text-center">
                <div className="text-4xl font-bold">
                  {isLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : `${balance} CORE`}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900 shadow-lg">
          <CardHeader>
            <CardTitle>Deposit CORE</CardTitle>
            <CardDescription>Add funds to your inheritance contract</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (CORE)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                onClick={handleDeposit}
                disabled={isDepositing}
              >
                {isDepositing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  <>
                    <ArrowDown className="mr-2 h-4 w-4" />
                    Deposit
                  </>
                )}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 transition-all duration-300"
                    variant="destructive"
                    disabled={Number.parseFloat(balance) <= 0 || !hasBeneficiaries || isDissipating}
                  >
                    {isDissipating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Dissipating...
                      </>
                    ) : (
                      "Dissipate Funds"
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will distribute all funds ({balance} CORE) to your beneficiaries according to their
                      assigned percentages. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDissipate} disabled={isDissipating}>
                      {isDissipating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Continue"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-800 bg-gray-900 shadow-lg">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent activity on your contract</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-4 border-b bg-muted/50 p-3 font-medium">
              <div>Type</div>
              <div>Amount</div>
              <div>Date</div>
              <div>Status</div>
            </div>
            <div className="divide-y">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div key={tx.id} className="grid grid-cols-4 p-3">
                    <div>{tx.type}</div>
                    <div>{tx.amount}</div>
                    <div>{tx.date}</div>
                    <div>{tx.status}</div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-muted-foreground">No transactions found</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

