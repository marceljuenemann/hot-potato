// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface IFrostyBridge {
    function invokeFunction(bytes32 functionId, bytes calldata data) external payable returns (uint256 jobId);
}

contract HotPotatoNFT is ERC721, Ownable {
    using Counters for Counters.Counter;

    event SignHash(uint256 indexed tokenId, bytes32 hash, uint256 jobId);
    event Minted(address indexed to, uint256 indexed tokenId);
    event MintActiveUpdated(bool mintActive);
    event BaseURISet(string baseURI);

    bool public mintActive;
    address public immutable frostyBridge;
    bytes32 public immutable frostyFunctionId;

    Counters.Counter private _tokenIdCounter;
    string private _baseTokenURI;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address frostyBridge_,
        bytes32 frostyFunctionId_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        require(frostyBridge_ != address(0), "Bridge cannot be zero address");
        require(frostyFunctionId_ != bytes32(0), "Function ID cannot be zero");
        _baseTokenURI = baseURI_;
        frostyBridge = frostyBridge_;
        frostyFunctionId = frostyFunctionId_;
    }

    function setMintActive(bool active) external onlyOwner {
        mintActive = active;
        emit MintActiveUpdated(active);
    }

    function setBaseURI(string memory baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
        emit BaseURISet(baseURI_);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // Anybody can mint a Hot Potato for free while minting is active :)
    function mint() external returns (uint256) {
        require(mintActive, "Mint is inactive");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(msg.sender, tokenId);
        emit Minted(msg.sender, tokenId);
        return tokenId;
    }

    // The owner of the hot potato can sign any hash with the potato's key.
    // The signing is performed through Threshold Signing on the Internet Computer
    // and invoked via the Frosty Bridge. The gas costs for that need to be paid
    // with the call. The returned jobId can be used to fetch the signature from
    // the Internet Computer once the job is complete.
    function signHash(uint256 tokenId, bytes32 hash) external payable returns (uint256) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        uint256 jobId = IFrostyBridge(frostyBridge).invokeFunction{value: msg.value}(
            frostyFunctionId,
            abi.encode(tokenId, hash)
        );
        emit SignHash(tokenId, hash, jobId);
        return jobId;
    }

    receive() external payable {
        revert("ETH not accepted");
    }

    fallback() external payable {
        revert("ETH not accepted");
    }
}
