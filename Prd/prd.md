# API Usage & BYOK OpenAI Integration

## 1. Overview

Implement a dedicated **API Usage** page in the job portal application.

The application follows a **BYOK (Bring Your Own Key)** model:

- Users provide their own OpenAI API key.
- AI features use the user's configured OpenAI API key.
- The application tracks OpenAI token consumption.
- Usage is tracked by:
  - Date
  - AI feature
  - Model
  - Input tokens
  - Output tokens
  - Total tokens
- API key management and usage analytics live entirely inside a dedicated **API Usage** page.
- The system must remain minimal and easy to understand.
- Do not build a large analytics dashboard.

The main purpose is to give users transparency over how much of their own OpenAI API quota they are consuming.

---

# 2. Goals

## Primary Goals

1. Allow a user to connect their own OpenAI API key.
2. Validate the API key before activating it.
3. Securely store the API key.
4. Use the user's API key for AI functionality.
5. Track token usage for every OpenAI request.
6. Associate every usage event with a specific AI feature.
7. Display usage by date.
8. Display usage by feature.
9. Display total input/output/combined tokens.
10. Allow users to replace their API key.
11. Allow users to delete their API key.
12. When an API key is deleted, remove all usage associated with that key.
13. When a new API key is connected, usage starts from zero for that key.
14. Keep the UI minimal and consistent with the existing product.

---

# 3. Non-Goals

Do NOT implement the following in the first version:

- Billing OpenAI users.
- Charging users.
- Complex cost analytics.
- OpenAI account balance retrieval.
- Full OpenAI organization management.
- Prompt history.
- Response history.
- Token-by-token logs.
- Large analytics dashboards.
- Complex charts.
- Export to CSV.
- Multiple providers.
- Automatic API key rotation.
- OpenAI API key sharing between users.

The first version should focus only on:

**Connect key → use AI → track usage → show usage → replace/delete key.**

---

# 4. User Experience

## 4.1 Navigation

Add a dedicated navigation item:

**API Usage**

It should NOT be placed inside Settings.

Example sidebar:

```text
Dashboard
Jobs
Resume
Applications
...
API Usage
Settings
```

Clicking **API Usage** opens:

```text
/api-usage
```

Use the application's existing routing conventions if different.

---

# 5. API Usage Page States

The page has three primary states:

1. No API key connected
2. API key connected with usage
3. API key connected with zero usage

---

# 6. State 1 — No API Key

When the user has never connected an OpenAI API key, show a clean empty state.

Example:

```text
API Usage

Connect your OpenAI API key

Use your own OpenAI API key to power
AI features in your account.

Your API key is securely stored and is
never exposed in the client.

[ Enter API Key ]

[ Connect API Key ]
```

The design should be minimal.

Do not show usage metrics because there is no active API key.

---

# 7. API Key Input

The API key input should:

- Use password-style masking.
- Allow the user to reveal/hide the key.
- Never display the full key after saving.
- Never expose the key through client-side API responses.
- Never log the key.
- Never include the key in analytics.
- Never store the raw key in browser localStorage.
- Never store the raw key in sessionStorage.

Example:

```text
OpenAI API Key

┌─────────────────────────────────────┐
│ sk-••••••••••••••••••••••••••••     │
└─────────────────────────────────────┘

              [ Connect ]
```

---

# 8. API Key Validation

When the user clicks **Connect API Key**:

### Step 1

Validate the input format on the client for basic UX.

### Step 2

Send the key securely to the backend over HTTPS.

### Step 3

Backend validates the key with OpenAI.

### Step 4

If valid:

- Encrypt the key.
- Store the encrypted key.
- Mark it as active.
- Create the API key record.
- Redirect/refresh API Usage page.
- Show connected state.

### Step 5

If invalid:

Show:

```text
Unable to connect this API key.

Please check your OpenAI API key and try again.
```

Do not expose raw OpenAI errors to the user unless they are safe and useful.

---

# 9. Connected State

Once an API key is connected, the page should look approximately like:

```text
API Usage

OpenAI API

Connected
••••••••••••7F3A

[ Change API Key ]    [ Delete ]

────────────────────────────

Usage

12,450
Total tokens

Input
8,200

Output
4,250

────────────────────────────

Usage by feature

Resume Tailor       5,200
Job Analyze         3,100
Resume Match        2,450
Cover Letter        1,700

────────────────────────────

Usage history

Today

Resume Tailor       2,100
Job Analyze         1,400

Aug 12

Resume Tailor       2,600
Resume Match        2,450
```

