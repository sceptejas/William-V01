"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, UserPlus, Trash2, RefreshCw, Heart, Skull, RotateCcw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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

export default function Layer2VerificationPage() {
  const { toast } = useToast()
  const [contractAddress, setContractAddress] = useState("")
  const [userAccount, setUserAccount] = useState<string | null>(null)
  const [contractOwner, setContractOwner] = useState<string | null>(null)
  const [nominees, setNominees] = useState<string[]>([])
  const [nomineeInput, setNomineeInput] = useState("")
  const [aliveVotes, setAliveVotes] = useState(0)
  const [deadVotes, setDeadVotes] = useState(0)
  const [userHasVoted, setUserHasVoted] = useState(false)
  const [isNominee, setIsNominee] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showNotNomineeAlert, setShowNotNomineeAlert] = useState(false)
  const [currentView, setCurrentView] = useState<"login" | "nominees" | "voting" | "results" | "notNominee">("login")
  const [isFetchingNominees, setIsFetchingNominees] = useState(false)
  const [showDeadStatusAlert, setShowDeadStatusAlert] = useState(false)
  const [showL3Link, setShowL3Link] = useState(false)
  const [showResetConfirmDialog, setShowResetConfirmDialog] = useState(false)

  useEffect(() => {
    const storedAddress = localStorage.getItem("william_contract_address")
    if (storedAddress) {
      setContractAddress(storedAddress)
      fetchContractOwner(storedAddress)

      // Try to load nominees from localStorage first
      const storedBeneficiaries = localStorage.getItem("william_beneficiaries")
      if (storedBeneficiaries) {
        const beneficiaries = JSON.parse(storedBeneficiaries)
        const nomineeAddresses = beneficiaries.map((ben) => ben.address)
        setNominees(nomineeAddresses)
        console.log("Loaded nominees from localStorage:", nomineeAddresses)
      } else {
        // If not in localStorage, fetch from contract
        fetchBeneficiariesFromContract(storedAddress)
      }
    }

    const storedAliveVotes = localStorage.getItem("aliveVotes")
    const storedDeadVotes = localStorage.getItem("deadVotes")

    if (storedAliveVotes) {
      setAliveVotes(Number.parseInt(storedAliveVotes))
    }

    if (storedDeadVotes) {
      setDeadVotes(Number.parseInt(storedDeadVotes))
    }
  }, [])

  // Add an event listener for beneficiary updates
  useEffect(() => {
    const handleBeneficiaryUpdate = () => {
      const storedBeneficiaries = localStorage.getItem("william_beneficiaries")
      if (storedBeneficiaries) {
        const beneficiaries = JSON.parse(storedBeneficiaries)
        const nomineeAddresses = beneficiaries.map((ben) => ben.address)
        setNominees(nomineeAddresses)
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

  // Fetch contract owner
  const fetchContractOwner = async (contractAddr: string) => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const william01Contract = new ethers.Contract(contractAddr, william01ABI, provider)

        const owner = await william01Contract.owner()
        setContractOwner(owner)
        console.log("Contract owner:", owner)
      }
    } catch (error) {
      console.error("Error fetching contract owner:", error)
    }
  }

  // Fetch beneficiaries from the smart contract
  const fetchBeneficiariesFromContract = async (contractAddr: string) => {
    try {
      setIsFetchingNominees(true)

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const william01Contract = new ethers.Contract(contractAddr, william01ABI, provider)

        // Create a temporary array to store beneficiary addresses
        const tempNominees: string[] = []

        // Get the number of beneficiaries by trying to access benAdd array
        let index = 0
        let hasMore = true

        // Loop through benAdd array until we get an error
        while (hasMore) {
          try {
            const beneficiaryAddress = await william01Contract.benAdd(index)

            if (beneficiaryAddress && beneficiaryAddress !== ethers.ZeroAddress) {
              // Get the percentage for this address
              const percentageValue = await william01Contract.addressToValue(beneficiaryAddress)

              // Only add if percentage is greater than 0 (active beneficiary)
              if (Number(percentageValue) > 0) {
                tempNominees.push(beneficiaryAddress)
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

        // Update state with fetched nominees
        setNominees(tempNominees)
        console.log("Fetched nominees from contract:", tempNominees)

        // Also store in localStorage in a format compatible with the beneficiaries structure
        const beneficiariesForStorage = tempNominees.map((address, index) => ({
          id: index + 1,
          name: `Beneficiary ${index + 1}`,
          email: "",
          address: address,
          percentage: 0, // We don't know the percentage here, but we need a value
        }))
        localStorage.setItem("william_beneficiaries", JSON.stringify(beneficiariesForStorage))

        // Save to localStorage for backup
        localStorage.setItem("nominees", JSON.stringify(tempNominees))
      }
    } catch (error) {
      console.error("Error fetching beneficiaries:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch beneficiaries from contract. Please try again.",
      })

      // Try to load from localStorage as fallback
      const storedNominees = localStorage.getItem("nominees")
      if (storedNominees) {
        setNominees(JSON.parse(storedNominees))
      }
    } finally {
      setIsFetchingNominees(false)
    }
  }

  // Check if MetaMask is installed
  const checkMetaMaskInstalled = useCallback(() => {
    return typeof window !== "undefined" && typeof window.ethereum !== "undefined"
  }, [])

  // Connect to MetaMask
  const connectMetaMask = async () => {
    if (!checkMetaMaskInstalled()) {
      toast({
        variant: "destructive",
        title: "MetaMask not found",
        description: "Please install MetaMask to use this application",
      })
      return
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      const account = accounts[0]
      setUserAccount(account)

      // Check if user is a nominee
      checkIfNominee(account)

      // Check if user is admin
      checkIfAdmin(account)

      // Listen for account changes
      window.ethereum.on("accountsChanged", handleAccountsChanged)
    } catch (error) {
      console.error("Error connecting to MetaMask:", error)
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Failed to connect to MetaMask. Please try again.",
      })
    }
  }

  // Handle account changes
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      toast({
        title: "Disconnected",
        description: "Please connect to MetaMask.",
      })
      setCurrentView("login")
      setUserHasVoted(false)
      setUserAccount(null)
    } else if (accounts[0] !== userAccount) {
      setUserAccount(accounts[0])

      // Reset voting status for new account
      setUserHasVoted(false)

      // Check if new account is a nominee
      checkIfNominee(accounts[0])

      // Check if new account is admin
      checkIfAdmin(accounts[0])
    }
  }

  // Check if connected account is a nominee
  const checkIfNominee = (account: string) => {
    // Case insensitive check for the user's address in the nominees list
    const isUserNominee = nominees.some((nominee) => nominee.toLowerCase() === account.toLowerCase())

    setIsNominee(isUserNominee)

    if (isUserNominee) {
      // Check if user has already voted
      const hasVoted = localStorage.getItem(`voted_${account.toLowerCase()}`)
      if (hasVoted === "true") {
        setUserHasVoted(true)
        setCurrentView("results")
      } else {
        // Show voting section
        setCurrentView("voting")
      }
    } else {
      // Show not nominee section
      setCurrentView("notNominee")
      setShowNotNomineeAlert(true)
    }
  }

  // Check if user is the admin (contract owner)
  const checkIfAdmin = (account: string) => {
    if (contractOwner && account && account.toLowerCase() === contractOwner.toLowerCase()) {
      setIsAdmin(true)
      // Admin can always see the nominees section
      setCurrentView("nominees")
    } else {
      setIsAdmin(false)
    }
  }

  // Add nominee
  const addNominee = () => {
    const address = nomineeInput.trim()
    if (address && address.startsWith("0x") && address.length === 42) {
      if (!nominees.includes(address)) {
        const updatedNominees = [...nominees, address]
        setNominees(updatedNominees)
        localStorage.setItem("nominees", JSON.stringify(updatedNominees))
        setNomineeInput("")

        toast({
          title: "Nominee added",
          description: "The address has been added to the nominees list.",
        })

        // If the user is already connected and just added their address
        if (userAccount && userAccount.toLowerCase() === address.toLowerCase()) {
          checkIfNominee(userAccount)
        }
      } else {
        toast({
          variant: "destructive",
          title: "Duplicate nominee",
          description: "This address is already a nominee!",
        })
      }
    } else {
      toast({
        variant: "destructive",
        title: "Invalid address",
        description: "Please enter a valid Ethereum address (0x...)",
      })
    }
  }

  // Remove nominee
  const removeNominee = (index: number) => {
    const updatedNominees = [...nominees]
    updatedNominees.splice(index, 1)
    setNominees(updatedNominees)
    localStorage.setItem("nominees", JSON.stringify(updatedNominees))

    toast({
      title: "Nominee removed",
      description: "The address has been removed from the nominees list.",
    })
  }

  // Cast vote function
  const castVote = (voteType: "alive" | "dead") => {
    if (!userAccount) return

    if (voteType === "alive") {
      const newAliveVotes = aliveVotes + 1
      setAliveVotes(newAliveVotes)
      localStorage.setItem("aliveVotes", newAliveVotes.toString())
    } else {
      const newDeadVotes = deadVotes + 1
      setDeadVotes(newDeadVotes)
      localStorage.setItem("deadVotes", newDeadVotes.toString())
    }

    // Mark user as voted
    setUserHasVoted(true)

    // Show results section
    setCurrentView("results")

    // Store vote in local storage to persist between sessions
    localStorage.setItem(`voted_${userAccount.toLowerCase()}`, "true")

    toast({
      title: "Vote cast",
      description: `You have voted that the user is ${voteType.toUpperCase()}.`,
    })

    // Check if dead status has been reached
    checkDeadStatus(voteType === "dead" ? deadVotes + 1 : deadVotes, voteType === "alive" ? aliveVotes + 1 : aliveVotes)
  }

  // Check if dead status has been reached
  const checkDeadStatus = (deadVotesCount: number, aliveVotesCount: number) => {
    // Calculate majority threshold
    const majorityThreshold = nominees.length / 2

    // If dead votes exceed majority threshold, show dead status alert
    if (deadVotesCount > majorityThreshold && deadVotesCount > aliveVotesCount) {
      setShowDeadStatusAlert(true)
      setShowL3Link(true)
    }
  }

  // Reset votes function
  const resetVotes = () => {
    // Reset vote counts
    setAliveVotes(0)
    setDeadVotes(0)

    // Clear local storage vote data
    localStorage.removeItem("aliveVotes")
    localStorage.removeItem("deadVotes")

    // Clear all user voted flags
    nominees.forEach((nominee) => {
      localStorage.removeItem(`voted_${nominee.toLowerCase()}`)
    })

    // Reset current user's voted status
    if (userAccount) {
      localStorage.removeItem(`voted_${userAccount.toLowerCase()}`)
      setUserHasVoted(false)
    }

    // Reset L3 link
    setShowL3Link(false)

    // Show voting section for admin if they haven't voted yet
    if (!userHasVoted) {
      setCurrentView("voting")
    }

    // Close the confirmation dialog
    setShowResetConfirmDialog(false)

    toast({
      title: "Verification Reset",
      description: "All votes have been reset successfully.",
    })
  }

  // Complete reset function (resets everything)
  const completeReset = () => {
    // Reset votes
    setAliveVotes(0)
    setDeadVotes(0)
    localStorage.removeItem("aliveVotes")
    localStorage.removeItem("deadVotes")

    // Clear all user voted flags
    nominees.forEach((nominee) => {
      localStorage.removeItem(`voted_${nominee.toLowerCase()}`)
    })

    // Reset current user's voted status
    if (userAccount) {
      localStorage.removeItem(`voted_${userAccount.toLowerCase()}`)
      setUserHasVoted(false)
    }

    // Reset L3 link
    setShowL3Link(false)

    // Reset view to login
    setCurrentView("login")

    // Reset user account
    setUserAccount(null)

    // Close the confirmation dialog
    setShowResetConfirmDialog(false)

    toast({
      title: "Complete Reset",
      description: "Layer 2 verification has been completely reset.",
    })
  }

  // Get current status and output variable
  const getCurrentStatus = () => {
    // Calculate majority threshold
    const majorityThreshold = nominees.length / 2

    // Determine status text
    let statusText = ""
    let statusColor = ""
    let outputVariable = null
    let outputExplanation = ""

    if (aliveVotes > deadVotes) {
      statusText = "ALIVE (Based on current votes)"
      statusColor = "text-green-500"
    } else if (deadVotes > aliveVotes) {
      statusText = "DEAD (Based on current votes)"
      statusColor = "text-red-500"
    } else if (aliveVotes === 0 && deadVotes === 0) {
      statusText = "Waiting for votes..."
      statusColor = "text-gray-500"
    } else {
      statusText = "TIE (Equal votes for both)"
      statusColor = "text-blue-500"
    }

    // Set output variable based on majority
    if (aliveVotes > majorityThreshold) {
      outputVariable = 1
      outputExplanation = "ALIVE has more than half of possible votes."
    } else if (deadVotes > majorityThreshold) {
      outputVariable = 0
      outputExplanation = "DEAD has more than half of possible votes."
    } else {
      outputExplanation = "Not enough votes to determine outcome."
    }

    return { statusText, statusColor, outputVariable, outputExplanation }
  }

  const { statusText, statusColor, outputVariable, outputExplanation } = getCurrentStatus()

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // Refresh nominees from contract
  const refreshNominees = () => {
    if (contractAddress) {
      fetchBeneficiariesFromContract(contractAddress)
      toast({
        title: "Nominees refreshed",
        description: "Nominees list has been refreshed from the contract.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/verification">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Layer 2 Verification</h1>

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto bg-orange-500/10 border-orange-500 hover:bg-orange-500/20 text-orange-500"
          onClick={() => setShowResetConfirmDialog(true)}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Verification
        </Button>
      </div>

      {/* Nominees Management Section */}
      {(currentView === "nominees" || isAdmin) && (
        <Card className="border-gray-800 bg-gray-900 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Manage Nominees</CardTitle>
              <CardDescription>Nominees are fetched from your beneficiaries list</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refreshNominees} disabled={isFetchingNominees}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetchingNominees ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter MetaMask address (0x...)"
                value={nomineeInput}
                onChange={(e) => setNomineeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNominee()}
              />
              <Button onClick={addNominee}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="text-sm font-medium">Number of Nominees: {nominees.length}</div>

            <div className="max-h-[200px] overflow-y-auto rounded-md border border-gray-800">
              {nominees.length > 0 ? (
                <div className="divide-y divide-gray-800">
                  {nominees.map((nominee, index) => (
                    <div key={index} className="flex items-center justify-between p-3">
                      <span className="font-mono text-sm">{nominee}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNominee(index)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">No nominees added yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Login Section */}
      {currentView === "login" && (
        <Card className="border-gray-800 bg-gray-900 shadow-lg">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect with MetaMask to participate in voting</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <Button
              size="lg"
              onClick={connectMetaMask}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Connect with MetaMask
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Not Nominee Section */}
      {currentView === "notNominee" && (
        <Card className="border-gray-800 bg-gray-900 shadow-lg border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle>Not Authorized to Vote</CardTitle>
            <CardDescription>Your address is not registered as a nominee for this voting system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-yellow-500/10 p-4 border border-yellow-500/20">
              <p className="text-center">
                Connected as:{" "}
                <span className="font-mono bg-gray-800 px-2 py-1 rounded text-sm">
                  {userAccount ? formatAddress(userAccount) : "0x0000...0000"}
                </span>
              </p>
              <p className="mt-4 text-center text-muted-foreground">
                Please contact the administrator to be added to the nominee list.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voting Section */}
      {currentView === "voting" && (
        <Card className="border-gray-800 bg-gray-900 shadow-lg">
          <CardHeader>
            <CardTitle>Cast Your Vote</CardTitle>
            <CardDescription>Is the user dead or alive?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="mb-2">Connected as:</p>
              <span className="font-mono bg-gray-800 px-3 py-1 rounded text-sm">
                {userAccount ? formatAddress(userAccount) : "0x0000...0000"}
              </span>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                onClick={() => castVote("alive")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 min-w-[120px]"
              >
                <Heart className="mr-2 h-5 w-5" />
                ALIVE
              </Button>

              <Button
                size="lg"
                onClick={() => castVote("dead")}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 min-w-[120px]"
              >
                <Skull className="mr-2 h-5 w-5" />
                DEAD
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {currentView === "results" && (
        <Card className="border-gray-800 bg-gray-900 shadow-lg">
          <CardHeader>
            <CardTitle>Current Results</CardTitle>
            <CardDescription>Voting results and current status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-around">
              <div className="rounded-lg border-2 border-green-500 bg-green-500/10 p-4 text-center w-[45%]">
                <div className="text-lg font-medium text-green-500">ALIVE</div>
                <div className="text-4xl font-bold mt-2">{aliveVotes}</div>
              </div>

              <div className="rounded-lg border-2 border-red-500 bg-red-500/10 p-4 text-center w-[45%]">
                <div className="text-lg font-medium text-red-500">DEAD</div>
                <div className="text-4xl font-bold mt-2">{deadVotes}</div>
              </div>
            </div>

            <div className="rounded-md bg-gray-800 p-4">
              <h3 className="text-lg font-medium mb-2">Current Status:</h3>
              <p className={`text-xl font-bold ${statusColor}`}>{statusText}</p>
            </div>

            <div className="rounded-md bg-gray-800 p-4 text-center">
              <h3 className="text-lg font-medium mb-2">Output Variable:</h3>
              <div
                className={`text-3xl font-bold ${
                  outputVariable === 1 ? "text-green-500" : outputVariable === 0 ? "text-red-500" : "text-gray-500"
                }`}
              >
                {outputVariable !== null ? outputVariable : "-"}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{outputExplanation}</p>
            </div>

            {showL3Link && (
              <div className="rounded-md bg-blue-500/10 p-4 border border-blue-500/20 text-center">
                <h3 className="text-lg font-medium mb-2 text-blue-400">L2 Verification Complete</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  An email with a form has been sent to all beneficiaries for final verification.
                </p>
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Link href="/dashboard/verification/layer3">Proceed to L3 Verification</Link>
                </Button>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground">
              You have already voted. Thank you for your participation!
            </p>
          </CardContent>
          {isAdmin && (
            <CardFooter className="bg-gray-800/50 flex justify-center p-4">
              <Button
                variant="destructive"
                onClick={() => setShowResetConfirmDialog(true)}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset All Votes
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {/* Alert Dialog for non-nominees */}
      <AlertDialog open={showNotNomineeAlert} onOpenChange={setShowNotNomineeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Not Authorized</AlertDialogTitle>
            <AlertDialogDescription>
              You are not registered as a nominee for this voting system. Please contact the administrator to be added
              to the nominee list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog for dead status */}
      <AlertDialog open={showDeadStatusAlert} onOpenChange={setShowDeadStatusAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>L2 Verification Complete</AlertDialogTitle>
            <AlertDialogDescription>
              The majority of nominees have voted that the user is DEAD. An email with a form has been sent to all
              beneficiaries for final verification.
              <br />
              <br />
              Please proceed to L3 verification for the final step in the inheritance process.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Acknowledge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetConfirmDialog} onOpenChange={setShowResetConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Verification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the verification process? This will clear all votes and reset the
              verification status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogAction onClick={resetVotes} className="bg-orange-600 hover:bg-orange-700">
              Reset Votes Only
            </AlertDialogAction>
            <AlertDialogAction onClick={completeReset} className="bg-red-600 hover:bg-red-700">
              Complete Reset
            </AlertDialogAction>
            <AlertDialogAction className="bg-gray-600 hover:bg-gray-700">Cancel</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

