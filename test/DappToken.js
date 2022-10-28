var DappToken = artifacts.require('./DappToken.sol');

contract('DappToken', function(accounts) {
    before(async () => {
        this.tokenInstance = await DappToken.deployed()
    })

    it('initializes the contract with the correct values', async () => {
        const name = await this.tokenInstance.name();
        assert.equal(name, 'DApp Token', 'has the correct name');
        const symbol = await this.tokenInstance.symbol();
        assert.equal(symbol, 'DAT', 'has the correct symbol');
        const standard = await this.tokenInstance.standard();
        assert.equal(standard, 'DApp Token v1.0', 'has the correct standard');
    });
    
    it('sets the total supply upon deployment', async () => {
        const totalSupply = await this.tokenInstance.totalSupply();
        assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1,000,000');
        const adminBalance = await this.tokenInstance.balanceOf(accounts[0]);
        assert.equal(adminBalance.toNumber(), 1000000, 'it allocates the initial supply to the admin account');
    });

    it('transfers token ownership', async () => {
        let success = false;
        try {
            await this.tokenInstance.transfer.call(accounts[1], 99999999999999);
        } catch(error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
            success = await this.tokenInstance.transfer.call(accounts[1], 250000, {from: accounts[0]});
        }
        assert.equal(success, true, 'it returns true');
        const receipt = await this.tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] });
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
        assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transferred from');
        assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transferred to');
        assert.equal(receipt.logs[0].args._value, 250000, 'logs the transfer amount');
        let balance = await this.tokenInstance.balanceOf(accounts[1]);
        assert.equal(balance.toNumber(), 250000, 'adds the amount to the receiving account');
        balance = await this.tokenInstance.balanceOf(accounts[0]);
        assert.equal(balance.toNumber(), 750000, 'deducts the amount from the sending account');
    });
});