The exact visual design should follow the existing application's design system.

---

# 10. API Key Display

Never display the full API key.

Store enough metadata to show a masked identifier.

Example:

```text
••••••••••••7F3A
```

The final characters should only be displayed if they are available from the stored key metadata.

Do NOT decrypt the key merely to display it.

---

# 11. Change API Key

The user should be able to replace their current API key.

Flow:

```text
Current API Key
      ↓
Change API Key
      ↓
Enter new key
      ↓
Validate new key
      ↓
Confirm replacement
      ↓
Create new active key
      ↓
Old key becomes inactive/deleted
      ↓
New key usage starts from 0
```

Recommended confirmation:

```text
Replace API key?

Your current API key and its usage history
will be removed.

[ Cancel ] [ Replace API Key ]
```

For the first version, replacing the API key should reset usage because usage is intentionally scoped to the connected key.

---

# 12. Delete API Key

Provide:

```text
[ Delete API Key ]
```

When clicked, show a confirmation modal.

Example:

```text
Delete OpenAI API key?

This will:

• Disconnect your OpenAI API key
• Delete usage history associated with this key
• Disable AI features until another key is connected

This action cannot be undone.

[ Cancel ] [ Delete API Key ]
```

After confirmation:

1. Delete the API key.
2. Delete all usage records associated with that key.
3. Invalidate any cached/decrypted key.
4. Ensure the AI features can no longer use the deleted key.
5. Return the API Usage page to the empty state.

Usage should display:

```text
No API key connected
```

---

# 13. Usage Tracking

Every OpenAI API request must generate a usage event.

The application must use the actual usage information returned by OpenAI.

Do NOT estimate token usage using:

- character count
- word count
- prompt length
- client-side token estimation

Use the usage metadata returned by the OpenAI API response.

---

# 14. AI Feature Identification

Every AI request must specify the feature that initiated it.

Create a centralized feature enum.

Recommended values:

```text
RESUME_TAILOR
JOB_ANALYZE
RESUME_MATCH
COVER_LETTER
AI_INTERVIEW
```

The architecture should allow additional features to be added later.

Example:

```ts
type AIFeature = 'RESUME_TAILOR' | 'JOB_ANALYZE' | 'RESUME_MATCH' | 'COVER_LETTER' | 'AI_INTERVIEW'
```

Do not rely on manually typed arbitrary strings throughout the codebase.

---

# 15. Centralized AI Service

Do NOT implement OpenAI usage tracking separately inside every feature.

Create a centralized AI service/wrapper.

Conceptually:

```text
Resume Tailor
      ↓
AI Service
      ↓
OpenAI
      ↓
usage metadata
      ↓
Usage Tracker
```

Every AI feature should call the same service.

Example conceptual API:

```ts
generateAIResponse({
  userId,
  feature: 'RESUME_TAILOR',
  model,
  input
})
```

The service should:

1. Find the user's active OpenAI API key.
2. Decrypt the key server-side.
3. Create the OpenAI client.
4. Make the request.
5. Read usage metadata.
6. Persist the usage event.
7. Return the AI response to the calling feature.

---

# 16. Usage Tracking Function

Create a reusable function/service similar to:

```ts
trackAIUsage({
  openAIKeyId,
  feature,
  model,
  usage
})
```

The function should extract:

```text
inputTokens
outputTokens
totalTokens
```

from the OpenAI response.

Then insert one usage record.

---

# 17. Database Design

Use the application's existing database and ORM conventions.

If Prisma is being used, the conceptual schema should be:

```prisma
model OpenAIKey {
  id             String      @id @default(cuid())
  userId         String
  encryptedKey   String
  keyLast4       String?
  isActive       Boolean     @default(true)
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  usages         AIUsage[]

  @@index([userId])
}

model AIUsage {
  id            String      @id @default(cuid())
  openAIKeyId   String
  feature       AIFeature
  model         String
  inputTokens   Int         @default(0)
  outputTokens  Int         @default(0)
  totalTokens   Int         @default(0)
  createdAt     DateTime    @default(now())

  openAIKey     OpenAIKey   @relation(
    fields: [openAIKeyId],
    references: [id],
    onDelete: Cascade
  )

  @@index([openAIKeyId])
  @@index([createdAt])
  @@index([feature])
}

enum AIFeature {
  RESUME_TAILOR
  JOB_ANALYZE
  RESUME_MATCH
  COVER_LETTER
  AI_INTERVIEW
}
```

