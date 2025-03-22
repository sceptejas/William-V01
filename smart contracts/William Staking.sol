// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IInsurancePool {
    function addBenificiary(address _beneficiary) external;
}

interface ICoreYieldOptimizer {
    function deposit() external payable;
    function withdraw(uint256 _amount) external returns (uint256);
    function claimRewards() external returns (uint256);
}

contract SimpleInsuranceStaking {
    address public owner;
    IInsurancePool public insurancePool;
    ICoreYieldOptimizer public yieldOptimizer;
    
    uint256 public totalStaked;
    bool public emergencyMode;
    
    constructor(address _insurancePoolAddress, address _yieldOptimizerAddress) {
        owner = msg.sender;
        insurancePool = IInsurancePool(_insurancePoolAddress);
        yieldOptimizer = ICoreYieldOptimizer(_yieldOptimizerAddress);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    function setBeneficiary() external onlyOwner {
        insurancePool.addBenificiary(address(this));
    }
    
    function stake() external onlyOwner {
        if(emergencyMode) return;
        
        uint256 amountToStake = address(this).balance;
        if(amountToStake > 0) {
            yieldOptimizer.deposit{value: amountToStake}();
            totalStaked += amountToStake;
        }
    }
    
    function withdraw(uint256 _amount) external onlyOwner {
        if(_amount > totalStaked) _amount = totalStaked;
        
        uint256 received = yieldOptimizer.withdraw(_amount);
        payable(address(insurancePool)).call{value: received}("");
        
        totalStaked -= _amount;
    }
    
    function harvestRewards() external onlyOwner {
        uint256 rewards = yieldOptimizer.claimRewards();
        
        uint256 fee = rewards / 20; // 5% fee
        if(fee > 0) {
            payable(owner).call{value: fee}("");
        }
        
        payable(address(insurancePool)).call{value: rewards - fee}("");
    }
    
    function emergencyWithdraw() external onlyOwner {
        emergencyMode = true;
        
        if(totalStaked > 0) {
            uint256 received = yieldOptimizer.withdraw(totalStaked);
            payable(address(insurancePool)).call{value: received}("");
            totalStaked = 0;
        }
    }
    
    function toggleEmergency(bool _state) external onlyOwner {
        emergencyMode = _state;
    }
    
    receive() external payable {}
    fallback() external payable {}
}