import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Multisig } from '../target/types/multisig';
import { expect } from 'chai'

import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

describe('multisig', () => {
  
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Multisig as Program<Multisig>;
  const provider = anchor.getProvider();

  const multisig = anchor.web3.Keypair.generate();

  const ownerA = anchor.web3.Keypair.generate();
  const ownerB = anchor.web3.Keypair.generate();
  const ownerC = anchor.web3.Keypair.generate();
  const ownerD = anchor.web3.Keypair.generate();
  const owners = [ownerA.publicKey, ownerB.publicKey, ownerC.publicKey];

  it('Should create multisig 2 out of 3', async () => {
    await program.methods
      .createMultisig(owners, new anchor.BN(2))
      .accounts({multisig: multisig.publicKey})
      .signers([multisig])
      .rpc();

    const multisigAccount = await program.account.multisig.fetch(multisig.publicKey);
    expect(multisigAccount.threshold.toNumber()).to.be.equal(2);
    expect(multisigAccount.owners).to.be.deep.equal(owners);
  });

  it('Should NOT create multisig with nonuniq owners', async () => {
    const ms = anchor.web3.Keypair.generate();
    const nonuniqowners = [ownerA.publicKey, ownerB.publicKey, ownerB.publicKey];
    await expect(
      program.methods
        .createMultisig(nonuniqowners, new anchor.BN(2))
        .accounts({multisig: ms.publicKey})
        .signers([ms])
        .rpc())
      .to.be.rejectedWith(/Owners must be unique/);
  });

  it('Should NOT create multisig zero owners', async () => {
    const ms = anchor.web3.Keypair.generate();
    await expect(
      program.methods
        .createMultisig([], new anchor.BN(2))
        .accounts({multisig: ms.publicKey})
        .signers([ms])
        .rpc())
      .to.be.rejectedWith(/Owners length must be non zero and less than OWNERS_MAX_SIZE/);

  });

  it('Should NOT create multisig too many owners', async () => {
    const ms = anchor.web3.Keypair.generate();

    const owner4 = anchor.web3.Keypair.generate();
    const owner5 = anchor.web3.Keypair.generate();
    const owner6 = anchor.web3.Keypair.generate();
    const owner7 = anchor.web3.Keypair.generate();
    const owner8 = anchor.web3.Keypair.generate();
    const owner9 = anchor.web3.Keypair.generate();
    const owners9 = [ownerA.publicKey, ownerB.publicKey, ownerB.publicKey, owner4.publicKey, owner5.publicKey, owner6.publicKey,
       owner7.publicKey, owner8.publicKey, owner9.publicKey];

    await expect(
      program.methods
        .createMultisig(owners9, new anchor.BN(2))
        .accounts({multisig: ms.publicKey})
        .signers([ms])
        .rpc())
      .to.be.rejectedWith(/Owners length must be non zero and less than OWNERS_MAX_SIZE/);

  });

  it('Should NOT create multisig with zero threshold', async () => {
    const ms = anchor.web3.Keypair.generate();
    await expect(
      program.methods
        .createMultisig(owners, new anchor.BN(0))
        .accounts({multisig: ms.publicKey})
        .signers([ms])
        .rpc())
      .to.be.rejectedWith(/Threshold must be less than or equal to the number of owners/);
  });

  it('Should NOT create multisig with incorrect threshold', async () => {
    const ms = anchor.web3.Keypair.generate();
    await expect(
      program.methods
        .createMultisig(owners, new anchor.BN(4))
        .accounts({multisig: ms.publicKey})
        .signers([ms])
        .rpc())
      .to.be.rejectedWith(/Threshold must be less than or equal to the number of owners/);

  });
});
