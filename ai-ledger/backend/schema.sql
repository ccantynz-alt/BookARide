-- ============================================================================
-- AI Ledger — PostgreSQL Schema
-- An AI-powered accounting platform managing tax treaties between
-- USA, NZ, Australia, and UK. Serves accountants, small firms, and
-- small businesses.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. acct_organizations
-- Multi-tenant organizations. Every accounting entity (firm, business, sole
-- trader) is an organization. All transactional tables reference org_id to
-- enforce tenant isolation.
-- ============================================================================
CREATE TABLE acct_organizations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    country         VARCHAR(2) NOT NULL CHECK (country IN ('US', 'NZ', 'AU', 'UK')),
    tax_id          VARCHAR(50),
    fiscal_year_end VARCHAR(5) NOT NULL DEFAULT '12-31',  -- MM-DD format
    base_currency   VARCHAR(3) NOT NULL DEFAULT 'USD',
    subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free'
                      CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_organizations IS
    'Multi-tenant organizations. Each org represents a firm, business, or sole trader.';

-- ============================================================================
-- 2. acct_users
-- Platform users with authentication credentials and role assignment.
-- A user can belong to multiple organizations via acct_user_org_access.
-- ============================================================================
CREATE TABLE acct_users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    name            TEXT NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'viewer'
                    CHECK (role IN ('owner', 'admin', 'accountant', 'bookkeeper', 'viewer', 'client')),
    mfa_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret      TEXT,
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_users IS
    'Platform users with authentication, roles, and optional MFA.';

CREATE INDEX idx_acct_users_email ON acct_users (email);

-- ============================================================================
-- 3. acct_user_org_access
-- Maps users to organizations with per-org role and granular permissions.
-- Enables a single user (e.g. an accountant) to access multiple client orgs.
-- ============================================================================
CREATE TABLE acct_user_org_access (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES acct_users(id) ON DELETE CASCADE,
    org_id          UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL DEFAULT 'viewer'
                    CHECK (role IN ('owner', 'admin', 'accountant', 'bookkeeper', 'viewer', 'client')),
    permissions     JSONB NOT NULL DEFAULT '{}',
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, org_id)
);

COMMENT ON TABLE acct_user_org_access IS
    'User-to-organization mapping with per-org role and granular permissions.';

CREATE INDEX idx_acct_user_org_access_user_id ON acct_user_org_access (user_id);
CREATE INDEX idx_acct_user_org_access_org_id ON acct_user_org_access (org_id);

-- ============================================================================
-- 4. acct_chart_of_accounts
-- Chart of accounts per organization. Supports hierarchical accounts via
-- parent_id and system-generated vs user-created distinction.
-- ============================================================================
CREATE TABLE acct_chart_of_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    code            VARCHAR(20) NOT NULL,
    name            TEXT NOT NULL,
    type            VARCHAR(20) NOT NULL
                    CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    sub_type        VARCHAR(50),
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,
    parent_id       UUID REFERENCES acct_chart_of_accounts(id) ON DELETE SET NULL,
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, code)
);

COMMENT ON TABLE acct_chart_of_accounts IS
    'Chart of accounts per org. Hierarchical via parent_id. Supports multi-currency.';

CREATE INDEX idx_acct_chart_of_accounts_org_id ON acct_chart_of_accounts (org_id);
CREATE INDEX idx_acct_chart_of_accounts_type ON acct_chart_of_accounts (org_id, type);

-- ============================================================================
-- 5. acct_journals
-- Journal entries — the core double-entry bookkeeping record. Each journal
-- has one or more lines (acct_journal_lines) that must balance.
-- ============================================================================
CREATE TABLE acct_journals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    entry_number    VARCHAR(30) NOT NULL,
    date            DATE NOT NULL,
    description     TEXT,
    status          VARCHAR(10) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'posted', 'void')),
    source          VARCHAR(20) NOT NULL DEFAULT 'manual'
                    CHECK (source IN ('manual', 'ai_categorized', 'bank_import', 'invoice')),
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    exchange_rate   NUMERIC(12, 6) NOT NULL DEFAULT 1.000000,
    posted_by       UUID REFERENCES acct_users(id) ON DELETE SET NULL,
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, entry_number)
);

