const toWei = web3.utils.toWei;
const { expectRevert } = require('./exceptions.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function testEnumerable (instance, owner, newOwner, approved, anotherApproved, operator, other) {
    context('with minted tokens', function () {
        const beforeFunc = async function () {
            this.token = await instance();
            await this.token.mint(2, { from : owner, value : toWei('0.14')});
            await this.token.mint(2, { from : newOwner, value : toWei('0.14')});
            await this.token.mint(1, { from : owner, value : toWei('0.14')});
        };

        const firstTokenId = 1;
        const secondTokenId = 2;
        const thirdTokenId = 3;
        const foursTokenId = 4;
        const fiftTokenId = 5;

        const checkTotalSupply = function() {
            it('returns total token supply', async function () {
                assert.equal(await this.token.totalSupply(), 5);
                assert.equal(await this.token.tokenByIndex(0), firstTokenId);
                assert.equal(await this.token.tokenByIndex(1), secondTokenId);
                assert.equal(await this.token.tokenByIndex(2), thirdTokenId);
                assert.equal(await this.token.tokenByIndex(3), foursTokenId);
                assert.equal(await this.token.tokenByIndex(4), fiftTokenId);
            });
        };

        before(beforeFunc);

        describe('balanceOf', function () {
            context('when the given address owns some tokens', function () {
                it('returns the amount of tokens owned by the given address', async function () {
                    assert.equal(await this.token.balanceOf(owner), 3);
                    assert.equal(await this.token.balanceOf(newOwner), 2);
                });
            });
  
            context('when the given address does not own any tokens', function () {
                it('returns 0', async function () {
                    assert.equal(await this.token.balanceOf(other), 0);
                });
            });
  
            context('when querying the zero address', function () {
                it('throws', async function () {
                    await expectRevert(
                        this.token.balanceOf(ZERO_ADDRESS),
                        'ERC721: balance query for the zero address',
                    );
                });
            });
        });
  
        describe('ownerOf', function () {
            context('when the given token ID was tracked by this token', function () {
                it('returns the owner of the given token ID', async function () {
                    assert.equal(await this.token.ownerOf(firstTokenId), owner);
                    assert.equal(await this.token.ownerOf(secondTokenId), owner);
                    assert.equal(await this.token.ownerOf(thirdTokenId), newOwner);
                    assert.equal(await this.token.ownerOf(foursTokenId), newOwner);
                    assert.equal(await this.token.ownerOf(fiftTokenId), owner);
                });
            });
    
            context('when the given token ID was not tracked by this token', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.token.ownerOf(10),
                        'ERC721: owner query for nonexistent token',
                    );
                });
            });
        });

        describe('tokenByIndex', function () {
            checkTotalSupply();
    
            it('reverts if index is greater than supply', async function () {
                await expectRevert(
                    this.token.tokenByIndex(5),
                    'ERC721Enumerable: global index out of bounds',
                );
            });
        });
  
        describe('tokenOfOwnerByIndex', function () {
            before(beforeFunc);

            describe('when the given index is lower than the amount of tokens owned by the given address', function () {
                it('returns the token ID placed at the given index', async function () {
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 0), firstTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 1), secondTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(newOwner, 0), thirdTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(newOwner, 1), foursTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 2), fiftTokenId);
                });
            });
  
            describe('when the index is greater than or equal to the total tokens owned by the given address', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(owner, 3),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(newOwner, 2),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                });
            });
  
            describe('when the given address does not own any token', function () {
                it('reverts', async function () {
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(other, 0),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                });
            });

            describe('after transferring first tokens to newOwner user', function () {
                before(beforeFunc);
                before(async function () {
                    await this.token.transferFrom(owner, newOwner, firstTokenId, { from: owner });
                });
    
                it('returns correct token IDs for target', async function () {
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 0), secondTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 1), fiftTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(newOwner, 0), firstTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(newOwner, 1), thirdTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(newOwner, 2), foursTokenId);
                });

                it('returns the owner of the given token ID', async function () {
                    assert.equal(await this.token.ownerOf(secondTokenId), owner);
                    assert.equal(await this.token.ownerOf(fiftTokenId), owner);
                    assert.equal(await this.token.ownerOf(firstTokenId), newOwner);
                    assert.equal(await this.token.ownerOf(thirdTokenId), newOwner);
                    assert.equal(await this.token.ownerOf(foursTokenId), newOwner);
                });

                it('returns the amount of tokens owned by the given address', async function () {
                    assert.equal(await this.token.balanceOf(owner), 2);
                    assert.equal(await this.token.balanceOf(newOwner), 3);
                });
        
                it('returns empty collection for original owner', async function () {
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(owner, 2),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(newOwner, 3),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                });

                checkTotalSupply();
            });

            describe('after transferring second tokens to newOwner user', function () {
                before(beforeFunc);
                before(async function () {
                    await this.token.transferFrom(owner, newOwner, secondTokenId, { from: owner });
                });
        
                it('returns correct token IDs for target', async function () {
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 0), firstTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 1), fiftTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(newOwner, 0), secondTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(newOwner, 1), thirdTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(newOwner, 2), foursTokenId);
                });

                it('returns the owner of the given token ID', async function () {
                    assert.equal(await this.token.ownerOf(firstTokenId), owner);
                    assert.equal(await this.token.ownerOf(fiftTokenId), owner);
                    assert.equal(await this.token.ownerOf(thirdTokenId), newOwner);
                    assert.equal(await this.token.ownerOf(foursTokenId), newOwner);
                    assert.equal(await this.token.ownerOf(secondTokenId), newOwner);
                });

                it('returns the amount of tokens owned by the given address', async function () {
                    assert.equal(await this.token.balanceOf(owner), 2);
                    assert.equal(await this.token.balanceOf(newOwner), 3);
                });
        
                it('returns empty collection for original owner', async function () {
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(owner, 2),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(newOwner, 3),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                });

                checkTotalSupply();
            });

            describe('after transferring all tokens to owner user', function () {
                before(beforeFunc);
                before(async function () {
                    await this.token.transferFrom(newOwner, owner, thirdTokenId, { from: newOwner });
                    await this.token.transferFrom(newOwner, owner, foursTokenId, { from: newOwner });
                });
        
                it('returns correct token IDs for target', async function () {
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 0), firstTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 1), secondTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 2), thirdTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 3), foursTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 4), fiftTokenId);
                });

                it('returns the owner of the given token ID', async function () {
                    assert.equal(await this.token.ownerOf(firstTokenId), owner);
                    assert.equal(await this.token.ownerOf(fiftTokenId), owner);
                    assert.equal(await this.token.ownerOf(thirdTokenId), owner);
                    assert.equal(await this.token.ownerOf(foursTokenId), owner);
                    assert.equal(await this.token.ownerOf(secondTokenId), owner);
                });

                it('returns the amount of tokens owned by the given address', async function () {
                    assert.equal(await this.token.balanceOf(owner), 5);
                    assert.equal(await this.token.balanceOf(newOwner), 0);
                });
        
                it('returns empty collection for original owner', async function () {
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(owner, 5),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(newOwner, 1),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                });

                checkTotalSupply();
            });

            describe('after transferring first tokens to other user', function () {
                before(beforeFunc);
                before(async function () {
                    await this.token.transferFrom(owner, other, firstTokenId, { from: owner });
                });
        
                it('returns correct token IDs for target', async function () {
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 0), secondTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 1), fiftTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(newOwner, 0), thirdTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(newOwner, 1), foursTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(other, 0), firstTokenId);
                });

                it('returns the owner of the given token ID', async function () {
                    assert.equal(await this.token.ownerOf(firstTokenId), other);
                    assert.equal(await this.token.ownerOf(fiftTokenId), owner);
                    assert.equal(await this.token.ownerOf(thirdTokenId), newOwner);
                    assert.equal(await this.token.ownerOf(foursTokenId), newOwner);
                    assert.equal(await this.token.ownerOf(secondTokenId), owner);
                });

                it('returns the amount of tokens owned by the given address', async function () {
                    assert.equal(await this.token.balanceOf(owner), 2);
                    assert.equal(await this.token.balanceOf(other), 1);
                    assert.equal(await this.token.balanceOf(newOwner), 2);
                });
        
                it('returns empty collection for original owner', async function () {
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(owner, 2),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(other, 1),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(newOwner, 2),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                });

                checkTotalSupply();
            });

            describe('after swap transferring', function () {
                before(beforeFunc);
                before(async function () {
                    await this.token.transferFrom(owner, newOwner, firstTokenId, { from: owner });
                    await this.token.transferFrom(newOwner, owner, foursTokenId, { from: newOwner });
                });
        
                it('returns correct token IDs for target', async function () {
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 0), secondTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 1), foursTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, 2), fiftTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(newOwner, 0), firstTokenId);
                    assert.equal(await this.token.tokenOfOwnerByIndex(newOwner, 1), thirdTokenId);
                });

                it('returns the owner of the given token ID', async function () {
                    assert.equal(await this.token.ownerOf(firstTokenId), newOwner);
                    assert.equal(await this.token.ownerOf(secondTokenId), owner);
                    assert.equal(await this.token.ownerOf(thirdTokenId), newOwner);
                    assert.equal(await this.token.ownerOf(foursTokenId), owner);
                    assert.equal(await this.token.ownerOf(fiftTokenId), owner);
                });

                it('returns the amount of tokens owned by the given address', async function () {
                    assert.equal(await this.token.balanceOf(owner), 3);
                    assert.equal(await this.token.balanceOf(newOwner), 2);
                });
        
                it('returns empty collection for original owner', async function () {
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(owner, 3),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                    await expectRevert(
                        this.token.tokenOfOwnerByIndex(newOwner, 2),
                        'ERC721Enumerable: owner index out of bounds',
                    );
                });

                checkTotalSupply();
            });
        });
    });
}

module.exports = { testEnumerable };