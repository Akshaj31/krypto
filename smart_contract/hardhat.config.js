//https://eth-sepolia.g.alchemy.com/v2/fjQof5vG2ZBAsgdeYjY_AzswzwKOCDN_

require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity : "0.8.0",
  networks : {
    sepolia : {
      url : "https://eth-sepolia.g.alchemy.com/v2/fjQof5vG2ZBAsgdeYjY_AzswzwKOCDN_",
      accounts : ['2e234cea37df5f71a292cb69e32e06e2cd48920417c73e6b3d56fad95bf839f3']
    }
  }
}
