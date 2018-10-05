pragma solidity ^0.4.24;

import "../common/EntryInterface.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/introspection/SupportsInterfaceWithLookup.sol";


//This is Example of EntryCore (Team's data scheme)
contract TeamSchema is EntryInterface, Ownable, SupportsInterfaceWithLookup {
    
    using SafeMath for uint256;
    
    bytes4 public constant InterfaceId_EntryCore = 0xd4b1117d;
    /**
     * 0xd4b1117d ===
     *   bytes4(keccak256('createEntry(uint256)')) ^
     *   bytes4(keccak256('deleteEntry(uint256)')) ^
     *   bytes4(keccak256('getEntriesAmount()')) ^
     *   bytes4(keccak256('getEntriesIDs()'))
     */

    struct Entry {
        string name;
        string manifest;
        string extension;
        string content;
        string logo;
    }
    
    mapping(string => bool) internal nameUniqIndex;
    
    uint256[] internal allTokens;
    
    mapping(uint256 => uint256) internal allEntriesIndex;
    
    Entry[] public entries;
    
    modifier entryExists(uint256 _entryID) {
        if (allEntriesIndex[_entryID] == 0) {
            require(allTokens[0] == _entryID);
        } else {
            require(allEntriesIndex[_entryID] != 0);
        }
        _;
    }
    
    constructor()
        public
    {
        _registerInterface(InterfaceId_EntryCore);
    }
    
    function() external {} 
    
    function createEntry(uint256 _entryID)
        external
        onlyOwner
    {
        Entry memory m = (Entry(
        {
            name:       "",
            manifest:   "",
            extension:  "",
            content:    "",
            logo:       ""
        }));

        entries.push(m);
        allEntriesIndex[_entryID] = allTokens.length;
        allTokens.push(_entryID);
    }
    
    function readEntry(uint256 _entryID)
        external
        view
        entryExists(_entryID)
        returns (
            string,
            string,
            string,
            string,
            string
        )
    {
        uint256 entryIndex = allEntriesIndex[_entryID];
        
        return (
            entries[entryIndex].name,
            entries[entryIndex].manifest,
            entries[entryIndex].extension,
            entries[entryIndex].content,
            entries[entryIndex].logo
        );
    }

    // Example: you can write methods for earch parameter and update them separetly
    function updateEntry(
        uint256 _entryID,
        string  _name,
        string  _manifest,
        string  _extension,
        string  _content,
        string  _logo
    )
        external
    {
        // checkEntryOwnership will return
        // if [token exist && msg.sender == tokenOwner] true
        // else [checkEntryOwnership will fail] false
        require(owner.call(bytes4(keccak256(
            "checkEntryOwnership(uint256, address)")),
            _entryID,
            msg.sender
        ));
        
        //before we check that value already exist, then set than name used and unset previous value
        require(nameUniqIndex[_name] == false);
        nameUniqIndex[_name] = true;
        
        uint256 entryIndex = allEntriesIndex[_entryID];
        
        string storage lastName = entries[entryIndex].name;
        nameUniqIndex[lastName] = false;
            
        Entry memory m = (Entry(
        {
            name:       _name,
            manifest:   _manifest,
            extension:  _extension,
            content:    _content,
            logo:       _logo
        }));
        entries[entryIndex] = m;
        
        // here we just calling registry with entry ID and set entry updating timestamp
        require(owner.call(bytes4(keccak256(
            "updateEntryTimestamp(uint256)")),
            _entryID
        ));
    }

    function deleteEntry(uint256 _entryID)
        external
        onlyOwner
    {
        require(entries.length > 0);
        uint256 entryIndex = allEntriesIndex[_entryID];
        
        string storage nameToClear = entries[entryIndex].name;
        nameUniqIndex[nameToClear] = false;
        
        uint256 lastTokenIndex = allTokens.length.sub(1);
        
        uint256 lastToken = allTokens[lastTokenIndex];
        Entry memory lastEntry = entries[lastTokenIndex];
        
        allTokens[entryIndex] = lastToken;
        entries[entryIndex] = lastEntry;
        
        allTokens[lastTokenIndex] = 0;
        delete entries[lastTokenIndex];
        
        allTokens.length--;
        entries.length--;
        
        allEntriesIndex[_entryID] = 0;
        allEntriesIndex[lastTokenIndex] = entryIndex;
    }

    function getEntriesAmount()
        external
        view
        returns (uint256)
    {
        return entries.length;
    }
    
    function getEntriesIDs()
        external
        view
        returns (uint256[])
    {
        return allTokens;
    }
    
}
