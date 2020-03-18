pragma solidity >=0.4.22 <0.6.0;

contract Authentication {
    address public creatorAdmin;
    
    mapping(address => int) public users;
    
    enum role { user, manager, builder, government, admin, superadmin }
    
    mapping(address => role) public Users;

    event message(string message);
    
    modifier hasRole (role _role) {
        role userRole = Users[msg.sender];
        require(userRole >= _role, "Unverified");
        _;
    }
    
	// Initializing the Contract.
	constructor()  public {
		creatorAdmin = msg.sender;
		users[creatorAdmin] = 2;
		Users[creatorAdmin] = role.superadmin;
	}

	// Add new user.
	function addUser(address _newUser, role _role) public hasRole(role.superadmin) returns (address) {
	    require(users[_newUser] == 0, "user already exist");
	    users[_newUser] = 1;
	    Users[_newUser] = _role;
	    return _newUser;
	}
	
	// Change User role.
	function changeRole(address _newUser, role _role) public hasRole(role.superadmin) returns (bool) {
	    require(users[_newUser] != 0, "user doesn't exist");
	    Users[_newUser] = _role;
	    return true;
	}
	
	function getRole(address _address) public view returns (role) {
	    return Users[_address];
	}
}