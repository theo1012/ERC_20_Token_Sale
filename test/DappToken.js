var DappToken = artifacts.require('./DappToken.sol');
const mlog = require("mocha-logger");

contract('DappToken', function(accounts) {
    before(async () => {
        this.tokenInstance = await DappToken.deployed()
    });

    it('initializes the contract with the correct values', async () => {
        assert.equal(await this.tokenInstance.name(), 'DApp Token', 'has the correct name');
        assert.equal(await this.tokenInstance.symbol(), 'DAT', 'has the correct symbol');
        assert.equal(await this.tokenInstance.standard(), 'DApp Token v1.0', 'has the correct standard');
    });
    
    it('sets the total supply upon deployment', async () => {
        assert.equal((await this.tokenInstance.totalSupply()).toNumber(), 1000000, 'sets the total supply to 1,000,000');
        assert.equal((await this.tokenInstance.balanceOf(accounts[0])).toNumber(), 1000000, 'it allocates the initial supply to the admin account');
    });

    it('transfers token ownership', async () => {
        try {
            await this.tokenInstance.transfer.call(accounts[1], 99999999999999);
            assert(false);
        } catch(error) {
            mlog.log(error.message);
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }
        assert.equal(await this.tokenInstance.transfer.call(accounts[1], 250000, {from: accounts[0]}), true, 'it returns true');
        const receipt = await this.tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] });
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
        assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transferred from');
        assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transferred to');
        assert.equal(receipt.logs[0].args._value, 250000, 'logs the transfer amount');
        assert.equal((await this.tokenInstance.balanceOf(accounts[1])).toNumber(), 250000, 'adds the amount to the receiving account');
        assert.equal((await this.tokenInstance.balanceOf(accounts[0])).toNumber(), 750000, 'deducts the amount from the sending account');
    });

    it('approves tokens for delegated transfer', async () => {
        const success = await this.tokenInstance.approve.call(accounts[1], 100);
        assert.equal(success, true, 'it returns true');
        const receipt = await this.tokenInstance.approve(accounts[1], 100, {from: accounts[0]});
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal(receipt.logs[0].event, 'Approval', 'should be the Approval event');
        assert.equal(receipt.logs[0].args._owner, accounts[0], 'logs the account the tokens are authorized by');
        assert.equal(receipt.logs[0].args._spender, accounts[1], 'logs the acocunt the tokens are authorized to');
        assert.equal(receipt.logs[0].args._value, 100, 'logs the transfer amount');
        const allowance = await this.tokenInstance.allowance(accounts[0], accounts[1]);
        assert.equal(allowance.toNumber(), 100, 'stores the allowance for delegated transfer');
    });

    it('handles delegated token transfers', async () => {
        fromAccount = accounts[2];
        toAccount = accounts[3];
        spendingAccount = accounts[4];

        await this.tokenInstance.transfer(fromAccount, 100, {from: accounts[0]});
        await this.tokenInstance.approve(spendingAccount, 10, {from: fromAccount});
        
        try {
            await this.tokenInstance.transferFrom(fromAccount, toAccount, 99, {from: spendingAccount});
        } catch (error) {
            mlog.log(`${error.message} | cannot transfer value larger than balance`);
            assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
        }
        try {
            await this.tokenInstance.transferFrom(fromAccount, toAccount, 20, {from: spendingAccount});
        } catch (error) {
            mlog.log(`${error.message} | cannot transfer value larger than approved amount`);
            assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
        }
        let receipt = await this.tokenInstance.transferFrom(fromAccount, toAccount, 10, {from: spendingAccount});
        assert.equal(receipt.logs.length,1, 'triggers one event');
        assert.equal(receipt.logs[0].event, 'Transfer', 'should be the Transfer event');
        assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the account the tokens are transferred from');
        assert.equal(receipt.logs[0].args._to, toAccount, 'logs the account the tokens are transferred to');
        assert.equal(receipt.logs[0].args._value, 10, 'logs the transfer amount');
        assert.equal((await this.tokenInstance.balanceOf(fromAccount)).toNumber(), 90, 'deducts the amount from the sending account');
        assert.equal((await this.tokenInstance.balanceOf(toAccount)).toNumber(), 10, 'adds the amount to the receiving account');
        assert.equal((await this.tokenInstance.allowance(fromAccount, spendingAccount)).toNumber(), 0, 'deducts the amount from the allowance');
    });
});