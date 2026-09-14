// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ICrowdfundingFactory} from "./interfaces/ICrowdfundingFactory.sol";
import {CrowdfundingCampaign} from "./CrowdfundingCampaign.sol";

/**
 * @title CrowdfundingFactory
 * @notice Factory registry and deployer for CrowdfundingCampaign contracts.
 * @dev Enforces 100% upfront collateralization before instantiating campaign escrows.
 */
contract CrowdfundingFactory is ICrowdfundingFactory {
    using SafeERC20 for IERC20;

    uint256 public constant RATE_PRECISION = 1e18;

    /// @notice Array of all deployed campaign contracts
    address[] public deployedCampaigns;

    /// @notice Mapping from creator address to array of created campaign addresses
    mapping(address => address[]) public creatorCampaigns;

    /**
     * @notice Creates and funds a new CrowdfundingCampaign instance.
     * @dev Transfers 100% of required reward collateral from msg.sender to the new campaign.
     * @param fundingToken The ERC-20 token address accepted for contributions
     * @param rewardToken The ERC-20 token address distributed as rewards
     * @param threshold Funding goal in fundingToken base units
     * @param rewardRate Reward tokens per funding token, scaled by 1e18
     * @param duration Campaign duration in seconds from current block timestamp
     * @return campaignAddress The address of the deployed CrowdfundingCampaign contract
     */
    function createCampaign(
        address fundingToken,
        address rewardToken,
        uint256 threshold,
        uint256 rewardRate,
        uint256 duration
    ) external override returns (address campaignAddress) {
        if (fundingToken == address(0) || rewardToken == address(0)) {
            revert InvalidTokenAddress();
        }
        if (threshold == 0) {
            revert InvalidThreshold();
        }
        if (rewardRate == 0) {
            revert InvalidRewardRate();
        }
        if (duration == 0) {
            revert InvalidDuration();
        }

        uint256 deadline = block.timestamp + duration;
        uint256 rewardCollateral = (threshold * rewardRate) / RATE_PRECISION;
        if (rewardCollateral == 0) {
            revert InvalidRewardRate();
        }

        // Deploy new isolated campaign instance
        CrowdfundingCampaign campaign = new CrowdfundingCampaign(
            msg.sender,
            fundingToken,
            rewardToken,
            threshold,
            rewardRate,
            deadline
        );

        campaignAddress = address(campaign);

        // Registry indexing
        deployedCampaigns.push(campaignAddress);
        creatorCampaigns[msg.sender].push(campaignAddress);

        emit CampaignCreated(
            campaignAddress,
            msg.sender,
            fundingToken,
            rewardToken,
            threshold,
            rewardRate,
            deadline,
            rewardCollateral
        );

        // Secure upfront escrow collateral from creator
        uint256 balanceBefore = IERC20(rewardToken).balanceOf(campaignAddress);
        IERC20(rewardToken).safeTransferFrom(msg.sender, campaignAddress, rewardCollateral);
        uint256 actualCollateral = IERC20(rewardToken).balanceOf(campaignAddress) - balanceBefore;
        if (actualCollateral < rewardCollateral) {
            revert InsufficientCollateral();
        }
    }

    /**
     * @notice Returns all deployed campaign contract addresses.
     */
    function getDeployedCampaigns() external view override returns (address[] memory) {
        return deployedCampaigns;
    }

    /**
     * @notice Returns total number of deployed campaigns.
     */
    function getDeployedCampaignsCount() external view override returns (uint256) {
        return deployedCampaigns.length;
    }

    /**
     * @notice Returns all campaign addresses created by a specific address.
     */
    function getCreatorCampaigns(address creator) external view override returns (address[] memory) {
        return creatorCampaigns[creator];
    }

    /**
     * @notice Returns total number of campaigns created by a specific address.
     */
    function getCreatorCampaignsCount(address creator) external view override returns (uint256) {
        return creatorCampaigns[creator].length;
    }
}
