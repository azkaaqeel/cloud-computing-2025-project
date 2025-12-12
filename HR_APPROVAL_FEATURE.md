# HR Approval/Disapproval Feature

## Overview

Added functionality for HR to approve or reject candidate applications directly from the HR portal.

## Database Changes

### New Columns Added

1. **ReviewedBy** (NVARCHAR(256))
   - Stores the email of the HR person who reviewed the application
   - NULL if not yet reviewed

2. **ReviewedAt** (DATETIME2)
   - Stores the timestamp when the application was reviewed
   - NULL if not yet reviewed

### Existing Column

- **Status** (NVARCHAR(50))
  - Values: `Pending`, `Approved`, `Rejected`
  - Default: `Pending`

## API Endpoints

### Update Application Status

**Endpoint:** `PATCH /api/applications/:applicationId/status`

**Request Body:**
```json
{
  "status": "Approved" | "Rejected" | "Pending",
  "reviewedBy": "hr@hirehive.com",
  "notes": "Optional notes about the review"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application approved successfully",
  "application": {
    "applicationId": "...",
    "status": "Approved",
    "reviewedBy": "hr@hirehive.com",
    "reviewedAt": "2025-12-13T01:30:00Z",
    ...
  }
}
```

### Get Application by ID

**Endpoint:** `GET /api/applications/:applicationId`

Returns full application details including review information.

## Frontend Changes

### HR Applications Page (`hr/applications.html`)

- Displays all application details including:
  - Candidate information (name, email, phone, CGPA, university, experience)
  - Application status with color-coded badges
  - Review information (who reviewed and when)
  - Resume download link

### Action Buttons

- **Approve Button** (Green)
  - Only shown for `Pending` applications
  - Changes status to `Approved`
  - Records reviewer email and timestamp

- **Reject Button** (Red)
  - Only shown for `Pending` applications
  - Changes status to `Rejected`
  - Records reviewer email and timestamp

- **Reset to Pending Button** (Gray)
  - Shown for `Approved` or `Rejected` applications
  - Allows HR to reset status back to `Pending`

## Usage

1. **HR logs into the portal**
2. **Navigate to Applications** for a specific job
3. **View application details** including candidate information
4. **Click Approve or Reject** button
5. **Confirm the action** in the popup dialog
6. **Status updates immediately** and page refreshes

## Status Values

- **Pending**: Application awaiting HR review (default)
- **Approved**: Application approved by HR
- **Rejected**: Application rejected by HR

## Database Migration

To add the review columns to existing databases, run:

```bash
node add-review-columns.js
```

Or execute the SQL script:

```bash
# Using Azure Portal Query Editor
# Copy and paste contents of add-review-columns.sql
```

## Testing

1. **Submit a test application** through the public form
2. **Login as HR** and navigate to applications
3. **Click Approve** - verify status changes and ReviewedBy/ReviewedAt are set
4. **Click Reject** on another application - verify status changes
5. **Click Reset to Pending** - verify status returns to Pending

## Security Considerations

- Only authenticated HR users can update application status
- Review actions are logged with reviewer email and timestamp
- Status changes require confirmation before applying

## Future Enhancements

- Add notes field for HR comments
- Email notifications to candidates on status change
- Bulk approve/reject functionality
- Filter applications by status
- Export applications report
