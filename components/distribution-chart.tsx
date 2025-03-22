"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Loader2 } from "lucide-react"

// Colors for pie chart
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

interface Beneficiary {
  id: number
  name: string
  email: string
  address: string
  percentage: number
}

export function DistributionChart() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])

  // Load beneficiaries from localStorage
  useEffect(() => {
    const loadBeneficiaries = () => {
      setIsLoading(true)
      const storedBeneficiaries = localStorage.getItem("william_beneficiaries")
      if (storedBeneficiaries) {
        const parsedBeneficiaries = JSON.parse(storedBeneficiaries)
        setBeneficiaries(parsedBeneficiaries)
      }
      setIsLoading(false)
    }

    // Load initially
    loadBeneficiaries()

    // Set up event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "william_beneficiaries") {
        loadBeneficiaries()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Custom event for same-tab updates
    const handleCustomEvent = () => loadBeneficiaries()
    window.addEventListener("william_beneficiaries_updated", handleCustomEvent)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("william_beneficiaries_updated", handleCustomEvent)
    }
  }, [])

  // Update chart data whenever beneficiaries change
  useEffect(() => {
    const updateChartData = () => {
      const data = beneficiaries.map((ben) => ({
        name: ben.name || `Address: ${ben.address.slice(0, 6)}...${ben.address.slice(-4)}`,
        value: ben.percentage,
      }))

      // Add remaining percentage if less than 100%
      const totalPercentage = beneficiaries.reduce((total, ben) => total + ben.percentage, 0)
      if (totalPercentage < 100) {
        data.push({
          name: "Unallocated",
          value: 100 - totalPercentage,
        })
      }

      setChartData(data)
    }

    updateChartData()
  }, [beneficiaries])

  return (
    <div className="h-[300px] w-full">
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">No beneficiaries added yet</div>
      )}
    </div>
  )
}

