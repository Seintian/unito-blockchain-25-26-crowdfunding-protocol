// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockFeeToken
 * @notice ERC-20 token deducting a 5% fee on transfer to test fee-on-transfer protection.
 */
contract MockFeeToken is ERC20 {
    constructor() ERC20("Fee Token", "FEE") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        uint256 fee = (amount * 5) / 100; // 5% fee
        uint256 netAmount = amount - fee;
        _transfer(from, address(this), fee); // Send fee to contract
        _transfer(from, to, netAmount);
        return true;
    }
}
