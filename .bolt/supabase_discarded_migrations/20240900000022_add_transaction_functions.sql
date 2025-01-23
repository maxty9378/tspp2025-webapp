-- Add transaction helper functions
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE 'BEGIN';
END;
$$;

CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE 'COMMIT';
END;
$$;

CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE 'ROLLBACK';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION begin_transaction() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION commit_transaction() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rollback_transaction() TO anon, authenticated;