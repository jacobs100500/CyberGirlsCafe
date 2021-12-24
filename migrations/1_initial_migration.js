const CyberGirlsCafe = artifacts.require("./CyberGirlsCafe");

module.exports = async (deployer, network, addresses) => {
    // OpenSea proxy registry addresses for rinkeby and mainnet.
    let proxyRegistryAddress = "";
    if (network === 'rinkeby') {
        proxyRegistryAddress = "0xF57B2c51dED3A29e6891aba85459d600256Cf317";
    } else {
        proxyRegistryAddress = "0xa5409ec958C83C3f309868babACA7c86DCB077c1";
    }
    
    await deployer.deploy(
        CyberGirlsCafe,
        "CyberGirlsCafe",
        "CGC",
        "https://cybergirlscafe.io/tokens/metadata/",
        "https://cybergirlscafe.io/contract",
        proxyRegistryAddress
    );
};