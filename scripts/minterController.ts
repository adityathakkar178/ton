import { Address, beginCell, Cell, fromNano, OpenedContract, toNano } from '@ton/core';
import { compile, sleep, NetworkProvider, UIProvider } from '@ton/blueprint';
import { Transfer } from '../wrappers/Transfer';
import { promptBool, promptAmount, promptAddress, displayContentCell, waitForTransaction } from '../wrappers/ui-utils';
import { TonClient } from '@ton/ton';
const tonClientParam = {
    /**
     * API Endpoint
     */
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
};
const tonClient = new TonClient(tonClientParam);
console.log("🚀 ~ tonClient:", tonClient)
let minterContract: OpenedContract<Transfer>;

const adminActions = ['Mint', 'Change admin', 'Transfer'];
const userActions = ['Info', 'Quit'];

const failedTransMessage = (ui: UIProvider) => {
    ui.write('Failed to get indication of transaction completion from API!\nCheck result manually, or try again\n');
};

const infoAction = async (provider: NetworkProvider, ui: UIProvider) => {
    const jettonData = await minterContract.getJettonData();
    ui.write('Jetton info:\n\n');
    ui.write(`Admin:${jettonData.adminAddress}\n`);
    ui.write(`Total supply:${fromNano(jettonData.totalSupply)}\n`);
    ui.write(`Mintable:${jettonData.mintable}\n`);
    const displayContent = await ui.choose('Display content?', ['Yes', 'No'], (c) => c);
    if (displayContent == 'Yes') {
        displayContentCell(jettonData.content, ui);
    }
};
const changeAdminAction = async (provider: NetworkProvider, ui: UIProvider) => {
    let retry: boolean;
    let newAdmin: Address;
    let curAdmin = await minterContract.getAdminAddress();
    do {
        retry = false;
        newAdmin = await promptAddress('Please specify new admin address:', ui);
        if (newAdmin.equals(curAdmin)) {
            retry = true;
            ui.write('Address specified matched current admin address!\nPlease pick another one.\n');
        } else {
            ui.write(`New admin address is going to be:${newAdmin}\nKindly double check it!\n`);
            retry = !(await promptBool('Is it ok?(yes/no)', ['yes', 'no'], ui));
        }
    } while (retry);

    await tonClient.getContractState(minterContract.address);
    // const curState = await provider.api().getContractState(minterContract.address);
    // if (curState.lastTransaction === null) throw "Last transaction can't be null on deployed contract";

    // await minterContract.sendChangeAdmin(provider.sender(), newAdmin);
    // const transDone = await waitForTransaction(provider, minterContract.address, curState.lastTransaction.lt, 10);
    // if (transDone) {
    //     const adminAfter = await minterContract.getAdminAddress();
    //     if (adminAfter.equals(newAdmin)) {
    //         ui.write('Admin changed successfully');
    //     } else {
    //         ui.write("Admin address hasn't changed!\nSomething went wrong!\n");
    //     }
    // } else {
    // }
};

const mintAction = async (provider: NetworkProvider, ui: UIProvider) => {
    const sender = provider.sender();
    let retry: boolean;
    let mintAddress: Address;
    let mintAmount: string;
    let forwardAmount: string;

    do {
        retry = false;
        const fallbackAddr = sender.address ?? (await minterContract.getAdminAddress());
        mintAddress = await promptAddress(`Please specify address to mint to`, ui, fallbackAddr);
        mintAmount = await promptAmount('Please provide mint amount in decimal form:', ui);
        ui.write(`Mint ${mintAmount} tokens to ${mintAddress}\n`);
        retry = !(await promptBool('Is it ok?(yes/no)', ['yes', 'no'], ui));
    } while (retry);

    ui.write(`Minting ${mintAmount} to ${mintAddress}\n`);
    const supplyBefore = await minterContract.getTotalSupply();
    const nanoMint = toNano(mintAmount);
    await tonClient.getContractState(minterContract.address);

    // const curState = await provider.api().getContractState(minterContract.address);

    // if (curState.lastTransaction === null) throw "Last transaction can't be null on deployed contract";

    // const res = await minterContract.sendMint(sender, mintAddress, nanoMint, toNano('0.05'), toNano('0.1'));
    // const gotTrans = await waitForTransaction(provider, minterContract.address, curState.lastTransaction.lt, 10);
    // if (gotTrans) {
    //     const supplyAfter = await minterContract.getTotalSupply();

    //     if (supplyAfter == supplyBefore + nanoMint) {
    //         ui.write('Mint successfull!\nCurrent supply:' + fromNano(supplyAfter));
    //     } else {
    //         ui.write('Mint failed!');
    //     }
    // } else {
    //     failedTransMessage(ui);
    // }
};

