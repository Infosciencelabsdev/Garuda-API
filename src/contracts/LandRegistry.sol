pragma solidity >=0.4.22 <0.6.0;
pragma experimental ABIEncoderV2;

import "./Authentication.sol";

contract LandRegistry is Authentication {
    
    event transferLand(address ownerAddress);
    event PropertyCreated(address ownerAddress);

    event message(string message);

    struct PropertyDetail {
        uint propertyId;
        string hash;
        string name;
        uint[] location;
        uint value;
        address owner;
        Address direction;
        Status status;
        address listedBy;
    }
    struct Address{
        string street;
        string city;
        string state;
        string country;
        uint zip;
    }
    enum Status { NotExist, Pending, Approved, Rejected }
	mapping(uint => address[]) public OwnerChain;

	// Get the property details.
	function getPropertyDetails(uint _propId) public view returns (PropertyDetail memory) {
		return (properties[_propId]);
	}
	// Dictionary of all the properties, mapped using their { propertyId: PropertyDetail } pair.
	mapping(uint => PropertyDetail) public properties;
	mapping(uint => address) public propOwnerChange;
    
    
    // Mapping all the properties for a user.
    mapping(address => PropertyDetail[]) internal userProperties; // ToDo:
    mapping(address => int) public userPropertyCount;
    
    // Marketplace
	struct market {
	    uint propertyId;
	    uint value;
	    string listingType;
	    address listedBy;
	    MarketStatus status;
	}
	enum MarketStatus { NotExist, Listed, Tender, Rent, Sold, Unlisted }

	// Marketplace for properties
	market[] public marketplace;

	modifier onlyOwner(uint _propId) {
	    require(properties[_propId].owner == msg.sender);
        _;
	}
    
	// Initializing the Contract.
	constructor()  public{
		creatorAdmin = msg.sender;
	}
	
	// Create a new Property.
	function createProperty(address owner, uint _propId, string memory hash, uint _value, uint[] memory _location, string memory _name, Address memory _address) public hasRole(role.user) returns (bool) {
        if (Users[msg.sender] == role.builder) {
		    properties[_propId] = PropertyDetail(_propId, hash, _name, _location, _value, owner, _address, Status.Approved, msg.sender);
        } else {
		    properties[_propId] = PropertyDetail(_propId, hash, _name, _location, _value, owner, _address, Status.Pending, msg.sender);
        }
		emit PropertyCreated(owner);
		return true;
	}

	// Approve the new Property.
	function approveProperty(uint _propId) public hasRole(role.government) returns (bool){
		properties[_propId].status = Status.Approved;
		return true;
	}

	// Reject the new Property.
	function rejectProperty(uint _propId) public hasRole(role.government) returns (bool){
		properties[_propId].status = Status.Rejected;
		return true;
	}
    // Property buy request
	function buyRequest(uint _propId, address _newOwner) public onlyOwner(_propId) hasRole(role.user) returns (bool) {
		require(propOwnerChange[_propId] == address(0), "Already requested. Wait for verification");
		propOwnerChange[_propId] = _newOwner;
		return true;
	}

	// Request Change of Ownership. Transfer
	function changeOwnership(uint _propId, address _newOwner) public onlyOwner(_propId) hasRole(role.user) returns (bool) {
		require(properties[_propId].owner == msg.sender, " Only Owner can change ownership");
		require(propOwnerChange[_propId] == address(0), "Already requested. Wait for verification");
		propOwnerChange[_propId] = _newOwner;
		return true;
	}

	// Approve change in Onwership.
	function approveChangeOwnership(uint _propId) public hasRole(role.government) returns (bool) {
	    require(propOwnerChange[_propId] != address(0));
	    properties[_propId].owner = propOwnerChange[_propId];
	    propOwnerChange[_propId] = address(0);
	    userProperties[propOwnerChange[_propId]][_propId] = properties[_propId];
        emit transferLand(propOwnerChange[_propId]);
	    return true;
	}

	// Change the price of the property.
    function changeValue(uint _propId, uint _newValue) public onlyOwner(_propId) returns (bool) {
        require(propOwnerChange[_propId] == address(0));
        properties[_propId].value = _newValue;
        return true;
    }
	
	function getUserProperties(address userAddress) public hasRole(role.user) view returns (PropertyDetail[] memory){
	    return userProperties[userAddress];
	}
	
	function getMarketplace() public hasRole(role.user) view returns (market[] memory){
	    return marketplace;
	}
		
	function listMarketplace(uint _propId, uint _value, string memory listingType) public hasRole(role.user) returns (market memory){
	    marketplace[_propId] = market(_propId, _value, listingType,  msg.sender, MarketStatus.Listed);
	    return marketplace[_propId];
	}

}