COMMENT ON TABLE acct_journals IS
    'Journal entries — core double-entry records. Lines must balance (total debits = total credits).';

CREATE INDEX idx_acct_journals_org_id ON acct_journals (org_id);
CREATE INDEX idx_acct_journals_date ON acct_journals (org_id, date);
CREATE INDEX idx_acct_journals_status ON acct_journals (org_id, status);

-- ============================================================================
-- 6. acct_journal_lines
-- Individual debit/credit lines within a journal entry. Each line references
-- an account from the chart of accounts.
-- ============================================================================
CREATE TABLE acct_journal_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id      UUID NOT NULL REFERENCES acct_journals(id) ON DELETE CASCADE,
    account_id      UUID NOT NULL REFERENCES acct_chart_of_accounts(id) ON DELETE RESTRICT,
    debit           NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    credit          NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    description     TEXT,
    tax_code        VARCHAR(20),
    currency        VARCHAR(3),
    exchange_rate   NUMERIC(12, 6),
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (debit >= 0 AND credit >= 0),
    CHECK (NOT (debit > 0 AND credit > 0))  -- a line is either debit or credit, not both
);

COMMENT ON TABLE acct_journal_lines IS
    'Debit/credit lines within a journal entry. Each line maps to one account.';

CREATE INDEX idx_acct_journal_lines_journal_id ON acct_journal_lines (journal_id);
CREATE INDEX idx_acct_journal_lines_account_id ON acct_journal_lines (account_id);

-- ============================================================================
-- 7. acct_contacts
-- Customers, suppliers, or both. Used by invoices, payments, and reporting.
-- (Defined before invoices because acct_invoices references acct_contacts.)
-- ============================================================================
CREATE TABLE acct_contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    type            VARCHAR(10) NOT NULL DEFAULT 'customer'
                    CHECK (type IN ('customer', 'supplier', 'both')),
    name            TEXT NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(50),
    tax_id          VARCHAR(50),
    country         VARCHAR(2),
    currency        VARCHAR(3),
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_contacts IS
    'Customers and suppliers. Referenced by invoices and payments.';

CREATE INDEX idx_acct_contacts_org_id ON acct_contacts (org_id);
CREATE INDEX idx_acct_contacts_type ON acct_contacts (org_id, type);

-- ============================================================================
-- 8. acct_invoices
-- Sales and purchase invoices. Tracks lifecycle from draft through to payment
-- or voiding. Links to contacts and generates journal entries on posting.
-- ============================================================================
CREATE TABLE acct_invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    type            VARCHAR(10) NOT NULL CHECK (type IN ('sales', 'purchase')),
    invoice_number  VARCHAR(50) NOT NULL,
    contact_id      UUID REFERENCES acct_contacts(id) ON DELETE SET NULL,
    date            DATE NOT NULL,
    due_date        DATE NOT NULL,
    status          VARCHAR(10) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'void')),
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    subtotal        NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_total       NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total           NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    amount_paid     NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (org_id, invoice_number)
);

COMMENT ON TABLE acct_invoices IS
    'Sales and purchase invoices. Tracks full lifecycle from draft to payment/void.';

CREATE INDEX idx_acct_invoices_org_id ON acct_invoices (org_id);
CREATE INDEX idx_acct_invoices_date ON acct_invoices (org_id, date);
CREATE INDEX idx_acct_invoices_due_date ON acct_invoices (org_id, due_date);
CREATE INDEX idx_acct_invoices_status ON acct_invoices (org_id, status);
CREATE INDEX idx_acct_invoices_contact_id ON acct_invoices (contact_id);

