use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer},
};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod launchpad {
    use super::*;

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

    pub fn list_pass(ctx: Context<ListPass>, price: u64) -> Result<()> {
        // move NFT to PDA-owned escrow
        token::transfer(ctx.accounts.transfer_nft_seller_to_escrow(), 1)?;
        let listing = &mut ctx.accounts.listing;
        listing.bump = *ctx.bumps.get("listing").unwrap();
        listing.seller = ctx.accounts.seller.key();
        listing.nft_mint = ctx.accounts.nft_mint.key();
        listing.price = price;
        Ok(())
    }

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        // NFT back to seller, close escrow ATA
        token::transfer(ctx.accounts.transfer_nft_escrow_to_seller(), 1)?;
        token::close_account(ctx.accounts.close_escrow_to_seller())?;
        Ok(())
    }

    pub fn buy_pass(ctx: Context<BuyPass>) -> Result<()> {
        let cfg = &ctx.accounts.config;
        require_keys_eq!(cfg.usdc_mint, ctx.accounts.usdc_mint.key(), LaunchpadError::WrongMint);

        let price = ctx.accounts.listing.price;
        let royalty = price.saturating_mul(cfg.fee_bps as u64) / 10_000;
        let to_seller = price
            .checked_sub(royalty)
            .ok_or(LaunchpadError::MathOverflow)?;

        // USDC transfers
        token::transfer(ctx.accounts.transfer_usdc_buyer_to_seller(), to_seller)?;
        token::transfer(ctx.accounts.transfer_usdc_buyer_to_treasury(), royalty)?;

        // NFT to buyer, close escrow
        token::transfer(ctx.accounts.transfer_nft_escrow_to_buyer(), 1)?;
        token::close_account(ctx.accounts.close_escrow_to_buyer())?;
        Ok(())
    }
}

// ---------------- State ----------------

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub usdc_mint: Pubkey,
    pub fee_bps: u16,
}
impl Config {
    pub const LEN: usize = 32 + 32 + 32 + 2;
}

#[account]
pub struct Project {
    pub creator: Pubkey,
    pub config: Pubkey,
    pub royalty_bps: u16,
    pub pass_supply: u32,
}
impl Project {
    pub const LEN: usize = 32 + 32 + 2 + 4;
}

#[account]
pub struct Listing {
    pub seller: Pubkey,
    pub nft_mint: Pubkey,
    pub price: u64,
    pub bump: u8,
}
impl Listing {
    pub const LEN: usize = 32 + 32 + 8 + 1;
}

// ---------------- Accounts ----------------

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        seeds = [b"config", authority.key().as_ref()],
        bump,
        space = 8 + Config::LEN
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProject<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = creator,
        seeds = [b"project", creator.key().as_ref()],
        bump,
        space = 8 + Project::LEN
    )]
    pub project: Account<'info, Project>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ListPass<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = seller,
        seeds = [b"listing", nft_mint.key().as_ref(), seller.key().as_ref()],
        bump,
        space = 8 + Listing::LEN
    )]
    pub listing: Account<'info, Listing>,

    pub nft_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = seller_nft.mint == nft_mint.key(),
        constraint = seller_nft.owner == seller.key()
    )]
    pub seller_nft: Account<'info, TokenAccount>,

    // Escrow ATA owned by the listing PDA
    #[account(
        init_if_needed,
        payer = seller,
        associated_token::mint = nft_mint,
        associated_token::authority = listing
    )]
    pub escrow_nft: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> ListPass<'info> {
    fn transfer_nft_seller_to_escrow(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.seller_nft.to_account_info(),
            to: self.escrow_nft.to_account_info(),
            authority: self.seller.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
}

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    #[account(
        mut,
        seeds = [b"listing", nft_mint.key().as_ref(), seller.key().as_ref()],
        bump = listing.bump,
        close = seller
    )]
    pub listing: Account<'info, Listing>,

    pub nft_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = listing
    )]
    pub escrow_nft: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = seller_nft.mint == nft_mint.key(),
        constraint = seller_nft.owner == seller.key()
    )]
    pub seller_nft: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> CancelListing<'info> {
    fn signer_seeds(&self) -> [&[u8]; 4] {
        [
            b"listing",
            self.nft_mint.key().as_ref(),
            self.seller.key.as_ref(),
            &[self.listing.bump],
        ]
    }
    fn transfer_nft_escrow_to_seller(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.escrow_nft.to_account_info(),
            to: self.seller_nft.to_account_info(),
            authority: self.listing.to_account_info(),
        };
        CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            &[&self.signer_seeds()],
        )
    }
    fn close_escrow_to_seller(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        let cpi_accounts = CloseAccount {
            account: self.escrow_nft.to_account_info(),
            destination: self.seller.to_account_info(),
            authority: self.listing.to_account_info(),
        };
        CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            &[&self.signer_seeds()],
        )
    }
}

#[derive(Accounts)]
pub struct BuyPass<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"listing", nft_mint.key().as_ref(), listing.seller.as_ref()],
        bump = listing.bump,
        has_one = nft_mint
    )]
    pub listing: Account<'info, Listing>,

    // NFT
    pub nft_mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = listing
    )]
    pub escrow_nft: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = nft_mint,
        associated_token::authority = buyer
    )]
    pub buyer_nft: Account<'info, TokenAccount>,

    // USDC
    pub usdc_mint: Account<'info, Mint>,
    #[account(mut, constraint = buyer_usdc.mint == usdc_mint.key(), constraint = buyer_usdc.owner == buyer.key())]
    pub buyer_usdc: Account<'info, TokenAccount>,
    #[account(mut, constraint = seller_usdc.mint == usdc_mint.key(), constraint = seller_usdc.owner == listing.seller)]
    pub seller_usdc: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = config.treasury
    )]
    pub treasury_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> BuyPass<'info> {
    fn signer_seeds(&self) -> [&[u8]; 4] {
        [
            b"listing",
            self.nft_mint.key().as_ref(),
            self.listing.seller.as_ref(),
            &[self.listing.bump],
        ]
    }
    fn transfer_usdc_buyer_to_seller(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.buyer_usdc.to_account_info(),
            to: self.seller_usdc.to_account_info(),
            authority: self.buyer.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
    fn transfer_usdc_buyer_to_treasury(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.buyer_usdc.to_account_info(),
            to: self.treasury_usdc.to_account_info(),
            authority: self.buyer.to_account_info(),
        };
        CpiContext::new(self.token_program.to_account_info(), cpi_accounts)
    }
    fn transfer_nft_escrow_to_buyer(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self.escrow_nft.to_account_info(),
            to: self.buyer_nft.to_account_info(),
            authority: self.listing.to_account_info(),
        };
        CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            &[&self.signer_seeds()],
        )
    }
    fn close_escrow_to_buyer(&self) -> CpiContext<'_, '_, '_, 'info, CloseAccount<'info>> {
        let cpi_accounts = CloseAccount {
            account: self.escrow_nft.to_account_info(),
            destination: self.buyer.to_account_info(),
            authority: self.listing.to_account_info(),
        };
        CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            &[&self.signer_seeds()],
        )
    }
}

#[error_code]
pub enum LaunchpadError {
    #[msg("Math overflow")] 
    MathOverflow,
    #[msg("Wrong mint provided")] 
    WrongMint,
}
