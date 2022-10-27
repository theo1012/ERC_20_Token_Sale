var DappToken = artifacts.require('./DappToken.sol');

contract('DappToken', function(accounts) {
    before(async () => {
        this.tokenInstance = await DappToken.deployed()
    })
    
    it('sets the total supply upon deployment', async () => {
        const totalSupply = await this.tokenInstance.totalSupply()
        assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1,000,000');
    })
});