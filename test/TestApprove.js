const toWei = web3.utils.toWei;
const { expectRevert } = require('./exceptions.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function testApprove(instance, owner, newOwner, approved, anotherApproved, operator, other) {
    describe('approve', function () {
        beforeEach(async function () {
            this.token = await instance();
            await this.token.mint(1, { from : owner, value : toWei('0.07')});
        });

        const tokenId = 1;
        const nonExistentTokenId = 10;
        let logs = null;
    
        const itClearsApproval = function () {
            it('clears approval for the token', async function () {
                assert.equal(await this.token.getApproved(tokenId), ZERO_ADDRESS);
            });
        };
    
        const itApproves = function (address) {
            it('sets the approval for the target address', async function () {
                assert.equal(await this.token.getApproved(tokenId), address);
            });
        };
    
        const itEmitsApprovalEvent = function (address) {
            it('emits an approval event', async function () {
                assert.equal(logs[0].event, 'Approval');
                assert.equal(logs[0].args.owner, owner);
                assert.equal(logs[0].args.approved, address);
                assert.equal(logs[0].args.tokenId, tokenId);
            });
        };
    
        context('when clearing approval', function () {
            context('when there was no prior approval', function () {
                beforeEach(async function () {
                    ({ logs } = await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner }));
                });
        
                itClearsApproval();
                itEmitsApprovalEvent(ZERO_ADDRESS);
            });
        
            context('when there was a prior approval', function () {
                beforeEach(async function () {
                    await this.token.approve(approved, tokenId, { from: owner });
                    ({ logs } = await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner }));
                });
        
                itClearsApproval();
                itEmitsApprovalEvent(ZERO_ADDRESS);
            });
        });
    
        context('when approving a non-zero address', function () {
            context('when there was no prior approval', function () {
                beforeEach(async function () {
                    ({ logs } = await this.token.approve(approved, tokenId, { from: owner }));
                });
        
                itApproves(approved);
                itEmitsApprovalEvent(approved);
            });
        
            context('when there was a prior approval to the same address', function () {
                beforeEach(async function () {
                    await this.token.approve(approved, tokenId, { from: owner });
                    ({ logs } = await this.token.approve(approved, tokenId, { from: owner }));
                });
        
                itApproves(approved);
                itEmitsApprovalEvent(approved);
            });
        
            context('when there was a prior approval to a different address', function () {
                beforeEach(async function () {
                    await this.token.approve(anotherApproved, tokenId, { from: owner });
                    ({ logs } = await this.token.approve(anotherApproved, tokenId, { from: owner }));
                });
        
                itApproves(anotherApproved);
                itEmitsApprovalEvent(anotherApproved);
            });
        });
    
        context('when the address that receives the approval is the owner', function () {
            it('reverts', async function () {
                await expectRevert(
                    this.token.approve(owner, tokenId, { from: owner }), 'ERC721: approval to current owner',
                );
            });
        });
    
        context('when the sender does not own the given token ID', function () {
            it('reverts', async function () {
                await expectRevert(
                    this.token.approve(approved, tokenId, { from: other }),
                    'ERC721: approve caller is not owner nor approved'
                );
            });
        });
    
        context('when the sender is approved for the given token ID', function () {
            it('reverts', async function () {
                await this.token.approve(approved, tokenId, { from: owner });
                await expectRevert(
                    this.token.approve(anotherApproved, tokenId, { from: approved }),
                    'ERC721: approve caller is not owner nor approved for all'
                );
            });
        });
    
        context('when the sender is an operator', function () {
            beforeEach(async function () {
                await this.token.setApprovalForAll(operator, true, { from: owner });
                ({ logs } = await this.token.approve(approved, tokenId, { from: operator }));
            });
        
            itApproves(approved);
            itEmitsApprovalEvent(approved);
        });
    
        context('when the given token ID does not exist', function () {
            it('reverts', async function () {
                await expectRevert(
                    this.token.approve(approved, nonExistentTokenId, { from: operator }),
                    'ERC721: owner query for nonexistent token'
                );
            });
        });
    });

    describe('getApproved', async function () {
        before(async function () {
            this.token = await instance();
            await this.token.mint(1, { from : owner, value : toWei('0.07')});
        });

        const firstTokenId = 1;
        const nonExistentTokenId = 10;

        context('when token is not minted', async function () {
            it('reverts', async function () {
                await expectRevert(
                    this.token.getApproved(nonExistentTokenId),
                    'ERC721: approved query for nonexistent token',
                );
            });
        });
  
        context('when token has been minted', async function () {
            it('should return the zero address', async function () {
                assert.equal(await this.token.getApproved(firstTokenId), ZERO_ADDRESS);
            });
        });

        context('when account has been approved', async function () {
            it('returns approved account', async function () {
                await this.token.approve(approved, firstTokenId, { from: owner });
                assert.equal(await this.token.getApproved(firstTokenId), approved);
            });
        });
    });
}

module.exports = { testApprove };