import { GoatAgent, type GoatContext } from "@goat-sdk/core"
import type { EthersProvider } from "@goat-sdk/ethers-provider"
import { ethers } from "ethers"
import { config } from "./config"
import { InsurancePoolABI } from "./abi"

// This agent handles setting up beneficiaries
class BeneficiarySetupAgent extends GoatAgent {
  private provider: ethers.providers.Provider
  private signer: ethers.Signer
  private insuranceContract: ethers.Contract

  constructor(context: GoatContext) {
    super(context)
    this.name = "Beneficiary Setup Agent"
    this.description = "Automates setting up beneficiaries for insurance policies"
  }

  async setup() {
    // Initialize provider and signer
    const ethersProvider = this.context.getProvider<EthersProvider>("ethers")
    this.provider = ethersProvider.getProvider()
    this.signer = ethersProvider.getSigner()

    // Initialize the insurance contract
    this.insuranceContract = new ethers.Contract(config.insuranceContractAddress, InsurancePoolABI, this.signer)

    this.logger.info("Beneficiary Setup Agent setup complete")
  }

  async run() {
    this.logger.info("Beneficiary Setup Agent started")

    // Check for policies without beneficiaries
    await this.checkAndSetupBeneficiaries()
  }

  private async checkAndSetupBeneficiaries() {
    try {
      // In a real implementation, you would have a database or other source
      // of policy holders and their designated beneficiaries

      for (const policy of config.policies) {
        // Check if a beneficiary is already set
        const currentBeneficiary = await this.insuranceContract.beneficiaries(policy.policyHolder)

        if (currentBeneficiary === ethers.constants.AddressZero && policy.beneficiary) {
          await this.setBeneficiary(policy.policyHolder, policy.beneficiary)
        }
      }
    } catch (error) {
      this.logger.error("Error checking and setting up beneficiaries", error)
    }
  }

  private async setBeneficiary(policyHolder: string, beneficiary: string) {
    try {
      this.logger.info(`Setting beneficiary ${beneficiary} for policy holder ${policyHolder}`)

      // In a production environment, you would need proper authorization
      // This is just for demonstration purposes
      const tx = await this.insuranceContract.addBenificiary(beneficiary)

      await tx.wait()

      this.logger.info(`Beneficiary set successfully for ${policyHolder}`)

      // Emit an event that the beneficiary was set
      this.emit("beneficiary:set", {
        policyHolder,
        beneficiary,
        transactionHash: tx.hash,
        timestamp: Date.now(),
      })
    } catch (error) {
      this.logger.error(`Error setting beneficiary for ${policyHolder}`, error)
    }
  }
}

export default BeneficiarySetupAgent

