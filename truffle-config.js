var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "recovery phrase or private key";
var rinkebyProviderUrl = "https://rinkeby.infura.io/v3/infura_api_key";
var mainnetProviderUrl = "https://mainnet.infura.io/v3/infura_api_key";

module.exports = {
    networks: {
        loc_development_development: {
            network_id: "*",
            port: 7545,
            host: "127.0.0.1",
            gas: 50000000
        },
        rinkeby: {
            provider: function() { 
                return new HDWalletProvider(mnemonic, rinkebyProviderUrl);
            },
            network_id: 4,
            gas: 3000000,
            gasPrice: 5000000000, // 5 Gwei
        },
        mainnet: {
            network_id: 1,
            provider: function () {
                return new HDWalletProvider(mnemonic, mainnetProviderUrl);
            },
            gas: 3000000,
            gasPrice: 40000000000, // 40 Gwei
        },
    },
    mocha: {},
    compilers: {
        solc: {
            version: "^0.8.11",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
        }
    }
};