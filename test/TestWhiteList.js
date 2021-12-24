const toWei = web3.utils.toWei;
const { expectRevert } = require('./exceptions.js');

function testWhitelist(instance, owner, newOwner, newOwner1, newOwner2, other) {
    const whitelistUsers = [
        newOwner,
        newOwner1,
        newOwner2
    ];

    describe('change mint state', function () {
        before(async () => {
            this.token = await instance();
            await this.token.setMintState(false, true, { from : owner });
        });

        it("public mint disabled", async () => {
            await expectRevert(
                this.token.mint(1, { from : newOwner, value : toWei('0.07') }),
                "Public mint is not allowed",
            );
        });
        
        it("allow change mint state from owner", async () => {
            await expectRevert(
                this.token.setMintState(true, false, { from : newOwner }),
                "Ownable: caller is not the owner",
            );
        });

        it("check enable public mint", async () => {
            await this.token.setMintState(true, false, { from : owner });
            await expectRevert(
                this.token.presaleMint(1, { from : newOwner2, value : toWei('0.045')}),
                "Whitelist mint is not allowed",
            );
            await this.token.mint(1, { from : newOwner2, value : toWei('0.07')});
            assert.equal(await this.token.balanceOf(newOwner2), 1);
        });

        it("check disable all mint", async () => {
            await this.token.setMintState(false, false, { from : owner });
            await expectRevert(
                this.token.presaleMint(1, { from : newOwner2, value : toWei('0.045')}),
                "Whitelist mint is not allowed",
            );
            await expectRevert(
                this.token.mint(1, { from : newOwner2, value : toWei('0.07')}),
                "Public mint is not allowed",
            );
        });

        it("check enable all mint", async () => {
            await this.token.setMintState(true, true, { from : owner });
            await this.token.addToWhiteList(whitelistUsers, { from : owner }),
            await this.token.presaleMint(1, { from : newOwner2, value : toWei('0.045')})
            assert.equal(await this.token.balanceOf(newOwner2), 2);

            await this.token.mint(1, { from : newOwner2, value : toWei('0.07')})
            assert.equal(await this.token.balanceOf(newOwner2), 3);
        });
    });

    describe('whitelist', function () {
        before(async () => {
            this.token = await instance();
            await this.token.setMintState(false, true, { from : owner });
        });

        it("check mint params", async () => {
            assert.equal(await this.token.WL_TOKEN_PRICE(), toWei('0.045'), "Token price is not equal");
            assert.equal(await this.token.TOTAL_TOKENS(), 30, "Total tokens is not equal");
            assert.equal(await this.token.MAX_TOKENS_PER_WL(), 4, "Max tokens per transaction is not equal");
            assert.equal(await this.token.totalSupply(), 0, "Total supply is not equal");
        });

        it("allow add to whitelist from owner", async () => {
            await expectRevert(
                this.token.addToWhiteList(whitelistUsers, { from : newOwner }),
                "Ownable: caller is not the owner",
            );
        });

        it("allow remove from whitelist from owner", async () => {
            await expectRevert(
                this.token.removeFromWhiteList([newOwner1], { from : newOwner }),
                "Ownable: caller is not the owner",
            );
        });

        it("add to whitelist", async () => {
            await this.token.addToWhiteList(whitelistUsers, { from : owner });

            assert.equal(await this.token.whiteList(newOwner), 4);
            assert.equal(await this.token.whiteList(newOwner1), 4);
            assert.equal(await this.token.whiteList(newOwner2), 4);
            assert.equal(await this.token.whiteList(other), 0);
        });

        it("remove from whitelist", async () => {
            await this.token.removeFromWhiteList([newOwner1], { from : owner });

            assert.equal(await this.token.whiteList(newOwner), 4);
            assert.equal(await this.token.whiteList(newOwner1), 0);
            assert.equal(await this.token.whiteList(newOwner2), 4);
            assert.equal(await this.token.whiteList(other), 0);
        });

        it("normal mint from newOwner", async () => {
            await this.token.presaleMint(1, { from : newOwner, value : toWei('0.045') });

            assert.equal(await this.token.balanceOf(newOwner), 1);
            assert.equal(await this.token.whiteList(newOwner), 3);
        });

        it("try not in whitelist mint", async () => {
            await expectRevert(
                this.token.presaleMint(1, { from : other, value : toWei('0.045') }),
                'You are not in whitelist',
            );
        });

        it("try removed from whitelist mint", async () => {
            await expectRevert(
                this.token.presaleMint(1, { from : other, value : toWei('0.045') }),
                'You are not in whitelist',
            );
        });

        it("invalid count (0)", async () => {
            await expectRevert(
                this.token.presaleMint(0, { from : newOwner1, value : toWei('0.045')}),
                'Count should be from 1 to 4',
            );
        });

        it("invalid count (4)", async () => {
            await expectRevert(
                this.token.presaleMint(5, { from : newOwner1, value : toWei('0.225')}),
                'Count should be from 1 to 4',
            );
        });

        it("not enought ether", async () => {
            await expectRevert(
                this.token.presaleMint(1, { from : newOwner, value : toWei('0.01')}),
                'Ether value sent is not correct',
            );
        });

        it("try mint more than max allowed from newOwner", async () => {
            await expectRevert(
                this.token.presaleMint(4, { from : newOwner, value : toWei('0.135')}),
                'Purchase would exceeds max allowed',
            );
        });

        it("mint max allowed from newOwner", async () => {
            await this.token.presaleMint(3, { from : newOwner, value : toWei('0.135')});

            assert.equal(await this.token.balanceOf(newOwner), 4);
            assert.equal(await this.token.whiteList(newOwner), 0);
        });

        it("try mint after max allowed from newOwner", async () => {
            await expectRevert(
                this.token.presaleMint(1, { from : newOwner, value : toWei('0.045')}),
                'You are not in whitelist',
            );
        });

        it("mint max allowed from newOwner2", async () => {
            await this.token.presaleMint(4, { from : newOwner2, value : toWei('0.225')});

            assert.equal(await this.token.balanceOf(newOwner2), 4);
            assert.equal(await this.token.whiteList(newOwner2), 0);
        });

        it("try mint after max allowed from newOwner2", async () => {
            await expectRevert(
                this.token.presaleMint(1, { from : newOwner2, value : toWei('0.045')}),
                'You are not in whitelist',
            );
        });
    });
}

module.exports = { testWhitelist };