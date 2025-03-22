// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "./william01.sol";  // Changed to standard import

// The main factory contract
contract william02{
    // Mapping to track user contracts
    mapping(address => address) public userContracts;
    
    // Event for contract creation
    event ContractCreated(address indexed user, address contractAddress);
    
    // Function called when user logs in
    function userLogin() external returns (address) {
        address user = msg.sender;
        
        // Check if user already has a contract
        if (userContracts[user] == address(0)) {
            william01 newContract = new william01();  // Removed the parameter
            userContracts[user] = address(newContract);
            emit ContractCreated(user, address(newContract));
        }
        
        // Return the user's contract address
        return userContracts[user];
    }
    
    // Function to get a user's contract address (view function)
    function getUserContract(address user) external view returns (address) {
        return userContracts[user];
    }
}