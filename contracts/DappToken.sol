// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

contract DappToken {
    uint256 public totalSupply;

    constructor() public {
        totalSupply = 1000000;
    }
}