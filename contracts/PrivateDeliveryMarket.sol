// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PrivateDeliveryMarket
/// @notice Testnet-only receipt contract for recipient-scoped delivery prediction markets.
/// @dev This contract intentionally does not custody funds. It records permissioned market
/// receipts that can be paired with an offchain/paper AMM while Robinhood/Polymarket partner
/// routes are reviewed separately.
contract PrivateDeliveryMarket {
    enum Outcome {
        Unresolved,
        Yes,
        No
    }

    struct Market {
        bytes32 trackingHash;
        bytes32 marketKey;
        address recipient;
        address oracle;
        uint64 cutoffAt;
        uint16 initialYesBps;
        bool resolved;
        Outcome outcome;
    }

    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => bool) public tradeReceipts;

    event MarketCreated(
        bytes32 indexed marketKey,
        bytes32 indexed trackingHash,
        address indexed recipient,
        uint64 cutoffAt,
        uint16 initialYesBps
    );
    event TradeRecorded(
        bytes32 indexed marketKey,
        bytes32 indexed offchainOrderId,
        address indexed recipient,
        bool yes,
        uint256 contractsCount,
        uint256 limitPriceCents
    );
    event MarketResolved(bytes32 indexed marketKey, Outcome outcome, bytes32 oracleAnchorHash);

    error MarketAlreadyExists();
    error UnknownMarket();
    error NotRecipient();
    error CutoffPassed();
    error AlreadyResolved();
    error InvalidRecipient();
    error InvalidProbability();
    error DuplicateReceipt();

    function createMarket(
        bytes32 marketKey,
        bytes32 trackingHash,
        address recipient,
        uint64 cutoffAt,
        uint16 initialYesBps
    ) external {
        if (markets[marketKey].recipient != address(0)) revert MarketAlreadyExists();
        if (recipient == address(0)) revert InvalidRecipient();
        if (initialYesBps == 0 || initialYesBps >= 10_000) revert InvalidProbability();

        markets[marketKey] = Market({
            trackingHash: trackingHash,
            marketKey: marketKey,
            recipient: recipient,
            oracle: msg.sender,
            cutoffAt: cutoffAt,
            initialYesBps: initialYesBps,
            resolved: false,
            outcome: Outcome.Unresolved
        });

        emit MarketCreated(marketKey, trackingHash, recipient, cutoffAt, initialYesBps);
    }

    function recordTrade(
        bytes32 marketKey,
        bool yes,
        uint256 contractsCount,
        uint256 limitPriceCents,
        bytes32 offchainOrderId
    ) external {
        Market storage market = markets[marketKey];
        if (market.recipient == address(0)) revert UnknownMarket();
        if (msg.sender != market.recipient) revert NotRecipient();
        if (block.timestamp >= market.cutoffAt) revert CutoffPassed();
        if (market.resolved) revert AlreadyResolved();
        if (tradeReceipts[offchainOrderId]) revert DuplicateReceipt();

        tradeReceipts[offchainOrderId] = true;
        emit TradeRecorded(
            marketKey,
            offchainOrderId,
            msg.sender,
            yes,
            contractsCount,
            limitPriceCents
        );
    }

    function resolve(bytes32 marketKey, Outcome outcome, bytes32 oracleAnchorHash) external {
        Market storage market = markets[marketKey];
        if (market.recipient == address(0)) revert UnknownMarket();
        if (market.resolved) revert AlreadyResolved();
        if (msg.sender != market.oracle) revert NotRecipient();
        if (outcome == Outcome.Unresolved) revert InvalidProbability();

        market.resolved = true;
        market.outcome = outcome;
        emit MarketResolved(marketKey, outcome, oracleAnchorHash);
    }
}
