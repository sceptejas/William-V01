"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Wallet } from "lucide-react"

// ABIs
const william02ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
    ],
    name: "ContractCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getUserContract",
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
    name: "userContracts",
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
    name: "userLogin",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [account, setAccount] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

  // Check if MetaMask is installed
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!window.ethereum) {
        setError("MetaMask is not installed. Please install MetaMask to use this application.")
      }
    }
  }, [])

  // Add this useEffect after the existing useEffect
  useEffect(() => {
    // Clear any previous session when login page loads
    localStorage.removeItem("william_contract_address")
    localStorage.removeItem("william_user_name")
    localStorage.removeItem("william_user_email")

    // Reset account state
    setAccount("")
    setName("")
    setEmail("")
  }, [])

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      setIsConnecting(true)
      setError("")

      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        setAccount(accounts[0])
      } else {
        setError("MetaMask is not installed. Please install MetaMask to use this application.")
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error)
      setError("Failed to connect to MetaMask. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  // Login with William02 contract
  const login = async () => {
    if (!account) {
      setError("Please connect your wallet first.")
      return
    }

    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.")
      return
    }

    try {
      setIsLoggingIn(true)
      setError("")

      // Save user data (in a real app, this would be sent to a server)
      localStorage.setItem("william_user_name", name)
      localStorage.setItem("william_user_email", email)

      // Connect to the William02 contract
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const william02Contract = new ethers.Contract("0x0580b4eaedab665646cce0f1157e9544ae2e2d1e", william02ABI, signer)

      // Call userLogin function to get or create a William01 contract
      const tx = await william02Contract.userLogin()
      await tx.wait()

      // Get the user's William01 contract address
      const userContractAddress = await william02Contract.getUserContract(account)

      // Save the contract address to localStorage
      localStorage.setItem("william_contract_address", userContractAddress)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error logging in:", error)
      setError("Failed to login. Please try again.")
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black to-gray-900 text-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">William</CardTitle>
          <CardDescription>Digital Inheritance System for Core Blockchain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!account ? (
            <Button className="w-full" onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect MetaMask
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-3 text-sm break-all">Connected: {account}</div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={login} disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </div>
          )}
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          Secure your digital assets for future generations
        </CardFooter>
      </Card>
    </div>
  )
}

