"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { DistributionChart } from "@/components/distribution-chart"

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

// Colors for pie chart
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

interface Beneficiary {
  id: number
  name: string
  email: string
  address: string
  percentage: number
}

export default function NomineePage() {
  const { toast } = useToast()
  const [contractAddress, setContractAddress] = useState("")
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [percentage, setPercentage] = useState("")

  // Create a function to update the chart data whenever beneficiaries change
  const updateChartData = (beneficiaryList: Beneficiary[]) => {
    const data = beneficiaryList.map((ben) => ({
      name: ben.name || `Address: ${ben.address.slice(0, 6)}...${ben.address.slice(-4)}`,
      value: ben.percentage,
    }))

    // Add remaining percentage if less than 100%
    const totalPercentage = beneficiaryList.reduce((total, ben) => total + ben.percentage, 0)
    if (totalPercentage < 100) {
      data.push({
        name: "Unallocated",
        value: 100 - totalPercentage,
      })
    }

    return data
  }

  // Add a new state for chart data
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    setChartData(updateChartData(beneficiaries))
  }, [beneficiaries])

  useEffect(() => {
    const storedAddress = localStorage.getItem("william_contract_address")
    if (storedAddress) {
      setContractAddress(storedAddress)
      // We're not automatically fetching beneficiaries on load anymore
      // This ensures the user starts with 0 beneficiaries until they add them
    }
  }, [])

  useEffect(() => {
    // Load beneficiaries from localStorage if available
    const storedBeneficiaries = localStorage.getItem("william_beneficiaries")
    if (storedBeneficiaries) {
      setBeneficiaries(JSON.parse(storedBeneficiaries))
    }
  }, [])

  const fetchBeneficiaries = async (contractAddr: string) => {
    try {
      setIsLoading(true)
      setIsFetching(true)
      setBeneficiaries([]) // Clear existing beneficiaries

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const william01Contract = new ethers.Contract(contractAddr, william01ABI, provider)

        // Create a temporary array to store beneficiaries
        const tempBeneficiaries: Beneficiary[] = []

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
                // Add to our local array
                tempBeneficiaries.push({
                  id: index + 1,
                  name: `Beneficiary ${index + 1}`, // We don't store names on-chain
                  email: "", // We don't store emails on-chain
                  address: beneficiaryAddress,
                  percentage: Number(percentageValue),
                })
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

        // Update state with fetched beneficiaries
        setBeneficiaries(tempBeneficiaries)

        // Store in localStorage
        localStorage.setItem("william_beneficiaries", JSON.stringify(tempBeneficiaries))

        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event("william_beneficiaries_updated"))

        console.log("Fetched beneficiaries:", tempBeneficiaries)
      }
    } catch (error) {
      console.error("Error fetching beneficiaries:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch beneficiaries from contract. Please try again.",
      })

      // Try to load from localStorage as fallback
      const storedBeneficiaries = localStorage.getItem("william_beneficiaries")
      if (storedBeneficiaries) {
        setBeneficiaries(JSON.parse(storedBeneficiaries))
      }
    } finally {
      setIsLoading(false)
      setIsFetching(false)
    }
  }

  const calculateTotalPercentage = () => {
    return beneficiaries.reduce((total, ben) => total + ben.percentage, 0)
  }

  const handleAddBeneficiary = async () => {
    // Validate inputs
    if (!name.trim() || !email.trim() || !address.trim() || !percentage.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all fields.",
      })
      return
    }

    // Validate address format
    if (!ethers.isAddress(address)) {
      toast({
        variant: "destructive",
        title: "Invalid address",
        description: "Please enter a valid Ethereum address.",
      })
      return
    }

    const percentageValue = Number.parseInt(percentage)
    if (isNaN(percentageValue) || percentageValue <= 0 || percentageValue > 100) {
      toast({
        variant: "destructive",
        title: "Invalid percentage",
        description: "Percentage must be between 1 and 100.",
      })
      return
    }

    // Check if total percentage exceeds 100%
    const totalPercentage = calculateTotalPercentage() + percentageValue
    if (totalPercentage > 100) {
      toast({
        variant: "destructive",
        title: "Percentage too high",
        description: `Total percentage cannot exceed 100%. Current total: ${calculateTotalPercentage()}%`,
      })
      return
    }

    try {
      setIsAdding(true)

      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const william01Contract = new ethers.Contract(contractAddress, william01ABI, signer)

        console.log("Calling storeBenificiary with:", address, percentageValue)

        // Call the smart contract function with the exact parameters
        const tx = await william01Contract.storeBenificiary(address, percentageValue)
        console.log("Transaction submitted:", tx.hash)

        // Wait for transaction to be mined
        const receipt = await tx.wait()
        console.log("Transaction confirmed:", receipt)

        // Add the new beneficiary to our local state
        const newBeneficiary: Beneficiary = {
          id: beneficiaries.length + 1,
          name: name,
          email: email,
          address: address,
          percentage: percentageValue,
        }

        const updatedBeneficiaries = [...beneficiaries, newBeneficiary]
        setBeneficiaries(updatedBeneficiaries)

        // Store in localStorage
        localStorage.setItem("william_beneficiaries", JSON.stringify(updatedBeneficiaries))

        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event("william_beneficiaries_updated"))

        // Reset form
        setName("")
        setEmail("")
        setAddress("")
        setPercentage("")

        toast({
          title: "Beneficiary added",
          description: `Successfully added ${name} as a beneficiary.`,
        })
      }
    } catch (error) {
      console.error("Error adding beneficiary:", error)
      toast({
        variant: "destructive",
        title: "Failed to add beneficiary",
        description: "There was an error adding the beneficiary. Please try again.",
      })
    } finally {
      setIsAdding(false)
    }
  }

  // Prepare data for pie chart
  // const chartData = beneficiaries.map((ben) => ({
  //   name: ben.name || `Address: ${ben.address.slice(0, 6)}...${ben.address.slice(-4)}`,
  //   value: ben.percentage,
  // }))

  // // Add remaining percentage if less than 100%
  // const totalPercentage = calculateTotalPercentage()
  // if (totalPercentage < 100) {
  //   chartData.push({
  //     name: "Unallocated",
  //     value: 100 - totalPercentage,
  //   })
  // }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nominee Management</h1>
        <Button variant="outline" size="sm" onClick={() => fetchBeneficiaries(contractAddress)} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-gray-800 bg-gray-900 shadow-lg">
          <CardHeader>
            <CardTitle>Add Beneficiary</CardTitle>
            <CardDescription>Add a new beneficiary to your inheritance plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter beneficiary name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter beneficiary email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Wallet Address</Label>
                <Input id="address" placeholder="0x..." value={address} onChange={(e) => setAddress(e.target.value)} />
                <p className="text-xs text-muted-foreground">Enter a valid Ethereum address (0x...)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage">Percentage (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  placeholder="0"
                  min="1"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                />
                <div className="text-sm text-muted-foreground">
                  Total allocated: {calculateTotalPercentage()}% / 100%
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                onClick={handleAddBeneficiary}
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Beneficiary
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900 shadow-lg">
          <CardHeader>
            <CardTitle>Distribution</CardTitle>
            <CardDescription>Visual representation of your inheritance distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionChart />
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-800 bg-gray-900 shadow-lg">
        <CardHeader>
          <CardTitle>Current Beneficiaries</CardTitle>
          <CardDescription>Your current beneficiaries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-[1fr_1fr_2fr_1fr] border-b bg-muted/50 p-3 font-medium">
              <div>Name</div>
              <div>Email</div>
              <div>Wallet Address</div>
              <div className="text-right">Percentage</div>
            </div>
            <div className="divide-y">
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : beneficiaries.length > 0 ? (
                beneficiaries.map((ben) => (
                  <div key={ben.id} className="grid grid-cols-[1fr_1fr_2fr_1fr] items-center p-3">
                    <div>{ben.name}</div>
                    <div>{ben.email}</div>
                    <div className="truncate">{ben.address}</div>
                    <div className="text-right">
                      <span>{ben.percentage}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-muted-foreground">No beneficiaries found</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