Adapt names and types to the existing project's schema.

Do not blindly replace the project's existing schema.

---

# 18. Data Relationship

The relationship should be:

```text
User
 │
 └── OpenAIKey
       │
       ├── AIUsage
       ├── AIUsage
       ├── AIUsage
       └── AIUsage
```

This means usage is scoped to the specific API key.

---

# 19. Cascade Deletion

The API key should have a cascading relationship to usage records.

When:

```text
OpenAIKey deleted
```

automatically:

```text
AIUsage records deleted
```

This guarantees that stale usage does not remain after the API key is removed.

Also perform explicit application-level cleanup if required by the existing architecture.

---

# 20. Usage Queries

The API Usage backend should expose aggregated data rather than sending every raw usage event to the frontend.

For example:

```text
GET /api/api-usage
```

Response concept:

```json
{
  "connected": true,
  "apiKey": {
    "last4": "7F3A"
  },
  "summary": {
    "inputTokens": 8200,
    "outputTokens": 4250,
    "totalTokens": 12450
  },
  "byFeature": [
    {
      "feature": "RESUME_TAILOR",
      "totalTokens": 5200
    },
    {
      "feature": "JOB_ANALYZE",
      "totalTokens": 3100
    }
  ],
  "history": [
    {
      "date": "2026-08-13",
      "feature": "RESUME_TAILOR",
      "totalTokens": 2100
    }
  ]
}
```

Do not expose:

- encrypted key
- decrypted key
- raw API key
- internal secrets

---

# 21. Date-Wise Usage

Usage history should be grouped by date.

Example:

```text
Today
Resume Tailor       2,100
Job Analyze         1,400

Aug 12
Resume Tailor       2,600
Resume Match        2,450
```

The backend should aggregate usage by:

```text
DATE(createdAt)
+
feature
```

Use the appropriate timezone strategy already used by the application.

Do not blindly use server UTC dates if the product already has a user timezone concept.

---

# 22. Feature-Wise Usage

The page should show a simple feature breakdown.

Example:

```text
Usage by feature

Resume Tailor       5,200
Job Analyze         3,100
Resume Match        2,450
Cover Letter        1,700
```

Sort by highest token usage by default.

Hide features with zero usage.

---

# 23. Summary Metrics

Show three primary metrics:

```text
Total tokens
Input tokens
Output tokens
```

Example:

```text
12,450
Total tokens

8,200
Input

4,250
Output
```

Do not initially show complicated cost calculations.

---

# 24. Date Filters

Keep filters minimal.

Recommended:

```text
[ Today ] [ 7 Days ] [ 30 Days ] [ All ]
```

Alternatively, use:

```text
[ Date range ]
```

Do not build an advanced analytics filter system in V1.

---

# 25. Feature Filter

Optionally provide:

```text
Feature: [ All ▼ ]
```

Options:

```text
All
Resume Tailor
Job Analyze
Resume Match
Cover Letter
AI Interview
```

The combination should allow:

```text
Date range + Feature
```

Example:

```text
Last 7 days
Feature: Resume Tailor
```

Then show only Resume Tailor usage.

---

# 26. Reset Usage

Do NOT create a separate reset button in V1.

Usage resets naturally when the user:

1. Deletes the API key.
2. Connects a new API key.

This keeps the mental model simple:

```text
API Key = Usage Account
```

If a manual reset is required in the future, it can be added later.

---

# 27. Multiple API Keys

V1 should support only:

**One active OpenAI API key per user.**

Do not build multi-key management.

If the user adds another key:

```text
Current key
      ↓
Validate new key
      ↓
Replace current key
      ↓
Old usage deleted
      ↓
New key starts at 0
```

---

# 28. Security Requirements

This is a critical part of the implementation.

## Never:

- Store raw API keys in plaintext.
- Return API keys to the frontend.
- Log API keys.
- Include API keys in error messages.
- Store keys in localStorage.
- Store keys in sessionStorage.
- Include keys in analytics events.
- Send API keys to third-party services.

## Must:

- Encrypt API keys at rest.
- Decrypt only on the server.
- Use HTTPS.
- Authenticate every API Usage endpoint.
- Verify the current user owns the API key.
- Never allow a user to query another user's usage.
- Never allow a user to delete another user's key.
- Never allow a user to use another user's API key.

---

# 29. Encryption

Use the project's existing encryption/security infrastructure if available.

