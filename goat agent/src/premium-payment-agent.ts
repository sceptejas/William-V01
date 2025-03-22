import { GoatAgent, type GoatContext } from "@goat-sdk/core"
import type { EthersProvider } from "@goat-sdk/ethers-provider"
import { ethers } from "ethers"
import { config } from "./config"
import { InsurancePoolABI } from "./abi"

// This agent handles regular premium payments
class PremiumPaymentAgent extends GoatAgent {
  private provider: ethers.providers.Provider
  private signer: ethers.Signer
  private insuranceContract: ethers.Contract

  constructor(context: GoatContext) {
    super(context)
    this.name = "Premium Payment Agent"
    this.description = "Automates regular premium payments for insurance"
  }

  async setup() {
    // Initialize provider and signer
    const ethersProvider = this.context.getProvider<EthersProvider>("ethers")
    this.provider = ethersProvider.getProvider()
    this.signer = ethersProvider.getSigner()

    // Initialize the insurance contract
    this.insuranceContract = new ethers.Contract(config.insuranceContractAddress, InsurancePoolABI, this.signer)

    this.logger.info("Premium Payment Agent setup complete")
  }

  async run() {
    this.logger.info("Premium Payment Agent started")

    // Schedule regular premium payments
    this.schedulePayments()
  }

  private schedulePayments() {
    // Set up a schedule for regular payments
    // In a real implementation, this would be more sophisticated
    setInterval(async () => {
      await this.makePayment()
    }, config.paymentIntervalMs)
  }

  private async makePayment() {
    try {
      const paymentAmount = ethers.utils.parseEther("0.01") // Example premium amount

      this.logger.info(`Making premium payment of ${ethers.utils.formatEther(paymentAmount)} ETH`)

      const tx = await this.insuranceContract.depositePremium({
        value: paymentAmount,
      })

      await tx.wait()

      this.logger.info(`Premium payment successful: ${tx.hash}`)

      // Emit an event that the payment was processed
      this.emit("payment:processed", {
        amount: ethers.utils.formatEther(paymentAmount),
        transactionHash: tx.hash,
        timestamp: Date.now(),
      })
    } catch (error) {
      this.logger.error("Error making premium payment", error)
    }
  }
}

export default PremiumPaymentAgent

