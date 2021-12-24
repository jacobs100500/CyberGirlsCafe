const toWei = web3.utils.toWei;
const { expectRevert } = require('./exceptions.js');

function testMetadata(instance, name, symbol, owner, other) {
    describe('metadata', function () {
        before(async function () {
            this.token = await instance();
        });

        it('has a name', async function () {
            assert.equal(await this.token.name(), name);
        });
    
        it('has a symbol', async function () {
            assert.equal(await this.token.symbol(), symbol);
        });
    
        describe('token URI', function () {
            before(async function () {
                await this.token.mint(1, { from : owner, value : toWei('0.07')});
            });
    
            it('return empty string by default', async function () {
                assert.equal(await this.token.tokenURI(1), '');
            });
    
            it('reverts when queried for non existent token id', async function () {
                await expectRevert(
                    this.token.tokenURI(10),
                    'ERC721Metadata: URI query for nonexistent token'
                );
            });
    
            describe('base URI', function () {
                it('not allow change base URI from other', async function () {
                    const baseURI = "https://cybergirlscafe.io/tokens/metadata/";
                    await expectRevert(
                        this.token.setBaseURI(baseURI, { from : other }),
                        "Ownable: caller is not the owner",
                    );
                });

                it('base URI is added as a prefix to the token URI', async function () {
                    const baseURI = "https://cybergirlscafe.io/tokens/metadata/";
                    await this.token.setBaseURI(baseURI);
                    assert.equal(await this.token.tokenURI(1), baseURI + "1");
                });
        
                it('token URI can be changed by changing the base URI', async function () {
                    const newBaseURI = 'https://cybergirlscafe.io/tokens/metadata/v2/';
                    await this.token.setBaseURI(newBaseURI);
                    assert.equal(await this.token.tokenURI(1), newBaseURI + "1");
                });
            });

            describe('contract URI', function () {
                it('not allow change contract URI from other', async function () {
                    const contractURI = "https://cybergirlscafe.io/contract";
                    await expectRevert(
                        this.token.setContractURI(contractURI, { from : other }),
                        "Ownable: caller is not the owner",
                    );
                });

                it('contract URI is added', async function () {
                    const contractURI = "https://cybergirlscafe.io/contract";
                    await this.token.setContractURI(contractURI);
                    assert.equal(await this.token.contractURI(), contractURI);
                });
            });
        });
    });
}

module.exports = { testMetadata };