If none exists, implement server-side authenticated encryption using a strong modern encryption scheme such as AES-256-GCM.

The encryption secret must come from an environment variable.

Example:

```env
OPENAI_API_KEY_ENCRYPTION_SECRET=...
```

Never commit this secret to Git.

The application must fail safely if the encryption secret is missing.

---

# 30. API Key Lifecycle

### Create

```text
User enters key
↓
Validate
↓
Encrypt
↓
Store
↓
Set active
```

### Use

```text
AI request
↓
Load active key
↓
Decrypt server-side
↓
OpenAI request
↓
Track usage
```

### Replace

```text
Validate new key
↓
Delete old key
↓
Cascade delete old usage
↓
Create new key
```

### Delete

```text
Delete key
↓
Cascade delete usage
↓
AI features become unavailable
```

---

# 31. Handling Missing API Key

If an AI feature requires OpenAI but the user has no connected key:

Do not attempt the request.

Show a useful UI message:

```text
Connect your OpenAI API key to use this feature.

[ Go to API Usage ]
```

The CTA should navigate directly to the API Usage page.

---

# 32. Handling Invalid/Revoked Keys

If OpenAI returns an authentication error during normal usage:

Show:

```text
Your OpenAI API key appears to be invalid or unavailable.

Please check your API key in API Usage.
```

Do not automatically delete the key.

Mark the key as requiring attention if the existing architecture supports this.

---

# 33. Handling OpenAI Errors

Usage tracking should not break the AI feature unnecessarily.

If an OpenAI request fails before a valid usage object is returned:

- Do not create a fake usage record.
- Do not estimate tokens.
- Return the appropriate application error.

If OpenAI returns a valid usage object with a response, persist it.

---

# 34. Usage Tracking Failure

If the OpenAI request succeeds but usage persistence fails:

The application should log the tracking failure server-side.

Do not expose internal database errors to the user.

Preferably:

```text
OpenAI request succeeds
        ↓
AI response returned
        ↓
Usage persistence attempted
        ↓
Failure logged/retried if architecture supports it
```

The user should still receive the successful AI result.

However, make the usage tracking reliable enough that this case is rare.

---

# 35. API Usage Backend Endpoints

Implement endpoints according to the project's existing API architecture.

Conceptually:

### Get API usage

```text
GET /api/api-usage
```

Returns:

- connection status
- masked API key information
- summary
- feature breakdown
- date history

### Connect API key

```text
POST /api/api-usage/key
```

Input:

```json
{
  "apiKey": "..."
}
```

### Replace API key

```text
PUT /api/api-usage/key
```

Input:

```json
{
  "apiKey": "..."
}
```

### Delete API key

```text
DELETE /api/api-usage/key
```

All endpoints must authenticate the current user.

Adapt the endpoint naming to the project's existing conventions.

---

# 36. Frontend Components

Create reusable components rather than putting everything into one page.

Suggested structure:

```text
ApiUsagePage
├── ApiKeySection
│   ├── ApiKeyStatus
│   ├── ApiKeyInput
│   └── ApiKeyActions
│
├── UsageSummary
│   ├── TotalTokens
│   ├── InputTokens
│   └── OutputTokens
│
├── FeatureUsage
│
├── UsageFilters
│
└── UsageHistory
```

Also create:

```text
DeleteApiKeyDialog
ReplaceApiKeyDialog
```

if the application's component architecture supports it.

---

# 37. Loading States

Use the application's existing skeleton/loading system.

Avoid blank screens.

Examples:

```text
API Usage

[Loading key status...]

[Loading usage...]
```

---

# 38. Empty Usage State

If the API key exists but no AI requests have been made:

```text
Usage

0 tokens

No AI usage yet.

Use Resume Tailor, Job Analyze,
or another AI feature to see usage here.
```

---

# 39. Error States

If usage cannot be loaded:

```text
Unable to load API usage.

[ Try Again ]
```

If API key validation fails:

```text
Invalid API key.
Please check your key and try again.
```

If deletion fails:

```text
Unable to delete API key.

Please try again.
```

Use concise messages.

---

# 40. Cost Calculation

Do not make cost the primary feature in V1.

The user's OpenAI pricing can vary by model and may change over time.

If estimated cost is added later, it must be calculated using model-specific pricing and clearly labeled:

```text
Estimated cost
```

Never represent an internally calculated amount as an exact OpenAI bill.

For V1:

**tokens are the source of truth.**

---

# 41. Model Tracking

