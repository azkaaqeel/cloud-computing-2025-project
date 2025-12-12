-- Add HR Review Columns to Applications Table
-- Run this script to add columns for tracking HR reviews

-- Add ReviewedBy column (HR email who reviewed)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Applications' AND COLUMN_NAME = 'ReviewedBy'
)
BEGIN
    ALTER TABLE Applications
    ADD ReviewedBy NVARCHAR(256) NULL;
    PRINT 'Column ReviewedBy added successfully';
END
ELSE
BEGIN
    PRINT 'Column ReviewedBy already exists';
END
GO

-- Add ReviewedAt column (when the review happened)
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Applications' AND COLUMN_NAME = 'ReviewedAt'
)
BEGIN
    ALTER TABLE Applications
    ADD ReviewedAt DATETIME2 NULL;
    PRINT 'Column ReviewedAt added successfully';
END
ELSE
BEGIN
    PRINT 'Column ReviewedAt already exists';
END
GO

-- Update Status column to ensure it supports Approved/Rejected values
-- (This is just a comment - the column already exists with NVARCHAR(50))
-- Valid values: 'Pending', 'Approved', 'Rejected'

-- Verify the changes
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Applications'
AND COLUMN_NAME IN ('Status', 'ReviewedBy', 'ReviewedAt')
ORDER BY COLUMN_NAME;

PRINT 'Migration completed successfully!';
