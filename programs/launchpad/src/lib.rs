use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

// Temporary placeholder; CI will replace on deploy
declare_id!("CdvaU5g7hV3B7amC149moLDfGrMsXmJwqRm3uVCoMdZ");

#[program]
pub mod launchpad {
    use super::*;

    pub fn init_config(ctx: Context<InitConfig>, treasury: Pubkey, usdc_mint: Pubkey, fee_bps: u16) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        cfg.authority = ctx.accounts.authority.key();
        cfg.treasury = treasury;
        cfg.usdc_mint = usdc_mint;
        cfg.fee_bps = fee_bps;
        Ok(())
    }

    pub fn create_merchant(ctx: Context<CreateMerchant>, name: String) -> Result<()> {
        require!(name.len() <= Merchant::MAX_NAME_LEN, LaunchpadError::NameTooLong);
        let m = &mut ctx.accounts.merchant;
        m.authority = ctx.accounts.authority.key();
        m.name = name;
        Ok(())
    }

    pub fn create_project_v2(
        ctx: Context<CreateProjectV2>,
        royalty_bps: u16,
        pass_supply: u32,
        preorder_open_at: i64,
        preorder_close_at: i64,
    ) -> Result<()> {
        require!(royalty_bps <= 10_000, LaunchpadError::InvalidBps);
        let p = &mut ctx.accounts.project;
        p.merchant = ctx.accounts.merchant.key();
        p.config = ctx.accounts.config.key();
        p.collection_mint = ctx.accounts.collection_mint.key();
        p.royalty_bps = royalty_bps;
        p.pass_supply = pass_supply;
        p.preorder_open_at = preorder_open_at;
        p.preorder_close_at = preorder_close_at;
        Ok(())
    }

    pub fn list_pass(ctx: Context<ListPass>, price: u64) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        listing.bump = *ctx.bumps.get("listing").unwrap();
        listing.seller = ctx.accounts.seller.key();
        listing.nft_mint = ctx.accounts.nft_mint.key();
        listing.price = price;
        Ok(())
    }

    pub fn cancel_listing(_ctx: Context<CancelListing>) -> Result<()> { Ok(()) }

    pub fn buy_pass(_ctx: Context<BuyPass>) -> Result<()> { Ok(()) }

    pub fn create_market(ctx: Context<CreateMarket>, fee_bps: u16) -> Result<()> {
        require!(fee_bps <= 10_000, LaunchpadError::InvalidBps);
        let m = &mut ctx.accounts.market;
        m.bump = *ctx.bumps.get("market").unwrap();
        m.config = ctx.accounts.config.key();
        m.usdc_mint = ctx.accounts.usdc_mint.key();
        m.vault_yes = ctx.accounts.vault_yes.key();
        m.vault_no = ctx.accounts.vault_no.key();
        m.fee_bps = fee_bps;
        m.resolved = false;
        m.outcome_yes = false;
        Ok(())
    }

    pub fn buy_yes(_ctx: Context<Trade>, _amount_in: u64) -> Result<()> { Ok(()) }
    pub fn buy_no(_ctx: Context<Trade>, _amount_in: u64) -> Result<()> { Ok(()) }

    pub fn resolve_market(ctx: Context<Resolve>, outcome_yes: bool) -> Result<()> {
        require_keys_eq!(ctx.accounts.config.authority, ctx.accounts.authority.key(), LaunchpadError::Auth);
        let m = &mut ctx.accounts.market;
        m.resolved = true;
        m.outcome_yes = outcome_yes;
        Ok(())
    }

    pub fn redeem(_ctx: Context<Redeem>) -> Result<()> { Ok(()) }
}

// ---------------- State ----------------

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub usdc_mint: Pubkey,
    pub fee_bps: u16,
}
impl Config { pub const LEN: usize = 32 + 32 + 32 + 2; }

#[account]
pub struct Merchant {
    pub authority: Pubkey,
    pub name: String,
}
impl Merchant { pub const MAX_NAME_LEN: usize = 64; pub const LEN: usize = 32 + 4 + Self::MAX_NAME_LEN; }

#[account]
pub struct ProjectV2 {
    pub merchant: Pubkey,
    pub config: Pubkey,
    pub collection_mint: Pubkey,
    pub royalty_bps: u16,
    pub pass_supply: u32,
    pub preorder_open_at: i64,
    pub preorder_close_at: i64,
}
impl ProjectV2 { pub const LEN: usize = 32 + 32 + 32 + 2 + 4 + 8 + 8; }

