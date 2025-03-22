// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
contract insurancePool {
    uint contractBalance;
    address private owner = 0x584a837475C5670F2a7dEf1581712BDF362cEe68;
    // mapping(address => uint256) public addressToBalance;
    // address[] public benAdd;
    address[] individuals;
    mapping (address => address) public beneficiaries;
    mapping(address=>uint) public individualdeposite;
    function depositePremium() external payable {
        individuals.push(msg.sender);
        individualdeposite[msg.sender] += msg.value;
        contractBalance += msg.value;
    }
    uint claimAmount = 10 ether;
    function addBenificiary(address _beneficiary) public {
        beneficiaries[msg.sender] = _beneficiary;
    }
    bool isdead = true;
    function claim() public {
    require(individualdeposite[msg.sender] > 0, "You cannot claim your premium");
    require(isdead == true, "You cannot claim your premium");
    require(beneficiaries[msg.sender] != address(0), "No beneficiary set");
    
    // uint256 amount = individualdeposite[msg.sender];
    individualdeposite[msg.sender] = 0; // Prevent multiple claims
    
    payable(beneficiaries[msg.sender]).transfer(claimAmount);  // Use the actual deposit amount
    }


}