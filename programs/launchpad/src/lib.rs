use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer},
};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod launchpad {
    use super::*;

    // -------- Config / Project --------
    pub fn init_config(
        ctx: Context<InitConfig>,
        treasury: Pubkey,
        usdc_mint: Pubkey,
        fee_bps: u16,
    ) -> Result<()> {
        let cfg = &mut ctx.accounts.config;
        cfg.authority = ctx.accounts.authority.key();
        cfg.treasury = treasury;
        cfg.usdc_mint = usdc_mint;
        cfg.fee_bps = fee_bps;
        Ok(())
    }

    pub fn create_project(
        ctx: Context<CreateProject>,
        royalty_bps: u16,
        pass_supply: u32,
    ) -> Result<()> {
        let p = &mut ctx.accounts.project;
        p.creator = ctx.accounts.creator.key();
        p.config = ctx.accounts.config.key();
        p.royalty_bps = royalty_bps;
        p.pass_supply = pass_supply;
        Ok(())
    }

    // -------- Marketplace (pNFT) --------
    pub fn list_pass(ctx: Context<ListPass>, price: u64) -> Result<()> {
        token::transfer(ctx.accounts.transfer_nft_seller_to_escrow(), 1)?;
        let listing = &mut ctx.accounts.listing;
        listing.bump = *ctx.bumps.get("listing").unwrap();
        listing.seller = ctx.accounts.seller.key();
        listing.nft_mint = ctx.accounts.nft_mint.key();
        listing.price = price;
        Ok(())
    }

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        token::transfer(ctx.accounts.transfer_nft_escrow_to_seller(), 1)?;
        token::close_account(ctx.accounts.close_escrow_to_seller())?;
        Ok(())
    }

    pub fn buy_pass(ctx: Context<BuyPass>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_keys_eq!(cfg.usdc_mint, ctx.accounts.usdc_mint.key(), LaunchpadError::WrongMint);

        let price = ctx.accounts.listing.price;
        let royalty = price.saturating_mul(cfg.fee_bps as u64) / 10_000;
        let to_seller = price.checked_sub(royalty).ok_or(LaunchpadError::MathOverflow)?;

        token::transfer(ctx.accounts.transfer_usdc_buyer_to_seller(), to_seller)?;
        token::transfer(ctx.accounts.transfer_usdc_buyer_to_treasury(), royalty)?;
        token::transfer(ctx.accounts.transfer_nft_escrow_to_buyer(), 1)?;
        token::close_account(ctx.accounts.close_escrow_to_buyer())?;
        Ok(())
    }

    // -------- Simplified CPMM (internal shares) --------
    pub fn create_market(ctx: Context<CreateMarket>, fee_bps: u16) -> Result<()> {
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

    pub fn buy_yes(ctx: Context<Trade>, amount_in: u64) -> Result<()> {
        trade_side(true, ctx, amount_in)
    }

    pub fn buy_no(ctx: Context<Trade>, amount_in: u64) -> Result<()> {
        trade_side(false, ctx, amount_in)
    }

    pub fn resolve_market(ctx: Context<Resolve>, outcome_yes: bool) -> Result<()> {
        require_keys_eq!(ctx.accounts.market.config, ctx.accounts.config.key(), LaunchpadError::Auth);
        require_keys_eq!(ctx.accounts.config.authority, ctx.accounts.authority.key(), LaunchpadError::Auth);
        let m = &mut ctx.accounts.market;
        m.resolved = true;
        m.outcome_yes = outcome_yes;
        Ok(())
    }

    pub fn redeem(ctx: Context<Redeem>) -> Result<()> {
        require!(ctx.accounts.market.resolved, LaunchpadError::NotResolved);
        let amount = if ctx.accounts.market.outcome_yes {
            ctx.accounts.position.yes_bal
        } else {
            ctx.accounts.position.no_bal
        };
        require!(amount > 0, LaunchpadError::NothingToRedeem);

        // zero out position first to avoid re-entrancy-style double spend within tx
        let pos = &mut ctx.accounts.position;
        if ctx.accounts.market.outcome_yes { pos.yes_bal = 0; } else { pos.no_bal = 0; }

        // vault -> user (PDA signs)
        let seeds: &[&[u8]] = &[b"market", ctx.accounts.market.seed_owner.as_ref(), ctx.accounts.market.usdc_mint.as_ref(), &[ctx.accounts.market.bump]];
        let cpi = Transfer {
            from: if ctx.accounts.market.outcome_yes { ctx.accounts.vault_yes.to_account_info() } else { ctx.accounts.vault_no.to_account_info() },
            to: ctx.accounts.user_usdc.to_account_info(),
            authority: ctx.accounts.market.to_account_info(),
        };
        token::transfer(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi, &[seeds]), amount)?;
        Ok(())
    }
}

