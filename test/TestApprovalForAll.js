const { expectRevert } = require('./exceptions.js');

function testApprovalForAll(instance, owner, newOwner, approved, anotherApproved, operator, other) {
    describe('setApprovalForAll', function () {
        beforeEach(async function () {
            this.token = await instance();
        });

        context('when the operator willing to approve is not the owner', function () {
            context('when there is no operator approval set by the sender', function () {
                it('approves the operator', async function () {
                    await this.token.setApprovalForAll(operator, true, { from: owner });

                    assert.equal(await this.token.isApprovedForAll(owner, operator), true);
                });
    
                it('emits an approval event', async function () {
                    const { logs } = await this.token.setApprovalForAll(operator, true, { from: owner });
                    
                    assert.equal(logs[0].event, 'ApprovalForAll');
                    assert.equal(logs[0].args.owner, owner);
                    assert.equal(logs[0].args.operator, operator);
                    assert.equal(logs[0].args.approved, true);
                });
            });

            context('when the operator was set as not approved', function () {
                beforeEach(async function () {
                    await this.token.setApprovalForAll(operator, false, { from: owner });
                });
    
                it('emits an approval event', async function () {
                    const { logs } = await this.token.setApprovalForAll(operator, true, { from: owner });
        
                    assert.equal(await this.token.isApprovedForAll(owner, operator), true);
                    assert.equal(logs[0].event, 'ApprovalForAll');
                    assert.equal(logs[0].args.owner, owner);
                    assert.equal(logs[0].args.operator, operator);
                    assert.equal(logs[0].args.approved, true);
                });
    
                it('can unset the operator approval', async function () {
                    const { logs } = await this.token.setApprovalForAll(operator, false, { from: owner });
        
                    assert.equal(await this.token.isApprovedForAll(owner, operator), false);
                    assert.equal(logs[0].event, 'ApprovalForAll');
                    assert.equal(logs[0].args.owner, owner);
                    assert.equal(logs[0].args.operator, operator);
                    assert.equal(logs[0].args.approved, false);
                });
            });
  
            context('when the operator was already approved', function () {
                beforeEach(async function () {
                    await this.token.setApprovalForAll(operator, true, { from: owner });
                });
    
                it('emits an approval event', async function () {
                    const { logs } = await this.token.setApprovalForAll(operator, true, { from: owner });

                    assert.equal(await this.token.isApprovedForAll(owner, operator), true);
                    assert.equal(logs[0].event, 'ApprovalForAll');
                    assert.equal(logs[0].args.owner, owner);
                    assert.equal(logs[0].args.operator, operator);
                    assert.equal(logs[0].args.approved, true);
                });
            });
        });
  
        context('when the operator is the owner', function () {
            it('reverts', async function () {
                await expectRevert(
                    this.token.setApprovalForAll(owner, true, { from: owner }),
                    'ERC721: approve to caller'
                );
            });
        });
    });
}

module.exports = { testApprovalForAll };