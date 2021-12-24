const toWei = web3.utils.toWei;
const { expectRevert } = require('./exceptions.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function testWithdraw(instance, owner, newOwner) {
    describe('withdraw', function () {
        before(async () => {
            this.token = await instance();
        });

        it("withdrawAll not owner", async () => {
            await expectRevert(
                this.token.withdrawAll({ from : newOwner }),
                'Ownable: caller is not the owner'
            );
        });

        it("withdrawTo not owner", async () => {
            await expectRevert(
                this.token.withdrawTo(newOwner, toWei('1'), { from : newOwner }),
                'Ownable: caller is not the owner'
            );
        });

        it("withdrawAll zero balance", async () => {
            assert.equal(await web3.eth.getBalance(this.token.address), 0);
            
            await expectRevert(
                this.token.withdrawAll({ from : owner}),
                'Balance must be positive',
            );
        });

        it("withdraw to zero address", async () => {
            await expectRevert(
                this.token.withdrawTo(ZERO_ADDRESS, toWei('1'), { from : owner}),
                'Transfer to the zero address',
            );
        });

        it("withdrawTo zero balance", async () => {
            await expectRevert(
                this.token.withdrawTo(newOwner, toWei('1'), { from : owner}),
                'Amount is greater than balance',
            );
        });

        it("withdrawAll", async () => {
            await this.token.mint(1, { from : owner, value : toWei('7')});
            const prefBalance = await web3.eth.getBalance(owner);

            assert.equal(await web3.eth.getBalance(this.token.address), toWei('7'));

            await this.token.withdrawAll({ from : owner });

            assert.equal(await web3.eth.getBalance(this.token.address), 0);
            assert.notEqual(await web3.eth.getBalance(owner), prefBalance);
        });

        it("withdrawTo", async () => {
            await this.token.mint(1, { from : owner, value : toWei('7')});
            const prefBalance = await web3.eth.getBalance(newOwner);

            assert.equal(await web3.eth.getBalance(this.token.address), toWei('7'));

            await this.token.withdrawTo(newOwner, toWei('7'), { from : owner });

            assert.equal(await web3.eth.getBalance(this.token.address), 0);
            assert.notEqual(await web3.eth.getBalance(newOwner), prefBalance);
        });
    });
}

module.exports = { testWithdraw };