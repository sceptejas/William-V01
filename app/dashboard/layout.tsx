"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Home, Users, Lock, Image, LogOut, Shield } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState("")
  const [userAddress, setUserAddress] = useState("")

  useEffect(() => {
    setMounted(true)

    // Check if user is logged in
    const contractAddress = localStorage.getItem("william_contract_address")
    const name = localStorage.getItem("william_user_name")

    if (!contractAddress) {
      router.push("/")
      return
    }

    if (name) {
      setUserName(name)
    }

    // Get connected account
    if (window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setUserAddress(accounts[0])
          } else {
            router.push("/")
          }
        })
        .catch(console.error)
    }
  }, [router])

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem("william_contract_address")
    localStorage.removeItem("william_user_name")
    localStorage.removeItem("william_user_email")

    // Reset connection state
    // Note: MetaMask doesn't have a direct disconnect method, but we can reset our app state
    if (window.ethereum && window.ethereum._state) {
      try {
        // This is a workaround to "forget" connections in our app context
        // It doesn't actually disconnect MetaMask, but resets our app's connection state
        window.ethereum._state.accounts = []
        window.ethereum._state.isConnected = false
      } catch (error) {
        console.error("Error resetting connection state:", error)
      }
    }

    // Redirect to login page
    router.push("/")
  }

  if (!mounted) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full dark bg-black text-white">
        <Sidebar variant="inset">
          <SidebarHeader className="flex flex-col items-center justify-center p-4">
            <h1 className="text-xl font-bold">William</h1>
            <p className="text-sm text-muted-foreground">Digital Inheritance</p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Main">
                  <Link href="/dashboard">
                    <Home className="h-4 w-4" />
                    <span>Main</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Nominees">
                  <Link href="/dashboard/nominee">
                    <Users className="h-4 w-4" />
                    <span>Nominees</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Verification">
                  <Link href="/dashboard/verification">
                    <Lock className="h-4 w-4" />
                    <span>Verification</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="NFT">
                  <Link href="/dashboard/nft">
                    <Image className="h-4 w-4" />
                    <span>NFT</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Insurance">
                  <Link href="/dashboard/insurance">
                    <Shield className="h-4 w-4" />
                    <span>Insurance</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="mb-2 text-sm">
              <div className="font-medium">{userName}</div>
              <div className="truncate text-xs text-muted-foreground">{userAddress}</div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="w-full">
          <div className="w-full p-4 md:p-6">
            <Tabs defaultValue="main" className="mb-6 md:hidden">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="main" asChild>
                  <Link href="/dashboard">Main</Link>
                </TabsTrigger>
                <TabsTrigger value="nominee" asChild>
                  <Link href="/dashboard/nominee">Nominee</Link>
                </TabsTrigger>
                <TabsTrigger value="verification" asChild>
                  <Link href="/dashboard/verification">Verification</Link>
                </TabsTrigger>
                <TabsTrigger value="nft" asChild>
                  <Link href="/dashboard/nft">NFT</Link>
                </TabsTrigger>
                <TabsTrigger value="insurance" asChild>
                  <Link href="/dashboard/insurance">Insurance</Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