const transferAction = async (provider: NetworkProvider, ui: UIProvider) => {
    const sender = provider.sender();
    let retry: boolean;
    let transferAddress: Address;
    let transferAmount: string;

    do {
        retry = false;
        transferAddress = await promptAddress('Please specify address to transfer to:', ui);
        transferAmount = await promptAmount('Please provide transfer amount in decimal form:', ui);
        ui.write(`Transfer ${transferAmount} tokens to ${transferAddress}\n`);
        retry = !(await promptBool('Is it ok?(yes/no)', ['yes', 'no'], ui));
    } while (retry);

    ui.write(`Transferring ${transferAmount} tokens to ${transferAddress}\n`);
    const nanoTransfer = toNano(transferAmount);

    await tonClient.getContractState(minterContract.address);

    // const curState = await provider.api().getContractState(minterContract.address);

    // if (curState.lastTransaction === null) throw "Last transaction can't be null on deployed contract";

    // // Set the appropriate forward TON amount and total TON amount
    // const forwardTonAmount = toNano('0.05'); // Adjust this as per your needs
    // const totalTonAmount = toNano('0.1'); // This includes the forward TON amount and other transaction fees

    // const res = await minterContract.sendTransfer(
    //     sender,
    //     transferAddress,
    //     nanoTransfer,
    //     forwardTonAmount,
    //     totalTonAmount,
    // );

    // const gotTrans = await waitForTransaction(provider, minterContract.address, curState.lastTransaction.lt, 10);
    // if (gotTrans) {
    //     ui.write('Transfer successful!');
    // } else {
    //     failedTransMessage(ui);
    // }
};

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const sender = provider.sender();
    const hasSender = sender.address !== undefined;
    const api = provider.api();
    const minterCode = await compile('Transfer');
    let done = false;
    let retry: boolean;
    let minterAddress: Address;

    do {
        retry = false;
        minterAddress = await promptAddress('Please enter minter address:', ui);
        await tonClient.getContractState(minterContract.address);

        // const contractState = await api.getContractState(minterAddress);
        // if (contractState.state !== 'active' || contractState.code == null) {
        //     retry = true;
        //     ui.write('This contract is not active!\nPlease use another address, or deploy it firs');
        // } else {
        //     const stateCode = Cell.fromBoc(contractState.code)[0];
        //     if (!stateCode.equals(minterCode)) {
        //         ui.write('Contract code differs from the current contract version!\n');
        //         const resp = await ui.choose('Use address anyway', ['Yes', 'No'], (c) => c);
        //         retry = resp == 'No';
        //     }
        // }
    } while (retry);

    minterContract = provider.open(Transfer.createFromAddress(minterAddress));
    const isAdmin = hasSender ? (await minterContract.getAdminAddress()).equals(sender.address) : true;
    let actionList: string[];
    if (isAdmin) {
        actionList = [...adminActions, ...userActions];
        ui.write('Current wallet is minter admin!\n');
    } else {
        actionList = userActions;
        ui.write('Current wallet is not admin!\nAvaliable actions restricted\n');
    }

    do {
        const action = await ui.choose('Pick action:', actionList, (c) => c);
        switch (action) {
            case 'Mint':
                await mintAction(provider, ui);
                break;
            case 'Change admin':
                await changeAdminAction(provider, ui);
                break;
            case 'Transfer':
                await transferAction(provider, ui);
                break;
            case 'Info':
                await infoAction(provider, ui);
                break;
            case 'Quit':
                done = true;
                break;
        }
    } while (!done);
}