-- ============================================================================
-- 9. acct_invoice_lines
-- Line items on an invoice. Each line can reference a chart-of-accounts entry
-- and carry its own tax code and rate.
-- ============================================================================
CREATE TABLE acct_invoice_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID NOT NULL REFERENCES acct_invoices(id) ON DELETE CASCADE,
    description     TEXT,
    quantity        NUMERIC(12, 4) NOT NULL DEFAULT 1.0000,
    unit_price      NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_code        VARCHAR(20),
    tax_rate        NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    amount          NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    account_id      UUID REFERENCES acct_chart_of_accounts(id) ON DELETE SET NULL,
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_invoice_lines IS
    'Line items within an invoice. Each line maps to an account and carries tax info.';

CREATE INDEX idx_acct_invoice_lines_invoice_id ON acct_invoice_lines (invoice_id);

-- ============================================================================
-- 10. acct_bank_accounts
-- Linked bank accounts via open-banking providers (Plaid for US, Basiq for
-- AU/NZ, TrueLayer for UK). Stores masked account numbers only.
-- ============================================================================
CREATE TABLE acct_bank_accounts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id              UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    account_number_masked VARCHAR(20),
    institution         TEXT,
    currency            VARCHAR(3) NOT NULL DEFAULT 'USD',
    balance             NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    last_synced         TIMESTAMPTZ,
    provider            VARCHAR(20) CHECK (provider IN ('plaid', 'basiq', 'truelayer')),
    provider_account_id TEXT,
    data                JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_bank_accounts IS
    'Linked bank accounts via open-banking providers (Plaid, Basiq, TrueLayer).';

CREATE INDEX idx_acct_bank_accounts_org_id ON acct_bank_accounts (org_id);

-- ============================================================================
-- 11. acct_bank_transactions
-- Bank feed transactions ingested from linked bank accounts. AI categorization
-- suggests account matches with a confidence score.
-- ============================================================================
CREATE TABLE acct_bank_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_account_id     UUID NOT NULL REFERENCES acct_bank_accounts(id) ON DELETE CASCADE,
    org_id              UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    date                DATE NOT NULL,
    description         TEXT,
    amount              NUMERIC(15, 2) NOT NULL,
    type                VARCHAR(10) NOT NULL CHECK (type IN ('debit', 'credit')),
    category_ai         VARCHAR(100),
    confidence_score    NUMERIC(4, 3),
    matched_journal_id  UUID REFERENCES acct_journals(id) ON DELETE SET NULL,
    status              VARCHAR(15) NOT NULL DEFAULT 'unmatched'
                        CHECK (status IN ('unmatched', 'suggested', 'matched', 'reconciled')),
    data                JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_bank_transactions IS
    'Bank feed transactions. AI categorizes and suggests journal matches with confidence scores.';

CREATE INDEX idx_acct_bank_transactions_org_id ON acct_bank_transactions (org_id);
CREATE INDEX idx_acct_bank_transactions_bank_account_id ON acct_bank_transactions (bank_account_id);
CREATE INDEX idx_acct_bank_transactions_date ON acct_bank_transactions (org_id, date);
CREATE INDEX idx_acct_bank_transactions_status ON acct_bank_transactions (org_id, status);
CREATE INDEX idx_acct_bank_transactions_matched_journal_id ON acct_bank_transactions (matched_journal_id);

-- ============================================================================
-- 12. acct_tax_codes
-- Tax codes per jurisdiction. Covers GST (NZ/AU), VAT (UK), and sales tax
-- (US). Rate stored as NUMERIC(5,4) to support fractional percentages
-- (e.g. 0.1500 = 15%).
-- ============================================================================
CREATE TABLE acct_tax_codes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID REFERENCES acct_organizations(id) ON DELETE CASCADE,
    code            VARCHAR(20) NOT NULL,
    name            TEXT NOT NULL,
    rate            NUMERIC(5, 4) NOT NULL DEFAULT 0.0000,
    jurisdiction    VARCHAR(2) NOT NULL CHECK (jurisdiction IN ('US', 'NZ', 'AU', 'UK')),
    tax_type        VARCHAR(20) NOT NULL
                    CHECK (tax_type IN ('GST', 'VAT', 'sales_tax', 'income_tax')),
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_tax_codes IS
    'Tax codes by jurisdiction. Covers GST (NZ/AU), VAT (UK), and sales tax (US).';

