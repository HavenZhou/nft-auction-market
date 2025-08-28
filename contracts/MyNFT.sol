// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721,Ownable{
    // Counter for the next token ID to be minted
    uint256 private _nextTokenId;

    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender){
        _nextTokenId = 1; // Start token IDs from 1
    }

    function mint(address recipient) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _mint(recipient, tokenId);
        return tokenId;
    }

    // Function to get the current token ID (the last minted token ID)
    function currentTokenId() public view returns (uint256) {
        return _nextTokenId - 1;
    }
}