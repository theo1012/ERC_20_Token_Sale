var DappToken = artifacts.require("./DappToken.sol");
var DappTokenSale = artifacts.require("./DappTokenSale.sol");

module.exports = async (deployer) => {
  await deployer.deploy(DappToken, 1000000);
  await deployer.deploy(DappTokenSale, DappToken.address, 1000000000000000);
};