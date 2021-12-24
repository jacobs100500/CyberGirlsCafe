async function expectRevert(promise, expectedError) {
    try {
      await promise;
    } catch (error) {
      if (error.message.indexOf(expectedError) === -1) {
        // When the exception was a revert, the resulting string will include only
        // the revert reason, otherwise it will be the type of exception (e.g. 'invalid opcode')
        const actualError = error.message.replace(
          /Returned error: VM Exception while processing transaction: (revert )?/,
          '',
        );
        
        assert.equal(actualError, expectedError, 'Wrong kind of exception received');
      }
      return;
    }
  
    expect.fail('Expected an exception but none was received');
}

module.exports = { expectRevert };