CREATE INDEX idx_acct_tax_codes_org_id ON acct_tax_codes (org_id);
CREATE INDEX idx_acct_tax_codes_jurisdiction ON acct_tax_codes (jurisdiction);

-- ============================================================================
-- 13. acct_tax_returns
-- Filed or draft tax returns. Tracks the full lifecycle from calculation
-- through filing and acceptance by tax authorities.
-- ============================================================================
CREATE TABLE acct_tax_returns (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    jurisdiction    VARCHAR(2) NOT NULL CHECK (jurisdiction IN ('US', 'NZ', 'AU', 'UK')),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    return_type     VARCHAR(15) NOT NULL
                    CHECK (return_type IN ('GST', 'BAS', 'VAT', 'sales_tax', 'income')),
    status          VARCHAR(15) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'calculated', 'filed', 'accepted')),
    total_tax       NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_tax_returns IS
    'Tax returns per jurisdiction and period. Tracks lifecycle from draft to accepted.';

CREATE INDEX idx_acct_tax_returns_org_id ON acct_tax_returns (org_id);
CREATE INDEX idx_acct_tax_returns_jurisdiction ON acct_tax_returns (org_id, jurisdiction);
CREATE INDEX idx_acct_tax_returns_period ON acct_tax_returns (org_id, period_start, period_end);
CREATE INDEX idx_acct_tax_returns_status ON acct_tax_returns (org_id, status);

-- ============================================================================
-- 14. acct_tax_treaties
-- Tax treaty rules between country pairs. Stores treaty articles and
-- withholding rates as JSONB for flexibility across different treaty
-- structures (US-NZ, US-AU, US-UK, NZ-AU, NZ-UK, AU-UK).
-- ============================================================================
CREATE TABLE acct_tax_treaties (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_a       VARCHAR(2) NOT NULL CHECK (country_a IN ('US', 'NZ', 'AU', 'UK')),
    country_b       VARCHAR(2) NOT NULL CHECK (country_b IN ('US', 'NZ', 'AU', 'UK')),
    treaty_name     TEXT NOT NULL,
    effective_date  DATE NOT NULL,
    articles        JSONB NOT NULL DEFAULT '{}',
    withholding_rates JSONB NOT NULL DEFAULT '{}',
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (country_a < country_b)  -- enforce canonical ordering to prevent duplicates
);

COMMENT ON TABLE acct_tax_treaties IS
    'Tax treaty rules between country pairs (US, NZ, AU, UK). Stores articles and withholding rates.';

CREATE INDEX idx_acct_tax_treaties_countries ON acct_tax_treaties (country_a, country_b);

-- ============================================================================
-- 15. acct_treaty_applications
-- Records where a tax treaty benefit has been applied to a specific
-- transaction, tracking original vs treaty rates and savings.
-- ============================================================================
CREATE TABLE acct_treaty_applications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    treaty_id       UUID NOT NULL REFERENCES acct_tax_treaties(id) ON DELETE RESTRICT,
    transaction_id  UUID NOT NULL,
    benefit_type    VARCHAR(50) NOT NULL,
    original_rate   NUMERIC(5, 4) NOT NULL,
    treaty_rate     NUMERIC(5, 4) NOT NULL,
    savings_amount  NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status          VARCHAR(15) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'applied', 'revoked', 'expired')),
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_treaty_applications IS
    'Applied treaty benefits on transactions. Tracks original vs treaty rates and savings.';

CREATE INDEX idx_acct_treaty_applications_org_id ON acct_treaty_applications (org_id);
CREATE INDEX idx_acct_treaty_applications_treaty_id ON acct_treaty_applications (treaty_id);
CREATE INDEX idx_acct_treaty_applications_status ON acct_treaty_applications (org_id, status);