Every usage event should store the model used:

```text
model
```

Example:

```text
gpt-5-mini
```

This is important for future reporting.

The UI does not need to display model information initially.

---

# 42. Performance

The API Usage page should not load every raw usage event if the user has a large history.

Use database aggregation where possible.

For example:

```text
SUM(totalTokens)
GROUP BY feature
GROUP BY date
```

Use pagination for detailed history if necessary.

Do not transfer unnecessary raw records to the browser.

---

# 43. Indexing

At minimum, index:

```text
OpenAIKey.userId

AIUsage.openAIKeyId

AIUsage.createdAt

AIUsage.feature
```

This will keep usage queries efficient as the number of AI requests grows.

---

# 44. Timezone

Usage dates must be displayed according to the application's established user timezone.

If the application does not currently support user timezones:

- Store `createdAt` in UTC.
- Convert to the user's timezone at presentation/aggregation time.
- Do not permanently store a derived local date as the only source of truth.

---

# 45. Existing AI Features Integration

All existing AI features should be migrated to the centralized AI service.

At minimum, identify and integrate:

```text
Resume Tailor
Job Analyze
Resume Match
Cover Letter
AI Interview
```

If the application has additional AI features, add them to the `AIFeature` enum and route them through the same usage tracker.

---

# 46. Important Architecture Rule

Do not allow individual AI features to directly manage API keys.

Bad:

```text
Resume Tailor
 ├── get API key
 ├── call OpenAI
 └── save usage
```

Bad:

```text
Job Analyze
 ├── get API key
 ├── call OpenAI
 └── save usage
```

Instead:

```text
Resume Tailor ─┐
Job Analyze ───┤
Resume Match ──┤
Interview ─────┤
               ↓
          AI Service
               ↓
       API Key Manager
               ↓
             OpenAI
               ↓
        Usage Tracker
```

This is the preferred architecture.

---

# 47. Transactional Behavior

When replacing an API key:

Do not delete the existing key before validating the new key.

Correct:

```text
Enter new key
      ↓
Validate new key
      ↓
Validation successful
      ↓
Create new key
      ↓
Delete old key
      ↓
Old usage deleted
```

If validation fails:

```text
Old key remains untouched.
```

This prevents users from accidentally losing a working configuration.

---

# 48. User Ownership

Every API Usage operation must be scoped to the authenticated user.

Example:

```ts
where: {
  userId: currentUser.id
}
```

Never trust a `userId` supplied by the frontend.

Use the authenticated session/user identity.

---

# 49. Testing Requirements

Implement tests for:

### API key

- Connect valid key.
- Reject invalid key.
- Encrypt key before storage.
- Never return raw key.
- Show masked key.
- Replace key.
- Delete key.
- Ensure deleted key cannot be used.

### Usage

- Record successful OpenAI request.
- Correctly save input tokens.
- Correctly save output tokens.
- Correctly save total tokens.
- Correctly save feature.
- Correctly save model.
- Correctly save timestamp.
- Aggregate usage by feature.
- Aggregate usage by date.
- Return zero usage for a new key.

### Security

- User cannot access another user's key.
- User cannot access another user's usage.
- User cannot delete another user's key.
- API key never appears in frontend response.
- API key never appears in logs.

### Failure cases

- OpenAI authentication failure.
- OpenAI rate limit.
- OpenAI request failure.
- Database usage tracking failure.
- Missing encryption secret.
- Missing API key.

---

# 50. Acceptance Criteria

The implementation is complete when all of the following are true:

- [ ] API Usage exists as a dedicated navigation/page.
- [ ] User can connect an OpenAI API key.
- [ ] API key is validated before activation.
- [ ] API key is encrypted at rest.
- [ ] Raw API key is never returned to frontend.
- [ ] User sees only a masked version of their key.
- [ ] AI features use the user's active API key.
- [ ] Every successful OpenAI request records usage.
- [ ] Usage records contain feature.
- [ ] Usage records contain model.
- [ ] Usage records contain input tokens.
- [ ] Usage records contain output tokens.
- [ ] Usage records contain total tokens.
- [ ] Usage records contain timestamp.
- [ ] Usage can be viewed by date.
- [ ] Usage can be viewed by feature.
- [ ] Total/input/output tokens are displayed.
- [ ] User can filter usage by date.
- [ ] User can filter usage by feature.
- [ ] User can replace their API key.
- [ ] New API key starts with zero usage.
- [ ] Old key usage is removed when replaced.
- [ ] User can delete their API key.
- [ ] Deleting the key deletes associated usage.
- [ ] AI features stop working when no API key exists.
- [ ] AI features direct the user to API Usage when no key exists.
- [ ] No raw API key is stored in browser storage.
- [ ] No raw API key is logged.
- [ ] Users cannot access other users' keys or usage.
- [ ] The implementation follows the existing project's architecture and UI system.
- [ ] No unnecessary analytics/dashboard complexity is introduced.

