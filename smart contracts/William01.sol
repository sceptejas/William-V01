// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract william01 {
    address public owner;
    bool private locked; // Reentrancy guard variable
    
    constructor() {
        owner = msg.sender;
    }
    
    // Events for important actions
    event BeneficiaryAdded(address indexed beneficiary, uint256 percentage);
    event CoreDeposited(address indexed sender, uint256 amount);
    event DeathStatusChanged(bool isDead);
    event BeneficiaryPaid(address indexed beneficiary, uint256 amount);
    
    mapping(address => uint256) public addressToValue;
    address[] public benAdd;
    
    // Reentrancy guard modifier
    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }
    
    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    function storeBenificiary(address _benAdd, uint256 _percentage) public {
        // Added validation requirements
        require(_benAdd != address(0), "Invalid beneficiary address");
        require(_percentage > 0 && _percentage <= 100, "Percentage must be between 1 and 100");
        
        addressToValue[_benAdd] = _percentage;
        benAdd.push(_benAdd);
        
        emit BeneficiaryAdded(_benAdd, _percentage);
    }
    
    
    uint public totalDeposited;
    
    // Payable function to accept Core tokens with reentrancy protection
    function depositCore() public payable nonReentrant {
        require(msg.value > 0, "Must send Core tokens");
        
        // Update individual deposit
        addressToValue[msg.sender] += msg.value;
        
        // Update total deposits
        totalDeposited += msg.value;
        
        emit CoreDeposited(msg.sender, msg.value);
    }
    
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    bool public isDead = false; // to be added to an if statement later depending on users' life
    
    function deathCheck(uint _deathCheck) public nonReentrant {
        // Added onlyOwner modifier since this is a critical function
        require(_deathCheck == 0 || _deathCheck == 1, "Input must be 0 or 1");
        
        if (_deathCheck == 1) {
            isDead = true;
        } else {
            isDead = false;
        }
        
        emit DeathStatusChanged(isDead);
    }
    
    function benTransfer() public nonReentrant {
        // Fixed comparison operator from assignment to equality check
        require(benAdd.length > 0, "No beneficiaries defined");
        require(address(this).balance > 0, "No funds to transfer");
        
        uint256 totalPercentage = 0;
        for(uint i = 0; i < benAdd.length; i++) {
            totalPercentage += addressToValue[benAdd[i]];
        }
        require(totalPercentage == 100, "Total percentage must equal 100");
        
        for(uint i = 0; i < benAdd.length; i++) {
            address payable _beneficiary = payable(benAdd[i]);
            uint amount = (totalDeposited * addressToValue[_beneficiary]) / 100;
            
            // Safety check before transfer
            require(amount > 0, "Transfer amount must be greater than 0");
            
            _beneficiary.transfer(amount);
            emit BeneficiaryPaid(_beneficiary, amount);
        }
    }
}