# WillIam - Digital Inheritance System for Crypto & Personal Assets 🔐💼

## Overview 🌟
WillIam is a decentralized L2 wallet application built on Core Blockchain that allows users to securely manage the inheritance of their digital assets. Users can designate beneficiaries, specify distribution percentages, and ensure their digital wealth is transferred according to their wishes in the event of their death.

## Problem Statement ⚠️
Every year, millions of dollars worth of cryptocurrency assets are lost forever due to unexpected deaths where the owner's private keys become inaccessible. WillIam solves this problem through a secure, automated verification and inheritance system.

## Features ✨
- **Secure Login** 🔒: Connect your MetaMask wallet
- **Asset Management** 💰: Deposit CORE tokens to your secure inheritance contract
- **Beneficiary System** 👪: Add multiple nominees with specific distribution percentages
- **Multi-stage Verification** ✅: Three-layer verification process to confirm death before asset distribution
- **Digital Asset Preservation** 🖼️: Convert important documents and images to NFTs for secure inheritance
- **Visual Analytics** 📊: Track your beneficiary distribution through intuitive charts

## Tech Stack 🛠️
- **Frontend**:  Next.js 
- **Blockchain**: Core 
- **AI agent**: Goat SDK  
- **Smart Contracts**: Solidity 
- **Backend**: Node.js 
- **Web3 Integration**: Ethers.js 
- **NFT Storage**: Pinata 

## Death Verification Process 🔍
WillIam employs a robust verification system to confirm a user's death before distributing assets:

1. **Inactivity Check** ⏰: System monitors user activity over a user-defined period (3-6 months)
2. **Nominee Confirmation** ✋: More than 50% of designated nominees must confirm the user's death
3. **Certificate Verification** 📄: Death certificate submission and verification

### Prerequisites 📋
- Node.js v14+ 🟢
- MetaMask browser extension 🦊
- CORE test tokens for transactions 💲

### Installation 💻
```bash
# Clone the repository
git clone https://github.com/rajarshidattapy/william.git

# Navigate to project directory
cd william

# Install dependencies
npm install

# Start development server
npm start
```

### Connecting to Core Blockchain 🔌
1. Configure MetaMask to connect to Core Blockchain
2. Add Core Blockchain network to MetaMask:
   - Network Name: Core Blockchain
   - RPC URL: [Core Blockchain RPC URL](https://rpc.test2.btcs.network)
   - Chain ID: [Core Chain ID](1114)
   - Currency Symbol: CORE

## User Guide 📖

### Login 🔑
1. Connect your MetaMask wallet
2. Register your email and personal information
3. The system will create your personal inheritance contract

### Managing Assets 💼
1. Navigate to the "Main" tab
2. View your current balance
3. Use the deposit form to add CORE tokens to your inheritance contract

### Managing Beneficiaries 👨‍👩‍👧
1. Navigate to the "Nominee" tab
2. Add beneficiaries with their name, email, wallet address, and percentage share
3. Update or remove beneficiaries as needed
4. Ensure total allocation equals 100%

### NFT Creation 🎨
1. Navigate to the "NFT" tab
2. Upload important documents or images
3. Convert them to NFTs for secure inheritance

## Security Considerations 🛡️
- All smart contracts have been audited for security vulnerabilities
- Reentrancy protection implemented in all fund-handling functions
- Multi-stage verification process prevents fraudulent claims

## Contributors 👥
- [Tejasvi Kumar](https://github.com/sceptejas) 👨‍💻: Smart Contracts & web3 integration
- [Rajarshi Datta](https://github.com/rajarshidattapy) 👩‍💻: Frontend & AI agent
- [Harshit Srivastava](https://github.com/hr-shiit) 👨‍💻: Smart Contracts & backend

## License 📄
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer ⚠️
WillIam is a prototype and should not be used as a replacement for proper legal estate planning. Always consult with legal professionals regarding inheritance matters.
