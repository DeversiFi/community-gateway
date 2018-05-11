pragma solidity 0.4.22;
import "./MiniMeToken.sol";

/*
    Copyright 2017, Will Harborne (Ethfinex)
*/

contract DestructibleMiniMeToken is MiniMeToken {

  address terminator;

  function DestructibleMiniMeToken(
      address _tokenFactory,
      address _parentToken,
      uint _parentSnapShotBlock,
      string _tokenName,
      uint8 _decimalUnits,
      string _tokenSymbol,
      bool _transfersEnabled,
      address _terminator
  ) public MiniMeToken(
      _tokenFactory,
      _parentToken,
      _parentSnapShotBlock,
      _tokenName,
      _decimalUnits,
      _tokenSymbol,
      _transfersEnabled
    ) {
        terminator = _terminator;
      }

  function recycle() public {
    require(msg.sender == terminator);
    selfdestruct(terminator);
  }
}

contract DestructibleMiniMeTokenFactory {

    /// @notice Update the DApp by creating a new token with new functionalities
    ///  the msg.sender becomes the controller of this clone token
    /// @param _parentToken Address of the token being cloned
    /// @param _snapshotBlock Block of the parent token that will
    ///  determine the initial distribution of the clone token
    /// @param _tokenName Name of the new token
    /// @param _decimalUnits Number of decimals of the new token
    /// @param _tokenSymbol Token Symbol for the new token
    /// @param _transfersEnabled If true, tokens will be able to be transferred
    /// @return The address of the new token contract
    function createDestructibleCloneToken(
        address _parentToken,
        uint _snapshotBlock,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol,
        bool _transfersEnabled
    ) public returns (DestructibleMiniMeToken) {
        DestructibleMiniMeToken newToken = new DestructibleMiniMeToken(
            this,
            _parentToken,
            _snapshotBlock,
            _tokenName,
            _decimalUnits,
            _tokenSymbol,
            _transfersEnabled,
            msg.sender
            );

        newToken.changeController(msg.sender);
        return newToken;
    }
}
