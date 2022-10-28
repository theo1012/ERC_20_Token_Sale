const mochaLogger = require("mocha-logger");

var DappToken = artifacts.require('./DappToken.sol');
var DappTokenSale = artifacts.require('./DappTokenSale.sol');

contract('DappTokenSale', function(accounts) {
    before(async () => {
        this.tokenInstance = await DappToken.deployed();
        this.tokenSaleInstance = await DappTokenSale.deployed();
    });

    const [admin, buyer] = accounts;
    const tokenPrice = 1000000000000000;
    const tokensAvailable = 750000;
    const numberOfTokens = 10;

    it('initializes the contract with the correct values', async () => {
        assert.notEqual(this.tokenSaleInstance.address, 0x0, 'has contract address');
        assert.notEqual(await this.tokenSaleInstance.tokenContract(), 0x0, 'has token contract address');
        assert.equal(await this.tokenSaleInstance.tokenPrice(), tokenPrice, 'token price is correct');
    });

    it('facilitates token buying', async () => {
        await this.tokenInstance.transfer(this.tokenSaleInstance.address, tokensAvailable, {from: admin})
        let receipt = await this.tokenSaleInstance.buyTokens(numberOfTokens, {from:  buyer, value: numberOfTokens * tokenPrice});
        assert.equal(receipt.logs.length, 1, 'triggers one event');
        assert.equal(receipt.logs[0].event, 'Sell', 'should be the Sell event');
        assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
        assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
        assert.equal((await this.tokenSaleInstance.tokensSold()).toNumber(), numberOfTokens, 'increments the number of tokens sold');
        assert.equal((await this.tokenInstance.balanceOf(buyer)).toNumber(), numberOfTokens);
        assert.equal((await this.tokenInstance.balanceOf(this.tokenSaleInstance.address)).toNumber(), tokensAvailable - numberOfTokens);
        try {
            await this.tokenSaleInstance.buyTokens(numberOfTokens, {from: buyer, value: 1});
        } catch (error) {
            mochaLogger.log(`${error.message} | msg.value must equal number of tokens in wei`);
            assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');
        }
        try {
            await this.tokenSaleInstance.buyTokens(800000, {from: buyer, value: numberOfTokens * tokenPrice});
        } catch (error) {
            mochaLogger.log(`${error.message} | cannot purchase more tokens than available`);
            assert(error.message.indexOf('revert') >= 0, 'cannot purchase more tokens than available');
        }
    });

    it('ends token sale', async () => {
        try {
            await this.tokenSaleInstance.endSale({from: buyer});
        } catch (error) {
            mochaLogger.log(`${error.message} | must be admin to end sale`);
            assert(error.message.indexOf('revert' >= 0, 'must be admin to end sale'));
        }
        await this.tokenSaleInstance.endSale({from: admin});
        assert.equal((await this.tokenInstance.balanceOf(admin)).toNumber(), 999990, 'returns all unsold dapp tokens to admin');
        assert.equal(await web3.eth.getBalance(this.tokenSaleInstance.address), 0);
    });
});