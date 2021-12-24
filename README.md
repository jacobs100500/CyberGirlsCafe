# CyberGirlsCafe - ERC721 Contract

This contract is based on the [OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/token/ERC721) template.
We have optimized it to use gas more efficiently.
The efficiency reaches 45-75% compared to the basic implementation.
We partially retain support for the Enumerable interface, so that third-party applications, such as marketplaces, could easily interact with the contract.

Below is a table of how gas is used for token minting. Let's imagine that the price of gas is 60 Gwei and the price of Ethereum is 4000 USD.

| Number of tokens | Gas used | Transaction fee in USD |
| ---------------- | -------- | ---------------------- |
| 1                | 75123    | 18.02952               |
| 2                | 99935    | 23.9844                |
| 5                | 174371   | 41.84904               |
| 10               | 298432   | 71.62368               |
| 20               | 546554   | 131.17296              |

Note: The MainNet consumes slightly more gas (~6%) than the test environment.

Smart contract address in MainNet - [0xf8c0acb14328aa09398f1cfd949fa2bdfeaa1cd7](https://etherscan.io/address/0xf8c0acb14328aa09398f1cfd949fa2bdfeaa1cd7)

## ProxyRegistry

Our contract interacts with OpenSea's `ProxyRegistry`.
This allows users to avoid paying gas for `SetApprovalForAll` when trading.
This is a safe feature that is recommended to be installed in smart contracts in the official OpenSea technical documentation.
Read more here - [OpenSea Whitelisting](https://docs.opensea.io/docs/1-structuring-your-smart-contract#opensea-whitelisting-optional).

In our contract, this is implemented in the file [CyberGirlsCafe.sol](https://github.com/jacobs100500/CyberGirlsCafe/blob/master/contracts/CyberGirlsCafe.sol#L133) (line 133).

In the template from OpenSea this is implemented here - [ERC721Tradable.sol](https://github.com/ProjectOpenSea/opensea-creatures/blob/master/contracts/ERC721Tradable.sol#L77)

## Provenance Hash

We use Provenance Hash technology (more details here - [Provenance Hash solution](https://medium.com/coinmonks/the-elegance-of-the-nft-provenance-hash-solution-823b39f99473)),
to prove to the community that each Cyber Girl is created in a certain order before the smart contract is published.
This order and images cannot be changed afterwards.

Each image is hashed using the SHA-256 algorithm.
Then all the hashes are combined in the proper order into a single hash string `CONCATENATED HASH STRING`.
This string is hashed using the SHA-256 algorithm and results in a `FINAL PROOF HASH`.

```
CONCATENATED HASH STRING = sha256('Token 1 Hash' + 'Token 2 Hash' + ... + 'Token 10010 Hash')
FINAL PROOF HASH = sha256(CONCATENATED HASH STRING)
```

Our contract stores the `FINAL PROOF HASH` in the file [CyberGirlsCafe.sol](https://github.com/jacobs100500/CyberGirlsCafe/blob/master/contracts/CyberGirlsCafe.sol#L22) on line 22.

```
string public constant PROVENANCE = "8fef626f47a65408f131274eefff04588dbd9a2eee69460efe986e72ae3c119c";
```

You can see the full list of hashes here - [CyberGirlsCafe Provenance](https://cybergirlscafe.io/provenance#provenance).

## Whitelist

We have implemented the whitelist in the contract, which allows users from that list to mint a token for 0.045 ETH (the discount is 0.025 ETH). One user from the whitelist can mint a maximum of 4 tokens.

## Development

The project is made using [Truffle](https://github.com/trufflesuite/truffle), so you need Node.js and this package to work with it.

### Install

```
npm install -g truffle
```

### Run tests

We have completely tested the contract using OpenZeppelin tests as a basis. Running the tests takes a long time.

```
cd path/to/CyberGirlsCafe
truffle test
```

### Deploy

To deploy the contract you need:
1. Install the `truffle-hdwallet-provider` package.
2. Specify the `mnemonic` and `providerUrl` arguments in `truffle-config.js`.
3. Specify the contract constructor arguments in `migrations/1_initial_migration.js`.

```
npm install truffle-hdwallet-provider
truffle compile
truffle migrate --network rinkeby
```