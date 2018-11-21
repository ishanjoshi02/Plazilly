// DO NOT RUN MIGRATION UNTIL ABSOLUTELY CERTAIN THE CONTRACT WILL WORK.
// THINGS TO TEST :
// RUN AND CHECK ALL THE FUNCTIONALITY OF THE SMART CONTRACTS BY PASSING VARIOUS INPUTS.
// I WOULD SUGGEST AUTOMATED TESTING FOR THIS JOB.

var UserStore = artifacts.require("./UserStore.sol");

module.exports = function(deployer) {
  deployer.deploy(UserStore);
};
