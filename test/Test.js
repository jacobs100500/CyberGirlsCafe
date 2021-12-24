const CyberGirlsCafeMock = artifacts.require("./CyberGirlsCafeMock");
const ProxyRegistryMock = artifacts.require("./ProxyRegistryMock");
const { testMetadata } = require('./TestMetaData.js');
const { testApprovalForAll } = require('./TestApprovalForAll.js');
const { testApprove } = require('./TestApprove.js');
const { testTransfers } = require('./TestTransfers.js');
const { testSafeTransfers } = require('./TestSafeTransfers.js');
const { testEnumerable } = require('./TestEnumerable.js');
const { testMint } = require('./TestMint.js');
const { testWithdraw } = require('./TestWithdraw.js');
const { testWhitelist } = require('./TestWhitelist.js');
const { testEstimateGas } = require('./TestEstimateGas.js');

contract('CyberGirlsCafe', function (accounts) {
    const name = 'CyberGirlsCafe';
    const symbol = 'CGC';
    let proxyRegistry;
    const instance = async () => {
        if(proxyRegistry == null)
            proxyRegistry = await ProxyRegistryMock.new();

        return await CyberGirlsCafeMock.new(name, symbol, "", "", proxyRegistry.address);
    }

    it("test supports interfaces", async () => {
        let token = await instance();

        assert.equal(await token.supportsInterface("0x01ffc9a7"), true, "Contract is not supports IERC165");
        assert.equal(await token.supportsInterface("0x5b5e139f"), true, "Contract is not supports IERC721Metadata");
        assert.equal(await token.supportsInterface("0x780e9d63"), false, "Contract is supports IERC721Enumerable");
        assert.equal(await token.supportsInterface("0x80ac58cd"), true, "Contract is not supports IERC721");
        assert.equal(await token.supportsInterface("0x150b7a02"), false, "Contract is supports ERC721TokenReceiver");
    });
    
    testMetadata(instance, name, symbol, ...accounts);
    testApprovalForAll(instance, ...accounts);
    testApprove(instance, ...accounts);
    testTransfers(instance, ...accounts);
    testSafeTransfers(instance, ...accounts);
    testEnumerable(instance, ...accounts);
    testMint(instance, ...accounts);
    testWithdraw(instance, ...accounts);
    testWhitelist(instance, ...accounts);

    // Use to show estimated gas
    testEstimateGas(instance, ...accounts);
});