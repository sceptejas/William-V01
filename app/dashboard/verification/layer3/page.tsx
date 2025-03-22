"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, QrCode, CheckCircle, XCircle } from "lucide-react"
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
import jsQR from "jsqr"

export default function Layer3VerificationPage() {
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "failed">("pending")
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [showFailedAlert, setShowFailedAlert] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  // Process the QR code from an image
  const processQRCode = useCallback(
    async (imageUrl: string, fileName: string) => {
      setIsProcessing(true)

      try {
        // Check if the file name contains specific identifiers
        if (fileName.includes("zk-proof-0") || fileName.includes("zk-proof 0")) {
          // This is the failure QR code
          setVerificationStatus("failed")
          setShowFailedAlert(true)
          setIsProcessing(false)
          return
        } else if (fileName.includes("zk-proof-1") || fileName.includes("zk-proof 1")) {
          // This is the success QR code
          setVerificationStatus("success")
          setShowSuccessAlert(true)
          setIsProcessing(false)
          return
        }

        // If not a predefined file, try to process the QR code
        // Create an image element to load the image
        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          // Create a canvas to draw the image
          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d")

          if (!context) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Could not process the QR code. Canvas context not available.",
            })
            setIsProcessing(false)
            return
          }

          // Set canvas dimensions to match image
          canvas.width = img.width
          canvas.height = img.height

          // Draw image to canvas
          context.drawImage(img, 0, 0)

          // Get image data for QR code processing
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

          // Process with jsQR
          const code = jsQR(imageData.data, imageData.width, imageData.height)

          if (code) {
            console.log("QR Code detected:", code.data)

            // Check the QR code value
            if (code.data === "1") {
              setVerificationStatus("success")
              setShowSuccessAlert(true)
            } else {
              setVerificationStatus("failed")
              setShowFailedAlert(true)
            }
          } else {
            toast({
              variant: "destructive",
              title: "No QR Code Found",
              description: "Could not detect a valid QR code in the image. Please try another image.",
            })
          }

          setIsProcessing(false)
        }

        img.onerror = () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load the image. Please try again.",
          })
          setIsProcessing(false)
        }

        // Set the source to load the image
        img.src = imageUrl
      } catch (error) {
        console.error("Error processing QR code:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An error occurred while processing the QR code.",
        })
        setIsProcessing(false)
      }
    },
    [toast],
  )

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  // Process the selected file
  const handleFile = (file: File) => {
    // Check if file is an image
    if (!file.type.match("image.*")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file containing a QR code.",
      })
      return
    }

    // Create a URL for the image
    const imageUrl = URL.createObjectURL(file)
    setUploadedImage(imageUrl)
    setUploadedImageName(file.name)

    // Process the QR code
    processQRCode(imageUrl, file.name)
  }

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Handle demo QR code selection
  const handleDemoQRCode = (type: "success" | "failure") => {
    const imagePath = type === "success" ? "/zk-proof-1.jpg" : "/zk-proof-0.jpg"
    const imageName = type === "success" ? "zk-proof-1.jpg" : "zk-proof-0.jpg"

    setUploadedImage(imagePath)
    setUploadedImageName(imageName)

    // Process the QR code
    processQRCode(imagePath, imageName)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/verification/layer2">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Layer 3 Verification</h1>
      </div>

      <Card className="border-gray-800 bg-gray-900 shadow-lg">
        <CardHeader>
          <CardTitle>Certificate Verifier</CardTitle>
          <CardDescription>Upload a QR code from the death certificate for final verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-500/10"
                : verificationStatus === "success"
                  ? "border-green-500 bg-green-500/10"
                  : verificationStatus === "failed"
                    ? "border-red-500 bg-red-500/10"
                    : "border-gray-700 hover:border-gray-600"
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

            {uploadedImage ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-48 h-48 mx-auto">
                  <img
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Uploaded QR Code"
                    className="w-full h-full object-contain rounded-md"
                  />
                  {verificationStatus === "success" && (
                    <div className="absolute -bottom-4 -right-4 bg-green-500 rounded-full p-1">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                  )}
                  {verificationStatus === "failed" && (
                    <div className="absolute -bottom-4 -right-4 bg-red-500 rounded-full p-1">
                      <XCircle className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isProcessing
                    ? "Processing QR code..."
                    : verificationStatus === "success"
                      ? "Verification successful!"
                      : verificationStatus === "failed"
                        ? "Verification failed!"
                        : "QR code uploaded"}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadedImage(null)
                    setUploadedImageName(null)
                    setVerificationStatus("pending")
                  }}
                >
                  Upload Different Image
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <QrCode className="h-16 w-16 text-gray-500 mb-2" />
                <h3 className="text-lg font-medium">Drag & Drop QR Code</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Upload the QR code from the official death certificate to complete the final verification step
                </p>
                <Button variant="outline" onClick={triggerFileInput} disabled={isProcessing}>
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </div>
            )}
          </div>

          {/* Demo QR Codes */}
          <div className="rounded-md bg-gray-800 p-4">
            <h3 className="text-lg font-medium mb-4">Demo QR Codes:</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                variant="outline"
                className="bg-green-500/10 border-green-500 hover:bg-green-500/20"
                onClick={() => handleDemoQRCode("success")}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Test Success QR Code
              </Button>
              <Button
                variant="outline"
                className="bg-red-500/10 border-red-500 hover:bg-red-500/20"
                onClick={() => handleDemoQRCode("failure")}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Test Failure QR Code
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-md bg-gray-800 p-4">
            <h3 className="text-lg font-medium mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Obtain the official death certificate with the verification QR code</li>
              <li>Scan or take a clear photo of the QR code</li>
              <li>Upload the image using the drag & drop area above</li>
              <li>The system will automatically verify the certificate's authenticity</li>
              <li>Upon successful verification, funds will be ready for dissipation</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Success Alert Dialog */}
      <AlertDialog open={showSuccessAlert} onOpenChange={setShowSuccessAlert}>
        <AlertDialogContent className="border-green-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-500 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Validation Layer 3 Completed
            </AlertDialogTitle>
            <AlertDialogDescription>
              The death certificate has been successfully verified. Funds are ready to be dissipated to all
              beneficiaries according to the specified percentages.
              <br />
              <br />
              You can now return to the main dashboard to initiate the fund dissipation process.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <Link href="/dashboard">
                <Button className="bg-green-600 hover:bg-green-700">Go to Dashboard</Button>
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Failed Alert Dialog */}
      <AlertDialog open={showFailedAlert} onOpenChange={setShowFailedAlert}>
        <AlertDialogContent className="border-red-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              Validation Layer 3 Failed
            </AlertDialogTitle>
            <AlertDialogDescription>
              The death certificate could not be verified. This may be due to an invalid QR code or a certificate that
              has not been properly issued by the authorized authorities.
              <br />
              <br />
              Please ensure you are using an official death certificate with a valid verification QR code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Try Again</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