#[account]
pub struct Listing { pub seller: Pubkey, pub nft_mint: Pubkey, pub price: u64, pub bump: u8 }
impl Listing { pub const LEN: usize = 32 + 32 + 8 + 1; }

#[account]
pub struct Market {
    pub bump: u8,
    pub config: Pubkey,
    pub usdc_mint: Pubkey,
    pub vault_yes: Pubkey,
    pub vault_no: Pubkey,
    pub fee_bps: u16,
    pub resolved: bool,
    pub outcome_yes: bool,
}
impl Market { pub const LEN: usize = 1 + 32 + 32 + 32 + 32 + 2 + 1 + 1; }

#[account]
pub struct Position { pub owner: Pubkey, pub market: Pubkey, pub yes_bal: u64, pub no_bal: u64, pub bump: u8 }
impl Position { pub const LEN: usize = 32 + 32 + 8 + 8 + 1; }

// ---------------- Accounts ----------------

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        seeds = [b"config", authority.key().as_ref()],
        bump,
        space = 8 + Config::LEN,
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateMerchant<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        seeds = [b"merchant", authority.key().as_ref()],
        bump,
        space = 8 + Merchant::LEN,
    )]
    pub merchant: Account<'info, Merchant>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProjectV2<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    pub merchant: Account<'info, Merchant>,
    pub config: Account<'info, Config>,
    pub collection_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = authority,
        seeds = [b"project", merchant.key().as_ref(), collection_mint.key().as_ref()],
        bump,
        space = 8 + ProjectV2::LEN,
    )]
    pub project: Account<'info, ProjectV2>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ListPass<'info> {
    #[account(mut)] pub seller: Signer<'info>,
    pub nft_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = seller,
        seeds = [b"listing", nft_mint.key().as_ref(), seller.key().as_ref()],
        bump,
        space = 8 + Listing::LEN,
    )]
    pub listing: Account<'info, Listing>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)] pub seller: Signer<'info>,
    #[account(mut, seeds = [b"listing", nft_mint.key().as_ref(), seller.key().as_ref()], bump = listing.bump, close = seller)]
    pub listing: Account<'info, Listing>,
    pub nft_mint: Account<'info, Mint>,
}

#[derive(Accounts)]
pub struct BuyPass<'info> {
    #[account(mut)] pub buyer: Signer<'info>,
    #[account(mut, has_one = nft_mint)] pub listing: Account<'info, Listing>,
    pub nft_mint: Account<'info, Mint>,
}

#[derive(Accounts)]
pub struct CreateMarket<'info> {
    #[account(mut)] pub creator: Signer<'info>,
    pub config: Account<'info, Config>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut)] pub vault_yes: Account<'info, TokenAccount>,
    #[account(mut)] pub vault_no: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = creator,
        seeds = [b"market", creator.key().as_ref(), usdc_mint.key().as_ref()],
        bump,
        space = 8 + Market::LEN,
    )]
    pub market: Account<'info, Market>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Trade<'info> {
    #[account(mut)] pub trader: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub config: Account<'info, Config>,
    #[account(mut)] pub market: Account<'info, Market>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut)] pub vault_yes: Account<'info, TokenAccount>,
    #[account(mut)] pub vault_no: Account<'info, TokenAccount>,
    #[account(mut)] pub user_usdc: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = trader,
        seeds = [b"position", market.key().as_ref(), trader.key().as_ref()],
        bump,
        space = 8 + Position::LEN,
    )]
    pub position: Account<'info, Position>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Resolve<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    pub config: Account<'info, Config>,
    #[account(mut)] pub market: Account<'info, Market>,
}

#[derive(Accounts)]
pub struct Redeem<'info> {
    #[account(mut)] pub trader: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub config: Account<'info, Config>,
    #[account(mut)] pub market: Account<'info, Market>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut)] pub vault_yes: Account<'info, TokenAccount>,
    #[account(mut)] pub vault_no: Account<'info, TokenAccount>,
    #[account(mut)] pub user_usdc: Account<'info, TokenAccount>,
    #[account(mut)] pub position: Account<'info, Position>,
}

// ---------------- Errors ----------------

#[error_code]
pub enum LaunchpadError {
    #[msg("Math overflow")] MathOverflow,
    #[msg("Wrong mint provided")] WrongMint,
    #[msg("Unauthorized")] Auth,
    #[msg("Market not resolved")] NotResolved,
    #[msg("Nothing to redeem")] NothingToRedeem,
    #[msg("Invalid basis points") ] InvalidBps,
    #[msg("Name too long")] NameTooLong,
}