fn trade_side(is_yes: bool, ctx: Context<Trade>, amount_in: u64) -> Result<()> {
    // Fee to treasury
    let market_fee = ctx.accounts.market.fee_bps as u64;
    let cfg_fee = ctx.accounts.config.fee_bps as u64; // platform cut
    let fee_market = amount_in.saturating_mul(market_fee) / 10_000;
    let fee_platform = amount_in.saturating_mul(cfg_fee) / 10_000;
    let net = amount_in.saturating_sub(fee_market + fee_platform);

    // user -> vault (net)
    let to_vault = Transfer {
        from: ctx.accounts.user_usdc.to_account_info(),
        to: if is_yes { ctx.accounts.vault_yes.to_account_info() } else { ctx.accounts.vault_no.to_account_info() },
        authority: ctx.accounts.trader.to_account_info(),
    };
    token::transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(), to_vault), net)?;

    // user -> treasury (platform fee)
    let to_treasury = Transfer {
        from: ctx.accounts.user_usdc.to_account_info(),
        to: ctx.accounts.treasury_usdc.to_account_info(),
        authority: ctx.accounts.trader.to_account_info(),
    };
    if fee_platform > 0 { token::transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(), to_treasury), fee_platform)?; }

    // record internal shares (simplified: 1:1 with net USDC)
    let pos = &mut ctx.accounts.position;
    if is_yes { pos.yes_bal = pos.yes_bal.saturating_add(net); } else { pos.no_bal = pos.no_bal.saturating_add(net); }

    Ok(())
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
pub struct Project {
    pub creator: Pubkey,
    pub config: Pubkey,
    pub royalty_bps: u16,
    pub pass_supply: u32,
}
impl Project { pub const LEN: usize = 32 + 32 + 2 + 4; }

#[account]
pub struct Listing { pub seller: Pubkey, pub nft_mint: Pubkey, pub price: u64, pub bump: u8 }
impl Listing { pub const LEN: usize = 32 + 32 + 8 + 1; }

#[account]
pub struct Market {
    pub bump: u8,
    pub config: Pubkey,
    pub seed_owner: Pubkey, // creator used in PDA seeds
    pub usdc_mint: Pubkey,
    pub vault_yes: Pubkey,
    pub vault_no: Pubkey,
    pub fee_bps: u16, // per-trade market fee (in addition to platform fee)
    pub resolved: bool,
    pub outcome_yes: bool,
}
impl Market { pub const LEN: usize = 1 + 32 + 32 + 32 + 32 + 32 + 2 + 1 + 1; }

#[account]
pub struct Position { pub owner: Pubkey, pub market: Pubkey, pub yes_bal: u64, pub no_bal: u64, pub bump: u8 }
impl Position { pub const LEN: usize = 32 + 32 + 8 + 8 + 1; }