-- ============================================================================
-- 16. acct_exchange_rates
-- Daily currency exchange rates. Used to convert multi-currency transactions
-- and revalue foreign-denominated balances at period end.
-- ============================================================================
CREATE TABLE acct_exchange_rates (
    base_currency   VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    rate            NUMERIC(12, 6) NOT NULL,
    rate_date       DATE NOT NULL,
    source          VARCHAR(50) NOT NULL DEFAULT 'ecb',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (base_currency, target_currency, rate_date)
);

COMMENT ON TABLE acct_exchange_rates IS
    'Daily exchange rates for multi-currency conversion and period-end revaluation.';

CREATE INDEX idx_acct_exchange_rates_date ON acct_exchange_rates (rate_date);

-- ============================================================================
-- 17. acct_documents
-- Document storage references (receipts, invoices, contracts). Files stored
-- externally (S3/R2); this table holds metadata and AI-extracted data.
-- ============================================================================
CREATE TABLE acct_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id              UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    document_type       VARCHAR(30) NOT NULL,
    filename            TEXT NOT NULL,
    storage_key         TEXT NOT NULL,
    mime_type           VARCHAR(100),
    ai_extracted_data   JSONB NOT NULL DEFAULT '{}',
    data                JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_documents IS
    'Document metadata and AI-extracted data. Actual files stored externally (S3/R2).';

CREATE INDEX idx_acct_documents_org_id ON acct_documents (org_id);

