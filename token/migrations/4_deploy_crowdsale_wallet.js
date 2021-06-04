const CrowdsaleWallet = artifacts.require("CrowdsaleWallet");

module.exports = async function(deployer, network, accounts){
    /*
    * This sets up the accounts for splitting the crowdsale ether into various
    * pre-determined locations.
    *
    * The accounts and values below will vary for the live deployment.
    * For simplicity and testing, only 2 accounts are used here.
    */
    wallet_address1 = accounts[5];
    share_1 = 50; // 50% of the total ETH received from crowdsale.

    wallet_address2 = accounts[6];
    share_2 = 50;

    wallet_array = [wallet_address1, wallet_address2];
    shares_array = [share_1, share_2];

    //deploy the wallet, setup accounts/shares.
    await deployer.deploy(CrowdsaleWallet, wallet_array, shares_array);

    //get deployed instance of the wallet
    const crowdsaleWallet = await CrowdsaleWallet.deployed();
    console.log("Crowdsale Wallet Address: " + crowdsaleWallet.address);
}
