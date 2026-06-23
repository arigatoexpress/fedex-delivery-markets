// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DeliveryMarketResolver
/// @notice Demo-only resolver for synthetic delivery-time prediction markets.
/// @dev This contract intentionally holds no funds and accepts no payable calls.
contract DeliveryMarketResolver {
    enum MarketStatus {
        Open,
        CutoffLocked,
        Resolved
    }

    struct Market {
        bytes32 trackingNumberHash;
        bytes32 questionHash;
        uint64 cutoffAt;
        MarketStatus status;
        bool yesWon;
        bytes32 finalEventHash;
        string hcsTopicId;
        uint64 hcsSequenceNumber;
        string hcsConsensusTimestamp;
    }

    address public owner;
    address public pendingOwner;
    address public oracle;
    bool public paused;
    mapping(bytes32 => Market) public markets;

    event OracleUpdated(address indexed oracle);
    event MarketCreated(bytes32 indexed marketId, bytes32 indexed trackingNumberHash, uint64 cutoffAt);
    event MarketCutoffLocked(bytes32 indexed marketId);
    event MarketResolved(
        bytes32 indexed marketId,
        bool yesWon,
        bytes32 finalEventHash,
        string hcsTopicId,
        uint64 hcsSequenceNumber,
        string hcsConsensusTimestamp
    );
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);

    error NotOwner();
    error NotOracle();
    error MarketExists();
    error MarketMissing();
    error AlreadyResolved();
    error PayableDisabled();
    error ZeroAddress();
    error EnforcedPause();
    error CutoffNotReached();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert EnforcedPause();
        _;
    }

    constructor(address initialOracle) {
        if (initialOracle == address(0)) revert ZeroAddress();
        owner = msg.sender;
        oracle = initialOracle;
        paused = false;
        emit OracleUpdated(initialOracle);
    }

    receive() external payable {
        revert PayableDisabled();
    }

    fallback() external payable {
        revert PayableDisabled();
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotOwner();
        address previousOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipTransferred(previousOwner, owner);
    }

    function setOracle(address nextOracle) external onlyOwner {
        if (nextOracle == address(0)) revert ZeroAddress();
        oracle = nextOracle;
        emit OracleUpdated(nextOracle);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function createMarket(
        bytes32 marketId,
        bytes32 trackingNumberHash,
        bytes32 questionHash,
        uint64 cutoffAt
    ) external onlyOwner whenNotPaused {
        if (markets[marketId].cutoffAt != 0) revert MarketExists();
        markets[marketId] = Market({
            trackingNumberHash: trackingNumberHash,
            questionHash: questionHash,
            cutoffAt: cutoffAt,
            status: MarketStatus.Open,
            yesWon: false,
            finalEventHash: bytes32(0),
            hcsTopicId: "",
            hcsSequenceNumber: 0,
            hcsConsensusTimestamp: ""
        });
        emit MarketCreated(marketId, trackingNumberHash, cutoffAt);
    }

    function lockCutoff(bytes32 marketId) external onlyOracle whenNotPaused {
        Market storage market = markets[marketId];
        if (market.cutoffAt == 0) revert MarketMissing();
        if (market.status == MarketStatus.Resolved) revert AlreadyResolved();
        if (block.timestamp < market.cutoffAt) revert CutoffNotReached();
        market.status = MarketStatus.CutoffLocked;
        emit MarketCutoffLocked(marketId);
    }

    function resolve(
        bytes32 marketId,
        bool yesWon,
        bytes32 finalEventHash,
        string calldata hcsTopicId,
        uint64 hcsSequenceNumber,
        string calldata hcsConsensusTimestamp
    ) external onlyOracle whenNotPaused {
        Market storage market = markets[marketId];
        if (market.cutoffAt == 0) revert MarketMissing();
        if (market.status == MarketStatus.Resolved) revert AlreadyResolved();
        if (market.status != MarketStatus.CutoffLocked) revert CutoffNotReached();

        market.status = MarketStatus.Resolved;
        market.yesWon = yesWon;
        market.finalEventHash = finalEventHash;
        market.hcsTopicId = hcsTopicId;
        market.hcsSequenceNumber = hcsSequenceNumber;
        market.hcsConsensusTimestamp = hcsConsensusTimestamp;

        emit MarketResolved(
            marketId,
            yesWon,
            finalEventHash,
            hcsTopicId,
            hcsSequenceNumber,
            hcsConsensusTimestamp
        );
    }
}
