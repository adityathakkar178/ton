import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Transfer } from '../wrappers/Transfer';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Transfer', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Transfer');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let transfer: SandboxContract<Transfer>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        transfer = blockchain.openContract(Transfer.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await transfer.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: transfer.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and transfer are ready to use
    });
});
