-- Fix 1: Add original_balance to accounts so loans can track starting amount
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS original_balance DECIMAL(20,2) DEFAULT NULL;

-- Fix 2: Rewrite update_account_balance to handle transfers correctly for liability accounts.
-- When money is transferred TO a loan/credit_card, the debt decreases (balance goes down).
-- Previously the trigger always did balance + amount for to_account, which was wrong for liabilities.
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
DECLARE
  to_account_type TEXT;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    IF NEW.type = 'income' OR NEW.type = 'refund' THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transfer' THEN
      -- Debit the source account
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      -- Credit the destination account — but for liabilities (loan/credit_card) a payment
      -- REDUCES the outstanding balance, so we subtract instead of add.
      IF NEW.to_account_id IS NOT NULL THEN
        SELECT type INTO to_account_type FROM accounts WHERE id = NEW.to_account_id;
        IF to_account_type IN ('loan', 'credit_card') THEN
          UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.to_account_id;
        ELSE
          UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
        END IF;
      END IF;
    END IF;

  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
    IF OLD.type = 'income' OR OLD.type = 'refund' THEN
      UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transfer' THEN
      -- Reverse the source debit
      UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      -- Reverse the destination credit (mirror of insert logic)
      IF OLD.to_account_id IS NOT NULL THEN
        SELECT type INTO to_account_type FROM accounts WHERE id = OLD.to_account_id;
        IF to_account_type IN ('loan', 'credit_card') THEN
          UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.to_account_id;
        ELSE
          UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