-- ============================================================================
-- 18. acct_audit_log
-- Immutable audit trail. Records every significant action taken within the
-- platform. No UPDATE or DELETE should ever be performed on this table.
-- ============================================================================
CREATE TABLE acct_audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID REFERENCES acct_organizations(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES acct_users(id) ON DELETE SET NULL,
    action          VARCHAR(50) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID,
    changes         JSONB NOT NULL DEFAULT '{}',
    ip_address      INET,
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_audit_log IS
    'Immutable audit trail. Records every significant action. Never update or delete rows.';

CREATE INDEX idx_acct_audit_log_org_id ON acct_audit_log (org_id);
CREATE INDEX idx_acct_audit_log_user_id ON acct_audit_log (user_id);
CREATE INDEX idx_acct_audit_log_entity ON acct_audit_log (entity_type, entity_id);
CREATE INDEX idx_acct_audit_log_created_at ON acct_audit_log (created_at);

-- ============================================================================
-- 19. acct_ai_conversations
-- AI chat history. Stores conversation messages and context for the AI
-- accounting assistant feature. Enables continuity across sessions.
-- ============================================================================
CREATE TABLE acct_ai_conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES acct_users(id) ON DELETE CASCADE,
    messages        JSONB NOT NULL DEFAULT '[]',
    context         JSONB NOT NULL DEFAULT '{}',
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_ai_conversations IS
    'AI assistant chat history. Stores messages and context for session continuity.';

CREATE INDEX idx_acct_ai_conversations_org_id ON acct_ai_conversations (org_id);
CREATE INDEX idx_acct_ai_conversations_user_id ON acct_ai_conversations (user_id);

-- ============================================================================
-- 20. acct_compliance_checks
-- Compliance validation results. The platform runs automated checks against
-- jurisdiction-specific rules (e.g. GST filing deadlines, VAT thresholds).
-- ============================================================================
CREATE TABLE acct_compliance_checks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    check_type      VARCHAR(50) NOT NULL,
    jurisdiction    VARCHAR(2) NOT NULL CHECK (jurisdiction IN ('US', 'NZ', 'AU', 'UK')),
    status          VARCHAR(10) NOT NULL DEFAULT 'pass'
                    CHECK (status IN ('pass', 'warning', 'fail')),
    details         JSONB NOT NULL DEFAULT '{}',
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_compliance_checks IS
    'Automated compliance validation results per jurisdiction (filing deadlines, thresholds, etc.).';

CREATE INDEX idx_acct_compliance_checks_org_id ON acct_compliance_checks (org_id);
CREATE INDEX idx_acct_compliance_checks_jurisdiction ON acct_compliance_checks (org_id, jurisdiction);
CREATE INDEX idx_acct_compliance_checks_status ON acct_compliance_checks (org_id, status);

-- ============================================================================
-- 21. acct_budgets
-- Budget tracking per organization and fiscal year. Account-level budgets
-- stored as JSONB for flexibility (monthly/quarterly breakdowns).
-- ============================================================================
CREATE TABLE acct_budgets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    fiscal_year     INTEGER NOT NULL,
    accounts        JSONB NOT NULL DEFAULT '{}',
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_budgets IS
    'Budget tracking per fiscal year. Account-level budgets with monthly/quarterly breakdowns.';

CREATE INDEX idx_acct_budgets_org_id ON acct_budgets (org_id);
CREATE INDEX idx_acct_budgets_fiscal_year ON acct_budgets (org_id, fiscal_year);

-- ============================================================================
-- 22. acct_reconciliations
-- Bank reconciliation sessions. Tracks the process of matching bank
-- transactions against journal entries for a given period.
-- ============================================================================
CREATE TABLE acct_reconciliations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES acct_bank_accounts(id) ON DELETE CASCADE,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    status          VARCHAR(15) NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    closing_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    data            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_reconciliations IS
    'Bank reconciliation sessions. Matches bank transactions to journal entries for a period.';

CREATE INDEX idx_acct_reconciliations_org_id ON acct_reconciliations (org_id);
CREATE INDEX idx_acct_reconciliations_bank_account_id ON acct_reconciliations (bank_account_id);
CREATE INDEX idx_acct_reconciliations_status ON acct_reconciliations (org_id, status);

-- ============================================================================
-- 23. acct_subscriptions
-- SaaS subscription management. Tracks each org's plan, billing status,
-- and Stripe subscription reference.
-- ============================================================================
CREATE TABLE acct_subscriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id                  UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    plan                    VARCHAR(20) NOT NULL DEFAULT 'free'
                            CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
    status                  VARCHAR(15) NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
    stripe_subscription_id  TEXT,
    data                    JSONB NOT NULL DEFAULT '{}',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_subscriptions IS
    'SaaS subscription management. Tracks plan, billing status, and Stripe reference.';

CREATE INDEX idx_acct_subscriptions_org_id ON acct_subscriptions (org_id);
CREATE INDEX idx_acct_subscriptions_status ON acct_subscriptions (status);

-- ============================================================================
-- 24. acct_reports_cache
-- Cached financial reports (P&L, balance sheet, trial balance, etc.).
-- Avoids recomputing expensive reports on every request.
-- ============================================================================
CREATE TABLE acct_reports_cache (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES acct_organizations(id) ON DELETE CASCADE,
    report_type     VARCHAR(50) NOT NULL,
    parameters      JSONB NOT NULL DEFAULT '{}',
    result          JSONB NOT NULL DEFAULT '{}',
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE acct_reports_cache IS
    'Cached financial reports (P&L, balance sheet, etc.) to avoid expensive recomputation.';

CREATE INDEX idx_acct_reports_cache_org_id ON acct_reports_cache (org_id);
CREATE INDEX idx_acct_reports_cache_type ON acct_reports_cache (org_id, report_type);
CREATE INDEX idx_acct_reports_cache_expires_at ON acct_reports_cache (expires_at);

-- ============================================================================
-- Trigger function: auto-update updated_at on row modification
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all acct_ tables
-- ============================================================================
-- Password Reset Tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS acct_password_reset_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES acct_users(id) ON DELETE CASCADE,
    token           TEXT NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_acct_password_reset_tokens_token ON acct_password_reset_tokens (token);

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name LIKE 'acct_%'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW
             EXECUTE FUNCTION update_updated_at_column()',
            tbl, tbl
        );
    END LOOP;
END;
$$;
