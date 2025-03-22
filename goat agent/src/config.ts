export const config = {
  // Contract address of the insurance pool
  insuranceContractAddress: "0x123456789abcdef123456789abcdef123456789a", // Replace with actual contract address

  // Addresses to monitor for potential claims
  monitoredAddresses: [
    "0x584a837475C5670F2a7dEf1581712BDF362cEe68", // Owner address from contract
    // Add more addresses as needed
  ],

  // Simulated deceased addresses for testing
  // In a real implementation, this would come from an oracle or other data source
  simulatedDeceasedAddresses: ["0x584a837475C5670F2a7dEf1581712BDF362cEe68"],

  // How often to check for pending claims (in milliseconds)
  checkIntervalMs: 60000, // Check every minute

  // How often to make premium payments (in milliseconds)
  paymentIntervalMs: 2592000000, // Every 30 days

  // Policy holders and their beneficiaries
  policies: [
    {
      policyHolder: "0x584a837475C5670F2a7dEf1581712BDF362cEe68",
      beneficiary: "0xabc123def456abc123def456abc123def456abc1",
    },
    // Add more policies as needed
  ],
}