// ---------------- Accounts ----------------

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    #[account(init, payer = authority, seeds = [b"config", authority.key().as_ref()], bump, space = 8 + Config::LEN)]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProject<'info> {
    #[account(mut)] pub creator: Signer<'info>,
    pub config: Account<'info, Config>,
    #[account(init, payer = creator, seeds = [b"project", creator.key().as_ref()], bump, space = 8 + Project::LEN)]
    pub project: Account<'info, Project>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ListPass<'info> {
    #[account(mut)] pub seller: Signer<'info>,
    pub config: Account<'info, Config>,
    #[account(init, payer = seller, seeds = [b"listing", nft_mint.key().as_ref(), seller.key().as_ref()], bump, space = 8 + Listing::LEN)]
    pub listing: Account<'info, Listing>,
    pub nft_mint: Account<'info, Mint>,
    #[account(mut, constraint = seller_nft.mint == nft_mint.key(), constraint = seller_nft.owner == seller.key())]
    pub seller_nft: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = seller, associated_token::mint = nft_mint, associated_token::authority = listing)]
    pub escrow_nft: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
impl<'info> ListPass<'info> {
    fn transfer_nft_seller_to_escrow(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi = Transfer { from: self.seller_nft.to_account_info(), to: self.escrow_nft.to_account_info(), authority: self.seller.to_account_info() };
        CpiContext::new(self.token_program.to_account_info(), cpi)
    }
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)] pub seller: Signer<'info>,
    #[account(mut, seeds = [b"listing", nft_mint.key().as_ref(), seller.key().as_ref()], bump = listing.bump, close = seller)]
    pub listing: Account<'info, Listing>,
    pub nft_mint: Account<'info, Mint>,
    #[account(mut, associated_token::mint = nft_mint, associated_token::authority = listing)]
    pub escrow_nft: Account<'info, TokenAccount>,
    #[account(mut, constraint = seller_nft.mint == nft_mint.key(), constraint = seller_nft.owner == seller.key())]
    pub seller_nft: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
impl<'info> CancelListing<'info> {
    fn seeds(&self) -> [&[u8]; 4] { [b"listing", self.nft_mint.key().as_ref(), self.seller.key.as_ref(), &[self.listing.bump]] }
    fn transfer_nft_escrow_to_seller(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi = Transfer { from: self.escrow_nft.to_account_info(), to: self.seller_nft.to_account_info(), authority: self.listing.to_account_info() };
        CpiContext::new_with_signer(self.token_program.to_account_info(), cpi, &[&self.seeds()])
    }
    fn close_escrow_to_seller(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        let cpi = CloseAccount { account: self.escrow_nft.to_account_info(), destination: self.seller.to_account_info(), authority: self.listing.to_account_info() };
        CpiContext::new_with_signer(self.token_program.to_account_info(), cpi, &[&self.seeds()])
    }
}

#[derive(Accounts)]
pub struct BuyPass<'info> {
    #[account(mut)] pub buyer: Signer<'info>,
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"listing", nft_mint.key().as_ref(), listing.seller.as_ref()], bump = listing.bump, has_one = nft_mint)]
    pub listing: Account<'info, Listing>,
    pub nft_mint: Account<'info, Mint>,
    #[account(mut, associated_token::mint = nft_mint, associated_token::authority = listing)]
    pub escrow_nft: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = buyer, associated_token::mint = nft_mint, associated_token::authority = buyer)]
    pub buyer_nft: Account<'info, TokenAccount>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut, constraint = buyer_usdc.mint == usdc_mint.key(), constraint = buyer_usdc.owner == buyer.key())]
    pub buyer_usdc: Account<'info, TokenAccount>,
    #[account(mut, constraint = seller_usdc.mint == usdc_mint.key(), constraint = seller_usdc.owner == listing.seller)]
    pub seller_usdc: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = usdc_mint, associated_token::authority = config.treasury)]
    pub treasury_usdc: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
