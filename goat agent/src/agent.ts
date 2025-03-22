import { GoatContext } from "@goat-sdk/core"
import { EthersProvider } from "@goat-sdk/ethers-provider"
import InsuranceClaimAgent from "./index"

// Initialize the goatSDK context
const context = new GoatContext()

// Add the ethers provider
const ethersProvider = new EthersProvider({
  rpcUrl: process.env.RPC_URL || "http://localhost:8545",
  privateKey: process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000",
})

context.addProvider("ethers", ethersProvider)

// Create and start the agent
const agent = new InsuranceClaimAgent(context)

async function startAgent() {
  try {
    await agent.setup()
    await agent.run()

    // Listen for claim processed events
    agent.on("claim:processed", (data) => {
      console.log("Claim processed:", data)
    })

    console.log("Insurance Claim Agent is running")
  } catch (error) {
    console.error("Failed to start agent:", error)
  }
}

startAgent()

