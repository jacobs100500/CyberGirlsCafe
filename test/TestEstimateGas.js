const toWei = web3.utils.toWei;

function testEstimateGas(instance, owner, newOwner, emptyOwner, approved, operator) {
    describe('estimate gas', function () {
        context('mint', function() {
            before(async () => {
                this.token = await instance();
            });

            it('mint owner one', async() => {
                const { receipt } = await this.token.mint(1, { from : owner, value : toWei('0.07')});
                console.log(receipt.gasUsed); // 154145 - Base OpenZeppelin implementation
            });
            
            it('mint newOwner one', async() => {
                const { receipt } = await this.token.mint(1, { from : newOwner, value : toWei('0.07')});
                console.log(receipt.gasUsed); // 143345
            });
    
            it('mint owner new one', async() => {
                const { receipt } = await this.token.mint(1, { from : owner, value : toWei('0.07')});
                console.log(receipt.gasUsed); // 147545
            });
    
            it('mint owner new 5', async() => {
                const { receipt } = await this.token.mint(5, { from : owner, value : toWei('0.35')});
                console.log(receipt.gasUsed); // 593377
            });

            it('mint emptyOwner new 5', async() => {
                const { receipt } = await this.token.mint(5, { from : emptyOwner, value : toWei('0.35')});
                console.log(receipt.gasUsed); // 589177
            });
        });

        context('approve', function() {
            before(async() => {
                this.token = await instance();
                await this.token.mint(1, { from : owner, value : toWei('0.07')});
                await this.token.mint(1, { from : newOwner, value : toWei('0.07')});
            });

            it('approve true', async() => {
                const { receipt } = await this.token.approve(approved, 1, { from : owner });
                console.log(receipt.gasUsed); // 46928
            });

            it('approve false', async() => {
                const { receipt } = await this.token.approve(approved, 1, { from : owner });
                console.log(receipt.gasUsed); // 27728
            });
            
            it('approve from operator false', async() => {
                await this.token.setApprovalForAll(operator, true, { from : newOwner });
                const { receipt } = await this.token.approve(approved, 2, { from : operator });
                console.log(receipt.gasUsed); // 51151
            });
        });

        context('setApprovalForAll', function() {
            before(async() => {
                this.token = await instance();
            });

            it('setApprovalForAll true', async() => {
                const { receipt } = await this.token.setApprovalForAll(operator, true, { from : emptyOwner });
                console.log(receipt.gasUsed); // 44957
            });

            it('setApprovalForAll false', async() => {
                const { receipt } = await this.token.setApprovalForAll(operator, false, { from : emptyOwner });
                console.log(receipt.gasUsed); // 14973
            });
        });

        context('direct transfers', function() {
            before(async() => {
                this.token = await instance();
                await this.token.mint(3, { from : owner, value : toWei('0.21')});
                await this.token.mint(1, { from : newOwner, value : toWei('0.07')});
            });

            it('transfer from owner to newOwner', async() => {
                const { receipt } = await this.token.transferFrom(owner, newOwner, 1, { from : owner });
                console.log(receipt.gasUsed); // 80455
            });
    
            it('transfer from owner to emptyOwner', async() => {
                const { receipt } = await this.token.transferFrom(owner, emptyOwner, 2, { from : owner });
                console.log(receipt.gasUsed); // 69361
            });
        });

        context('approve transfers', function() {
            before(async() => {
                this.token = await instance();
                await this.token.mint(3, { from : owner, value : toWei('0.21')});
                await this.token.mint(1, { from : newOwner, value : toWei('0.07')});
                await this.token.approve(approved, 1, { from : owner });
                await this.token.approve(approved, 2, { from : owner });
            });

            it('transfer from approved to newOwner', async() => {
                const { receipt } = await this.token.transferFrom(owner, newOwner, 1, { from : approved });
                console.log(receipt.gasUsed); // 71519
            });
    
            it('transfer from approved to emptyOwner', async() => {
                const { receipt } = await this.token.transferFrom(owner, emptyOwner, 2, { from : approved });
                console.log(receipt.gasUsed); // 60425
            });
        });

        context('operator transfers', function() {
            before(async() => {
                this.token = await instance();
                await this.token.mint(3, { from : owner, value : toWei('0.21')});
                await this.token.mint(1, { from : newOwner, value : toWei('0.07')});
                await this.token.setApprovalForAll(operator, true, { from : owner });
            });

            it('transfer from approved operator to newOwner', async() => {
                const { receipt } = await this.token.transferFrom(owner, newOwner, 1, { from : operator });
                console.log(receipt.gasUsed); // 86543
            });
    
            it('transfer from approved operator to emptyOwner', async() => {
                const { receipt } = await this.token.transferFrom(owner, emptyOwner, 2, { from : operator });
                console.log(receipt.gasUsed); // 75449
            });
        });

        context('giveaway mint', function() {
            before(async() => {
                this.token = await instance();
            });

            it('mint one', async() => {
                const { receipt } = await this.token.mintGiveaway(newOwner, 1, { from : owner });
                console.log(receipt.gasUsed); // 153734
            });

            it('mint two', async() => {
                const { receipt } = await this.token.mintGiveaway(emptyOwner, 2, { from : owner });
                console.log(receipt.gasUsed); // 253475
            });
        });

        context('presale mint', function() {
            before(async() => {
                this.token = await instance();
                await this.token.setMintState(1, { from : owner });
                await this.token.addToWhiteList([newOwner, emptyOwner], { from : owner });
            });

            it('mint newOwner one', async() => {
                const { receipt } = await this.token.presaleMint(1, { from : newOwner, value : toWei('0.07')});
                console.log(receipt.gasUsed); // 158373
            });

            it('mint newOwner two', async() => {
                const { receipt } = await this.token.presaleMint(2, { from : newOwner, value : toWei('0.1')});
                console.log(receipt.gasUsed); // 247313
            });

            it('mint emptyOwner three', async() => {
                const { receipt } = await this.token.presaleMint(3, { from : emptyOwner, value : toWei('0.2')});
                console.log(receipt.gasUsed); // 353653
            });
        });
    });
};

module.exports = { testEstimateGas };