impl<'info> BuyPass<'info> {
    fn seeds(&self) -> [&[u8]; 4] { [b"listing", self.nft_mint.key().as_ref(), self.listing.seller.as_ref(), &[self.listing.bump]] }
    fn transfer_usdc_buyer_to_seller(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi = Transfer { from: self.buyer_usdc.to_account_info(), to: self.seller_usdc.to_account_info(), authority: self.buyer.to_account_info() };
        CpiContext::new(self.token_program.to_account_info(), cpi)
    }
    fn transfer_usdc_buyer_to_treasury(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi = Transfer { from: self.buyer_usdc.to_account_info(), to: self.treasury_usdc.to_account_info(), authority: self.buyer.to_account_info() };
        CpiContext::new(self.token_program.to_account_info(), cpi)
    }
    fn transfer_nft_escrow_to_buyer(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi = Transfer { from: self.escrow_nft.to_account_info(), to: self.buyer_nft.to_account_info(), authority: self.listing.to_account_info() };
        CpiContext::new_with_signer(self.token_program.to_account_info(), cpi, &[&self.seeds()])
    }
    fn close_escrow_to_buyer(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        let cpi = CloseAccount { account: self.escrow_nft.to_account_info(), destination: self.buyer.to_account_info(), authority: self.listing.to_account_info() };
        CpiContext::new_with_signer(self.token_program.to_account_info(), cpi, &[&self.seeds()])
    }
}

#[derive(Accounts)]
pub struct CreateMarket<'info> {
    #[account(mut)] pub creator: Signer<'info>,
    pub config: Account<'info, Config>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(init, payer = creator, seeds = [b"market", creator.key().as_ref(), usdc_mint.key().as_ref()], bump, space = 8 + Market::LEN)]
    pub market: Account<'info, Market>,
    #[account(init, payer = creator, associated_token::mint = usdc_mint, associated_token::authority = market)]
    pub vault_yes: Account<'info, TokenAccount>,
    #[account(init, payer = creator, associated_token::mint = usdc_mint, associated_token::authority = market)]
    pub vault_no: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Trade<'info> {
    #[account(mut)] pub trader: Signer<'info>,
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"market", market.seed_owner.as_ref(), market.usdc_mint.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut, associated_token::mint = usdc_mint, associated_token::authority = market)]
    pub vault_yes: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = usdc_mint, associated_token::authority = market)]
    pub vault_no: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = usdc_mint, associated_token::authority = config.treasury)]
    pub treasury_usdc: Account<'info, TokenAccount>,
    #[account(mut, constraint = user_usdc.owner == trader.key(), constraint = user_usdc.mint == usdc_mint.key())]
    pub user_usdc: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = trader, seeds = [b"position", market.key().as_ref(), trader.key().as_ref()], bump, space = 8 + Position::LEN)]
    pub position: Account<'info, Position>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Resolve<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"market", market.seed_owner.as_ref(), market.usdc_mint.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,
}

#[derive(Accounts)]
pub struct Redeem<'info> {
    #[account(mut)] pub trader: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub config: Account<'info, Config>,
    #[account(mut, seeds = [b"market", market.seed_owner.as_ref(), market.usdc_mint.as_ref()], bump = market.bump)]
    pub market: Account<'info, Market>,
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut, associated_token::mint = usdc_mint, associated_token::authority = market)]
    pub vault_yes: Account<'info, TokenAccount>,
    #[account(mut, associated_token::mint = usdc_mint, associated_token::authority = market)]
    pub vault_no: Account<'info, TokenAccount>,
    #[account(mut, constraint = user_usdc.owner == trader.key(), constraint = user_usdc.mint == usdc_mint.key())]
    pub user_usdc: Account<'info, TokenAccount>,
    #[account(mut, seeds = [b"position", market.key().as_ref(), trader.key().as_ref()], bump = position.bump, has_one = owner, has_one = market)]
    pub position: Account<'info, Position>,
    /// CHECK: owner field checked through has_one
    pub owner: AccountInfo<'info>,
}

// ---------------- Errors ----------------

#[error_code]
pub enum LaunchpadError {
    #[msg("Math overflow")] MathOverflow,
    #[msg("Wrong mint provided")] WrongMint,
    #[msg("Unauthorized")] Auth,
    #[msg("Market not resolved")] NotResolved,
    #[msg("Nothing to redeem")] NothingToRedeem,
}
