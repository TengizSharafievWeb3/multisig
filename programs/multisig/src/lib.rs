use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod multisig {
    use super::*;
    
    // Initializes a new multisig account with a set of owners and a threshold.
    pub fn create_multisig(
        ctx: Context<CreateMultisig>,
        owners: Vec<Pubkey>,
        threshold: u64,
    ) -> ProgramResult {
        require!(!owners.is_empty() && owners.len() <= OWNERS_MAX_SIZE, InvalidOwnersLen);
        require!(threshold > 0 && threshold < owners.len() as u64, InvalidThreshold);
        assert_unique_owners(&owners)?;

        let multisig = &mut ctx.accounts.multisig;
        multisig.owners = owners;
        multisig.threshold = threshold;
        multisig.nonce = *ctx.bumps.get("multisig_signer").unwrap();
        multisig.owner_set_seqno = 0;
        Ok(())
    }
}

fn assert_unique_owners(owners: &[Pubkey]) -> ProgramResult {
    for (i, owner) in owners.iter().enumerate() {
        require!(
            !owners.iter().skip(i + 1).any(|item| item == owner),
            UniqueOwners
        )
    }
    Ok(())
}


#[derive(Accounts)]
pub struct CreateMultisig<'info> {
    #[account(init, payer = payer, space = MULTISIG_SIZE)]
    pub multisig: Account<'info, Multisig>,
    #[account(seeds = [multisig.key().as_ref()], bump)]
    pub multisig_signer: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

const OWNERS_MAX_SIZE : usize = 8;
const MULTISIG_SIZE : usize = 8 + // discriminator
    std::mem::size_of::<u64>() + // threshold
    std::mem::size_of::<u8>() + // nonce
    std::mem::size_of::<u32>() + // owner_set_seqno
    4 + std::mem::size_of::<Pubkey>()*OWNERS_MAX_SIZE; // owners

#[account]
pub struct Multisig {
    pub owners: Vec<Pubkey>,
    pub threshold: u64,
    pub nonce: u8,
    pub owner_set_seqno: u32,
}

#[error]
pub enum ErrorCode {
    #[msg("The given owner is not part of this multisig.")]
    InvalidOwner,
    #[msg("Owners length must be non zero and less than OWNERS_MAX_SIZE")]
    InvalidOwnersLen,
    #[msg("Not enough owners signed this transaction.")]
    NotEnoughSigners,
    #[msg("Cannot delete a transaction that has been signed by an owner.")]
    TransactionAlreadySigned,
    #[msg("Overflow when adding.")]
    Overflow,
    #[msg("Cannot delete a transaction the owner did not create.")]
    UnableToDelete,
    #[msg("The given transaction has already been executed.")]
    AlreadyExecuted,
    #[msg("Threshold must be less than or equal to the number of owners.")]
    InvalidThreshold,
    #[msg("Owners must be unique")]
    UniqueOwners,
}