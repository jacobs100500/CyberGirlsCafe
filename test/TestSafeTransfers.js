const toWei = web3.utils.toWei;
const { expectRevert } = require('./exceptions.js');
const ERC721ReceiverMock = artifacts.require('ERC721ReceiverMock');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const RECEIVER_MAGIC_VALUE = '0x150b7a02';
const Error = [ 'None', 'RevertWithMessage', 'RevertWithoutMessage', 'Panic' ]
    .reduce((acc, entry, idx) => Object.assign({ [entry]: idx }, acc), {});

function testSafeTransfers(instance, owner, newOwner, approved, anotherApproved, operator, other) {
    describe('safe transfers', function () {
        const beforeFunc = async function () {
            this.token = await instance();
            await this.token.mint(2, { from : owner, value : toWei('0.14')});
            await this.token.approve(approved, tokenId, { from: owner });
            await this.token.setApprovalForAll(operator, true, { from: owner });
        };
        const tokenId = 1;
        const nonExistentTokenId = 10;
        const data = '0x42';
        let receiverAddress;
        let logs = null;

        const transferWasSuccessful = function ({ owner, tokenId }) {
            it('transfers the ownership of the given token ID to the given address', async function () {
                assert.equal(await this.token.ownerOf(tokenId), receiverAddress);
            });
    
            it('emits a Transfer event', async function () {
                assert.equal(logs[1].event, 'Transfer');
                assert.equal(logs[1].args.from, owner);
                assert.equal(logs[1].args.to, receiverAddress);
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
                assert.equal(await this.token.tokenOfOwnerByIndex(receiverAddress, 0), tokenId);
                assert.notEqual(await this.token.tokenOfOwnerByIndex(owner, 0), tokenId);
            });
        };
  
        const shouldTransferTokensByUsers = function (transferFunction) {
            context('when called by the owner', function () {
                before(beforeFunc);
                before(async function () {
                    ({ logs } = await transferFunction.call(this, owner, receiverAddress, tokenId, { from: owner }));
                });
                transferWasSuccessful({ owner, tokenId, approved });
            });
    
            context('when called by the approved individual', function () {
                before(beforeFunc);
                before(async function () {
                    ({ logs } = await transferFunction.call(this, owner, receiverAddress, tokenId, { from: approved }));
                });
                transferWasSuccessful({ owner, tokenId, approved });
            });
    
            context('when called by the operator', function () {
                before(beforeFunc);
                before(async function () {
                    ({ logs } = await transferFunction.call(this, owner, receiverAddress, tokenId, { from: operator }));
                });
                transferWasSuccessful({ owner, tokenId, approved });
            });
    
            context('when called by the owner without an approved user', function () {
                before(beforeFunc);
                before(async function () {
                    await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner });
                    ({ logs } = await transferFunction.call(this, owner, receiverAddress, tokenId, { from: operator }));
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

        describe('via safeTransferFrom', function () {
            const safeTransferFromWithData = function (from, to, tokenId, opts) {
                return this.token.methods['safeTransferFrom(address,address,uint256,bytes)'](from, to, tokenId, data, opts);
            };
    
            const safeTransferFromWithoutData = function (from, to, tokenId, opts) {
                return this.token.methods['safeTransferFrom(address,address,uint256)'](from, to, tokenId, opts);
            };
    
            const shouldTransferSafely = function (transferFun, data) {
                describe('to a user account', function () {
                    receiverAddress = other;
                    shouldTransferTokensByUsers(transferFun);
                });
    
                describe('to a valid receiver contract', function () {
                    before(beforeFunc);
                    before(async function () {
                        this.receiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.None);
                        receiverAddress = this.receiver.address;
                    });
                    
                    shouldTransferTokensByUsers(transferFun);
                });

                describe('onERC721Received', function () {
                    beforeEach(beforeFunc);
                    beforeEach(async function () {
                        this.receiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.None);
                        receiverAddress = this.receiver.address;
                    });

                    it('calls onERC721Received', async function () {
                        const receipt = await transferFun.call(this, owner, this.receiver.address, tokenId, { from: owner });
                        
                        assert.equal(receipt.receipt.rawLogs.length, 3);
                    });
        
                    it('calls onERC721Received from approved', async function () {
                        const receipt = await transferFun.call(this, owner, this.receiver.address, tokenId, { from: approved });
        
                        assert.equal(receipt.receipt.rawLogs.length, 3);
                    });
        
                    describe('with an invalid token id', function () {
                        it('reverts', async function () {
                            await expectRevert(
                                transferFun.call(this, owner, this.receiver.address, nonExistentTokenId, { from: owner }),
                                'ERC721: operator query for nonexistent token',
                            );
                        });
                    });
                });
            };
  
            describe('with data', function () {
                shouldTransferSafely(safeTransferFromWithData, data);
            });
  
            describe('without data', function () {
                shouldTransferSafely(safeTransferFromWithoutData, null);
            });
          
            describe('reverts', function () {
                before(beforeFunc);

                describe('to a receiver contract returning unexpected value', function () {
                    it('reverts', async function () {
                        const invalidReceiver = await ERC721ReceiverMock.new('0x42', Error.None);
                        await expectRevert(
                            this.token.safeTransferFrom(owner, invalidReceiver.address, tokenId, { from: owner }),
                            'ERC721: transfer to non ERC721Receiver implementer',
                        );
                    });
                });
        
                describe('to a receiver contract that reverts with message', function () {
                    it('reverts', async function () {
                        const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.RevertWithMessage);
                        await expectRevert(
                            this.token.safeTransferFrom(owner, revertingReceiver.address, tokenId, { from: owner }),
                            'ERC721ReceiverMock: reverting',
                        );
                    });
                });
        
                describe('to a receiver contract that reverts without message', function () {
                    it('reverts', async function () {
                        const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.RevertWithoutMessage);
                        await expectRevert(
                            this.token.safeTransferFrom(owner, revertingReceiver.address, tokenId, { from: owner }),
                            'ERC721: transfer to non ERC721Receiver implementer',
                        );
                    });
                });
        
                describe('to a receiver contract that panics', function () {
                    it('reverts', async function () {
                        const revertingReceiver = await ERC721ReceiverMock.new(RECEIVER_MAGIC_VALUE, Error.Panic);
                        await expectRevert(
                            this.token.safeTransferFrom(owner, revertingReceiver.address, tokenId, { from: owner }),
                            ""
                        );
                    });
                });
        
                describe('to a contract that does not implement the required function', function () {
                    it('reverts', async function () {
                        const nonReceiver = this.token;
                        await expectRevert(
                            this.token.safeTransferFrom(owner, nonReceiver.address, tokenId, { from: owner }),
                            'ERC721: transfer to non ERC721Receiver implementer',
                        );
                    });
                });
            });
        });
    });
}

module.exports = { testSafeTransfers };