const toWei = web3.utils.toWei;
const { expectRevert } = require('./exceptions.js');
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function testMint(instance, owner, newOwner) {
    describe('mint', function () {
        describe('user mint', function () {
            before(async () => {
                this.token = await instance();
            });

            it("check mint params", async () => {
                assert.equal(await this.token.TOKEN_PRICE(), toWei('0.07'), "Token price is not equal");
                assert.equal(await this.token.TOTAL_TOKENS(), 30, "Total tokens is not equal");
                assert.equal(await this.token.MAX_TOKENS_PER_TXN(), 20, "Max tokens per transaction is not equal");
                assert.equal(await this.token.totalSupply(), 0, "Total supply is not equal");
            });

            it("whitelist mint disabled", async () => {
                await expectRevert(
                    this.token.presaleMint(1, { from : newOwner, value : toWei('0.045') }),
                    "Whitelist mint is not allowed",
                );
            });
    
            it("single mint to owner", async () => {
                const { logs } = await this.token.mint(1, { from : owner, value : toWei('0.07')});
                
                assert.equal(await this.token.totalSupply(), 1, "Total supply is not equal");
                assert.equal(await this.token.balanceOf(owner), 1, "Balance is not equal");
                assert.equal(await this.token.ownerOf(1), owner, "Owner is not equal");
                assert.equal(await this.token.tokenByIndex(0), 1);
                assert.equal(await this.token.tokenOfOwnerByIndex(owner, 0), 1);
                assert.equal(logs[0].event, 'Transfer');
                assert.equal(logs[0].args.from, ZERO_ADDRESS);
                assert.equal(logs[0].args.to, owner);
                assert.equal(logs[0].args.tokenId, 1);
            });
    
            it("single mint to newOwner", async () => {
                const { logs } = await this.token.mint(1, { from : newOwner, value : toWei('0.07')});
                
                assert.equal(await this.token.totalSupply(), 2, "Total supply is not equal");
                assert.equal(await this.token.balanceOf(newOwner), 1, "Balance is not equal");
                assert.equal(await this.token.ownerOf(2), newOwner, "Owner is not equal");
                assert.equal(await this.token.tokenByIndex(1), 2);
                assert.equal(await this.token.tokenOfOwnerByIndex(newOwner, 0), 2);
                assert.equal(logs[0].event, 'Transfer');
                assert.equal(logs[0].args.from, ZERO_ADDRESS);
                assert.equal(logs[0].args.to, newOwner);
                assert.equal(logs[0].args.tokenId, 2);
            });
    
            it("multi mint to owner", async () => {
                const count = 18;
                const startTokenId = 3;
                const { logs } = await this.token.mint(count, { from : owner, value : toWei('1.33')});
                
                assert.equal(await this.token.totalSupply(), 20, "Total supply is not equal");
                assert.equal(await this.token.balanceOf(owner), count + 1, "Balance is not equal");
                assert.equal(await this.token.ownerOf(1), owner, "Owner is not equal");
                assert.equal(await this.token.tokenByIndex(0), 1);
                assert.equal(await this.token.tokenOfOwnerByIndex(owner, 0), 1);
    
                for(var i = 0; i < count; i++)
                {
                    assert.equal(await this.token.ownerOf(startTokenId + i), owner, "Owner is not equal");
                    assert.equal(await this.token.tokenByIndex(i + 2), startTokenId + i);
                    assert.equal(await this.token.tokenOfOwnerByIndex(owner, i + 1), startTokenId + i);
                    assert.equal(logs[i].event, 'Transfer');
                    assert.equal(logs[i].args.from, ZERO_ADDRESS);
                    assert.equal(logs[i].args.to, owner);
                    assert.equal(logs[i].args.tokenId, startTokenId + i);
                }
            });
    
            it("not enought ether", async () => {
                await expectRevert(
                    this.token.mint(1, { from : owner, value : toWei('0.05')}),
                    'Ether value sent is not correct',
                );
            });
    
            it("invalid count (0)", async () => {
                await expectRevert(
                    this.token.mint(0, { from : owner, value : toWei('0.07')}),
                    'Count should be from 1 to 20',
                );
            });
    
            it("invalid count (100)", async () => {
                await expectRevert(
                    this.token.mint(100, { from : owner, value : toWei('7')}),
                    'Count should be from 1 to 20',
                );
            });
    
            it("try mint more than max tokens", async () => {
                await expectRevert(
                    this.token.mint(15, { from : owner, value : toWei('1.05')}),
                    'Purchase would exceed max supply of tokens',
                );
            });
    
            it("mint to sold out", async () => {
                await this.token.mint(10, { from : owner, value : toWei('0.7')});
                
                assert.equal(await this.token.totalSupply(), 30, "Total supply is not equal");
            });
    
            it("try mint when it sold out", async () => {
                await expectRevert(
                    this.token.mint(1, { from : owner, value : toWei('0.07')}),
                    'Sold out',
                );
            });
        });
        
        describe('giveaway mint', function () {
            before(async () => {
                this.token = await instance();
            });

            it("mintGiveaway not owner", async () => {
                await expectRevert(
                    this.token.mintGiveaway(newOwner, 1, { from : newOwner }),
                    'Ownable: caller is not the owner'
                );
            });
    
            it("mint giveaway to zero address", async () => {
                await expectRevert(
                    this.token.mintGiveaway(ZERO_ADDRESS, 1, { from : owner }),
                    'Transfer to the zero address',
                );
            });
    
            it("mint giveaway", async () => {
                await this.token.mintGiveaway(newOwner, 1, { from : owner });
    
                assert.equal(await this.token.balanceOf(newOwner), 1, "Balance is not equal");
            });
        });

        describe('unique giveaway mint', function () {
            before(async () => {
                this.token = await instance();
            });

            it("check mint params", async () => {
                assert.equal(await this.token.TOTAL_TOKENS(), 30, "Total tokens is not equal");
                assert.equal(await this.token.UNIQUE_TOKENS(), 10, "Unique tokens is not equal");
                assert.equal(await this.token.MAX_TOKENS_PER_TXN(), 20, "Max tokens per transaction is not equal");
                assert.equal(await this.token.totalSupply(), 0, "Total supply is not equal");
            });

            it("mintGiveaway to sold out", async () => {
                await this.token.mintGiveaway(owner, 20, { from : owner });
                await this.token.mintGiveaway(owner, 10, { from : owner });
                assert.equal(await this.token.totalSupply(), 30, "Total supply is not equal");
            });
    
            it("try mint when it sold out", async () => {
                await expectRevert(
                    this.token.mint(1, { from : newOwner, value : toWei('0.07')}),
                    'Sold out',
                );
            });

            it("mintGiveaway not owner", async () => {
                await expectRevert(
                    this.token.mintGiveaway(newOwner, 1, { from : newOwner }),
                    'Ownable: caller is not the owner'
                );
            });
    
            it("unique mint giveaway", async () => {
                await this.token.mintGiveaway(newOwner, 1, { from : owner });
    
                assert.equal(await this.token.totalSupply(), 31, "Total supply is not equal");
                assert.equal(await this.token.balanceOf(newOwner), 1, "Balance is not equal");
            });

            it("unique mint giveaway all", async () => {
                await this.token.mintGiveaway(newOwner, 9, { from : owner });
    
                assert.equal(await this.token.totalSupply(), 40, "Total supply is not equal");
                assert.equal(await this.token.balanceOf(newOwner), 10, "Balance is not equal");
            });

            it("try mint when all unique is sold out", async () => {
                await expectRevert(
                    this.token.mintGiveaway(newOwner, 1, { from : owner }),
                    'Sold out',
                );
            });
        });
    });
}

module.exports = { testMint };