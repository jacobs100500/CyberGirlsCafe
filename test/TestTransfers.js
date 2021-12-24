const toWei = web3.utils.toWei;
const { expectRevert } = require('./exceptions.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function testTransfers(instance, owner, newOwner, approved, anotherApproved, operator, other) {
    describe('transfers', function () {
        const beforeFunc = async function () {
            this.token = await instance();
            await this.token.mint(2, { from : owner, value : toWei('0.14')});
            await this.token.approve(approved, tokenId, { from: owner });
            await this.token.setApprovalForAll(operator, true, { from: owner });
            this.toWhom = other; // default to other for toWhom in context-dependent tests
        };
        const tokenId = 1;
        const nonExistentTokenId = 10;
        let logs = null;
  
        const transferWasSuccessful = function ({ owner, tokenId }) {
            it('transfers the ownership of the given token ID to the given address', async function () {
                assert.equal(await this.token.ownerOf(tokenId), this.toWhom);
            });
    
            it('emits a Transfer event', async function () {
                assert.equal(logs[1].event, 'Transfer');
                assert.equal(logs[1].args.from, owner);
                assert.equal(logs[1].args.to, this.toWhom);
                assert.equal(logs[1].args.tokenId, tokenId);
            });
    
            it('clears the approval for the token ID', async function () {
                assert.equal(await this.token.getApproved(tokenId), ZERO_ADDRESS);
            });
    
            it('emits an Approval event', async function () {
                assert.equal(logs[0].event, 'Approval');
                assert.equal(logs[0].args.owner, owner);
                assert.equal(logs[0].args.approved, ZERO_ADDRESS);
                assert.equal(logs[0].args.tokenId, tokenId);
            });
    
            it('adjusts owners balances', async function () {
                assert.equal(await this.token.balanceOf(owner), 1);
            });
    
            it('adjusts owners tokens by index', async function () {
                assert.equal(await this.token.tokenOfOwnerByIndex(this.toWhom, 0), tokenId);
                assert.notEqual(await this.token.tokenOfOwnerByIndex(owner, 0), tokenId);
            });
        };
  
        const shouldTransferTokensByUsers = function (transferFunction) {
            context('when called by the owner', function () {
                before(beforeFunc);
                before(async function () {
                    ({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: owner }));
                });
                transferWasSuccessful({ owner, tokenId, approved });
            });
    
            context('when called by the approved individual', function () {
                before(beforeFunc);
                before(async function () {
                    ({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: approved }));
                });
                transferWasSuccessful({ owner, tokenId, approved });
            });
    
            context('when called by the operator', function () {
                before(beforeFunc);
                before(async function () {
                    ({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
                });
                transferWasSuccessful({ owner, tokenId, approved });
            });
    
            context('when called by the owner without an approved user', function () {
                before(beforeFunc);
                before(async function () {
                    await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner });
                    ({ logs } = await transferFunction.call(this, owner, this.toWhom, tokenId, { from: operator }));
                });
                transferWasSuccessful({ owner, tokenId, approved: null });
            });
            
            describe('reverts', function () {
                before(beforeFunc);

                context('when sent to himself', function () {
                    it('reverts', async function () {
                        await expectRevert(
                            transferFunction.call(this, owner, owner, tokenId, { from: owner }),
                            'ERC721: transfer to himself',
                        );
                    });
                });

                context('when the address of the previous owner is incorrect', function () {
                    it('reverts', async function () {
                        await expectRevert(
                            transferFunction.call(this, other, other, tokenId, { from: owner }),
                            'ERC721: transfer of token that is not own',
                        );
                    });
                });
        
                context('when the sender is not authorized for the token id', function () {
                    it('reverts', async function () {
                        await expectRevert(
                            transferFunction.call(this, owner, other, tokenId, { from: other }),
                            'ERC721: transfer caller is not owner nor approved',
                        );
                    });
                });
        
                context('when the given token ID does not exist', function () {
                    it('reverts', async function () {
                        await expectRevert(
                            transferFunction.call(this, owner, other, nonExistentTokenId, { from: owner }),
                            'ERC721: operator query for nonexistent token',
                        );
                    });
                });
        
                context('when the address to transfer the token to is the zero address', function () {
                    it('reverts', async function () {
                        await expectRevert(
                            transferFunction.call(this, owner, ZERO_ADDRESS, tokenId, { from: owner }),
                            'ERC721: transfer to the zero address',
                        );
                    });
                });
            });
        };

        describe('via transferFrom', function () {
            shouldTransferTokensByUsers(function (from, to, tokenId, opts) {
                return this.token.transferFrom(from, to, tokenId, opts);
            });
        });
    });
}

module.exports = { testTransfers };