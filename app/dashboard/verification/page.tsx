"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, Heart, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"

export default function VerificationPage() {
  const { toast } = useToast()
  const [timeLeft, setTimeLeft] = useState(30)
  const [isActive, setIsActive] = useState(true)
  const [showAlert, setShowAlert] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [buttonPulse, setButtonPulse] = useState(false)

  // Function to reset the timer
  const resetTimer = useCallback(() => {
    setTimeLeft(30)
    setIsActive(true)

    // Add pulse animation to button
    setButtonPulse(true)
    setTimeout(() => setButtonPulse(false), 700)

    toast({
      title: "Verification Reset",
      description: "You've confirmed you're alive. Timer reset to 30 seconds.",
    })
  }, [toast])

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1)
      }, 1000)
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false)
      setShowAlert(true)
      setVerificationComplete(true)

      if (interval) clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Verification</h1>

      <Card className="border-gray-800 bg-gray-900 shadow-lg overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle>Life Verification</CardTitle>
          <CardDescription>Confirm you're alive by clicking the button before the timer runs out</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4 p-6">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-gray-700 bg-gray-800">
              <Clock className="absolute text-gray-600 h-full w-full p-6" />
              <span className="text-3xl font-bold z-10">{formatTime(timeLeft)}</span>
            </div>

            <div className="w-full mt-4">
              <Progress value={(timeLeft / 30) * 100} className="h-2" />
              <p className="text-center mt-2 text-sm text-muted-foreground">
                {isActive ? "Time remaining to verify" : "Verification time expired"}
              </p>
            </div>
          </div>

          <Button
            onClick={resetTimer}
            disabled={!isActive}
            size="lg"
            className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 ${buttonPulse ? "animate-pulse" : ""}`}
          >
            <Heart className="mr-2 h-5 w-5" />
            I'm Alive
          </Button>
        </CardContent>
        <CardFooter className="bg-gray-800/50 px-6 py-4">
          <div className="text-sm text-muted-foreground">
            <AlertCircle className="inline-block mr-2 h-4 w-4" />
            This verification helps ensure your digital assets are properly managed.
          </div>
        </CardFooter>
      </Card>

      {verificationComplete && (
        <Card className="border-gray-800 bg-gray-900 shadow-lg border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
            <CardDescription>Your verification progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-blue-500/10 p-4 border border-blue-500/20">
              <h3 className="font-medium text-blue-400 mb-2">Layer 1 Verification Complete</h3>
              <p className="text-sm text-muted-foreground">
                Emails have been sent to your nominees to inform them of your verification status.
              </p>
            </div>

            <div className="mt-4">
              <Button
                asChild
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
              >
                <Link href="/dashboard/verification/layer2">Proceed to Layer 2 Verification</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Dialog for verification complete */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verification Layer 1 Complete</AlertDialogTitle>
            <AlertDialogDescription>
              Emails have been sent to your nominees to inform them of your verification status. Please proceed to Layer
              2 verification for additional security.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Acknowledge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

