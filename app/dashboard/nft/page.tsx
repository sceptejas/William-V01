"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload, ImageIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface NFT {
  id: number
  name: string
  description: string
  image: string
}

export default function NFTPage() {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [nftName, setNftName] = useState("")
  const [nftDescription, setNftDescription] = useState("")
  const [nfts, setNfts] = useState<NFT[]>([
    {
      id: 1,
      name: "Family Photo",
      description: "Our family vacation photo from 2022",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 2,
      name: "Property Deed",
      description: "Digital copy of property deed",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      id: 3,
      name: "Will Document",
      description: "Digital copy of my will",
      image: "/placeholder.svg?height=300&width=300",
    },
  ])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a file to upload.",
      })
      return
    }

    try {
      setIsUploading(true)

      // Simulate upload to IPFS via Pinata
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "File uploaded",
        description: "Your file has been successfully uploaded to IPFS.",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleMint = async () => {
    if (!selectedFile || !nftName) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a file and provide a name for your NFT.",
      })
      return
    }

    try {
      setIsMinting(true)

      // Simulate minting NFT
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Add to collection
      const newNft: NFT = {
        id: nfts.length + 1,
        name: nftName,
        description: nftDescription,
        image: previewUrl || "/placeholder.svg?height=300&width=300",
      }

      setNfts([...nfts, newNft])

      // Reset form
      setSelectedFile(null)
      setPreviewUrl(null)
      setNftName("")
      setNftDescription("")

      toast({
        title: "NFT minted",
        description: "Your NFT has been successfully minted and added to your collection.",
      })
    } catch (error) {
      console.error("Error minting NFT:", error)
      toast({
        variant: "destructive",
        title: "Minting failed",
        description: "Failed to mint NFT. Please try again.",
      })
    } finally {
      setIsMinting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">NFT Management</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-gray-800 bg-gray-900 shadow-lg">
          <CardHeader>
            <CardTitle>Create NFT</CardTitle>
            <CardDescription>Upload and mint your assets as NFTs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nft-name">NFT Name</Label>
                <Input
                  id="nft-name"
                  placeholder="Enter NFT name"
                  value={nftName}
                  onChange={(e) => setNftName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nft-description">Description</Label>
                <Textarea
                  id="nft-description"
                  placeholder="Enter NFT description"
                  value={nftDescription}
                  onChange={(e) => setNftDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">Upload File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {previewUrl && (
                <div className="mt-4 rounded-md border p-2">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="mx-auto max-h-[200px] object-contain"
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
              onClick={handleMint}
              disabled={!selectedFile || isMinting}
            >
              {isMinting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting...
                </>
              ) : (
                "Mint NFT"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-gray-800 bg-gray-900 shadow-lg">
          <CardHeader>
            <CardTitle>Your NFT Collection</CardTitle>
            <CardDescription>View and manage your NFT assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {nfts.length > 0 ? (
                nfts.map((nft) => (
                  <div key={nft.id} className="overflow-hidden rounded-md border">
                    <div className="aspect-square bg-muted">
                      {typeof nft.image === "string" && nft.image.startsWith("data:") ? (
                        <img
                          src={nft.image || "/placeholder.svg"}
                          alt={nft.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium">{nft.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{nft.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex h-[200px] items-center justify-center text-muted-foreground">
                  No NFTs in your collection
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