---

# 51. Implementation Order for Cursor

Implement this feature in the following order.

## Phase 1 — Inspect Existing Project

Before changing code:

1. Inspect the existing authentication system.
2. Identify the current user/session model.
3. Identify the database and ORM.
4. Identify existing OpenAI integrations.
5. Identify all existing AI features.
6. Identify the existing API/server architecture.
7. Identify the existing UI component system.
8. Identify the existing sidebar/navigation structure.
9. Identify existing encryption/security utilities.
10. Identify existing environment variable conventions.

Do not replace existing architecture unnecessarily.

---

## Phase 2 — Database

Implement:

```text
OpenAIKey
AIUsage
AIFeature
```

Add appropriate relations, indexes, and cascade deletion.

Run the migration.

---

## Phase 3 — Secure API Key Service

Create a server-side API key service responsible for:

- encryption
- decryption
- validation
- creation
- replacement
- deletion
- active-key retrieval

Do not expose decryption functionality to the client.

---

## Phase 4 — Central AI Service

Create/modify the existing AI abstraction so all OpenAI calls can:

```text
retrieve active key
→ create OpenAI client
→ call model
→ capture usage
→ save usage
→ return result
```

Keep the feature identifier explicit.

---

## Phase 5 — Migrate AI Features

Update each existing AI feature to use the centralized service.

For example:

```text
Resume Tailor → RESUME_TAILOR

Job Analyze → JOB_ANALYZE

Resume Match → RESUME_MATCH

Cover Letter → COVER_LETTER

AI Interview → AI_INTERVIEW
```

Do not duplicate usage tracking logic.

---

## Phase 6 — API Routes

Implement secure backend routes for:

```text
GET usage
POST key
PUT key
DELETE key
```

Follow existing project conventions.

---

## Phase 7 — API Usage Page

Build the dedicated page.

Implement:

1. Empty state.
2. Connected state.
3. Usage summary.
4. Feature breakdown.
5. Date history.
6. Filters.
7. Change key.
8. Delete key.
9. Loading states.
10. Error states.

---

## Phase 8 — Navigation

Add:

```text
API Usage
```

to the main navigation/sidebar.

Do not put it under Settings.

---

## Phase 9 — Testing

Run:

- Type checking.
- Linting.
- Unit tests.
- Integration tests.
- Database migration verification.
- Authentication/security checks.

Manually verify the complete user journey.

---

# 52. Complete User Journey

### First-time user

```text
User opens application
        ↓
Clicks API Usage
        ↓
No API key connected
        ↓
Enters OpenAI API key
        ↓
Backend validates key
        ↓
Key encrypted and stored
        ↓
API Usage shows Connected
        ↓
User uses Resume Tailor
        ↓
OpenAI request succeeds
        ↓
usage returned
        ↓
AIUsage record created
        ↓
API Usage updates
```

### After multiple AI requests

```text
API Usage

12,450 tokens

Resume Tailor       5,200
Job Analyze         3,100
Resume Match        2,450
Cover Letter        1,700

Today
  Resume Tailor     2,100
  Job Analyze       1,400

Aug 12
  Resume Tailor     2,600
  Resume Match      2,450
```

### User replaces key

```text
Change API Key
      ↓
Enter new key
      ↓
Validate
      ↓
Success
      ↓
Old key + old usage deleted
      ↓
New key active
      ↓
Usage = 0
```

### User deletes key

```text
Delete API Key
      ↓
Confirm
      ↓
Key deleted
      ↓
Usage deleted
      ↓
AI features disabled
      ↓
API Usage empty state
```

---

# 53. Final Product Principle

The entire feature should follow one simple mental model:

> **Your OpenAI API key powers your AI features, and API Usage shows exactly how many tokens those features consume.**

Keep the UI minimal.

Do not turn this into a complex analytics product.

The important engineering characteristics are:

**BYOK + secure key storage + centralized AI service + feature-level usage tracking + date-level usage tracking + clean key lifecycle.**
