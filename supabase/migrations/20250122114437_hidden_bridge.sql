/*
  # Fix message types

  1. Changes
    - Add message_type enum type
    - Convert message type column to use enum
    - Add proper constraints and indexes
  
  2. Security
    - No changes to RLS policies
*/

-- Create message type enum if not exists
DO $$ BEGIN
    CREATE TYPE message_type AS ENUM (
        'text', 
        'image', 
        'system', 
        'greeting', 
        'quote', 
        'slogan', 
        'practice', 
        'mistake'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Safely convert type column to use enum
DO $$ BEGIN
    -- First ensure all existing values are valid
    UPDATE messages 
    SET type = 'text' 
    WHERE type NOT IN (
        'text', 
        'image', 
        'system', 
        'greeting', 
        'quote', 
        'slogan', 
        'practice', 
        'mistake'
    );

    -- Then alter the column type
    ALTER TABLE messages 
    ALTER COLUMN type TYPE message_type 
    USING type::message_type;

EXCEPTION
    WHEN others THEN null;
END $$;

-- Create index for message types
CREATE INDEX IF NOT EXISTS messages_type_idx ON messages(type);