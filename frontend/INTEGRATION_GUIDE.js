// ============================================================
// 🎯 WHAT HAS BEEN DONE & HOW TO WORK WITH IT
// ============================================================

/*
════════════════════════════════════════════════════════════
                    WHAT WAS IMPLEMENTED
════════════════════════════════════════════════════════════

4 POWERFUL FEATURES HAVE BEEN BUILT:

1️⃣  FULL LIFECYCLE STATE MANAGEMENT
    "Track where each test case is in its workflow"
    
    ✅ What it does:
       - Create a structured workflow for test cases
       - States: Draft → Ready → In Execution → Completed → Closed → Reopened
       - Track WHO changed state, WHEN, and WHY
       - Prevent invalid state transitions (can't go from Draft directly to Closed)
       - Keep full audit trail for compliance
    
    ✅ Why it's useful:
       - Managers see exactly which tests are ready, executing, or done
       - Prevents accidental state changes (validation enforced)
       - Accountability: know who made every change and why
       - Better planning: know how many tests are in each stage
       - Quality metrics: can measure bottlenecks in workflow
    
    ✅ Database tables:
       - testcase_lifecycle: records every state change
       - Columns: id, testcase_id, state, reason, changed_by, changed_at
       - Audit trail keeps all history forever

    ✅ How to use:
       <LifecycleState 
         testcaseId={testcaseId}
         onStateChange={handleStateChange}
       />
       - Shows current state as a badge
       - Dropdown list shows only VALID next states
       - Requires reason text before change accepted
       - Shows history timeline of all past changes


2️⃣  REOPEN LOGIC
    "Test is closed? Need to test again? Reopen, don't duplicate!"
    
    ✅ What it does:
       - When a test case is Closed, you can Reopen it
       - No data loss - all old comments and commits preserved
       - Tracks HOW MANY times a test was reopened
       - Increment reopen counter each time
       - Useful for regression testing or bug fixes
    
    ✅ Why it's useful:
       - Don't create duplicate test cases
       - All context preserved (comments, linked commits, history)
       - Can measure: "This test gets reopened 5 times → potential issue"
       - Quality Metric: high reopens might indicate unstable feature
       - Historical tracking: why was this test reopened at this date?
    
    ✅ Database tables:
       - testcase_reopen_history: tracks all reopens
       - Columns: testcase_id, reopened_by, reopened_at, reason, previous_state
       - Updates: testcase.reopen_count incremented each time
    
    ✅ How to use:
       - Appears only when test case state is "Closed"
       - User clicks "Reopen" button
       - Modal appears: "This will be reopen #3. Add reason?"
       - Reason required (e.g., "Bug fix in version 2.1")
       - Automatically changes state to "Reopened"
       - Reopen counter badge updates


3️⃣  ENHANCED COMMENTS WITH THREADING
    "Team collaboration - all discussions in one place with full context"
    
    ✅ What it does:
       - Post comments on test cases
       - Reply to comments (threading - replies nest under parent)
       - Add emoji reactions (👍 ❤️ 😂 🎉 🚀 ✨)
       - Pin important comments (stays at top)
       - @mention people (notifications ready)
       - Edit/delete your own comments (5 minute window)
       - Full history of who wrote what and when
    
    ✅ Why it's useful:
       - QA discusses test scenarios without emails
       - Developers understand test requirements from comments
       - Threading keeps conversations organized (not flat list)
       - Pinned comments highlight critical info
       - @mentions ensure right person sees important info
       - All context stays with the test (not scattered emails)
       - Emoji reactions = quick sentiment/approval (👍 means "looks good")
    
    ✅ Database tables:
       - comments: updated with parent_comment_id, is_pinned, execution_id columns
       - comment_reactions: stores emoji reactions (👍, ❤️, etc)
       - comment_mentions: tracks @mentions for notifications
       - Unique constraint: one reaction type per user per comment
    
    ✅ How to use:
       <EnhancedComments testcaseId={testcaseId} />
       - Text area to add new comment
       - Click "Reply" on any comment to thread
       - Click emoji icon to add reaction
       - Click pin icon to pin/unpin comment
       - Click @mention to tag someone
       - Edit/delete buttons appear on your own comments (5 min limit)


4️⃣  COMMIT LINKING
    "Link git commits to test cases - know EXACTLY what code is tested"
    
    ✅ What it does:
       - Link Git commit SHAs to test cases
       - Link commits to execution runs
       - Store commit metadata (author, date, message, repo)
       - Prevent duplicate links (same commit can't be linked twice)
       - Full audit trail: who linked what when
    
    ✅ Why it's useful:
       - Test #50 links to commits a1b2c3d, b2c3d4e → know exact code tested
       - QA checks: "What code does this test validate?"
       - Dev checks: "Which tests validate my code?"
       - Compliance: Full traceability for audits
       - Code Review: Link PR/commit to test case for review
       - Regression: "After commit x, which tests should we run?"
       - Quality: Measure "commit test coverage"
    
    ✅ Database tables:
       - testcase_commits: maps test cases to commits
       - execution_commits: maps execution runs to commits
       - Columns: commit_sha, commit_message, commit_author, commit_date, repository_url
       - Unique constraint: prevents duplicate links
    
    ✅ How to use:
       <CommitLinker testcaseId={testcaseId} />
       - Input form: paste commit SHA (7-40 hex characters)
       - Shows linked commits as cards with metadata
       - Click card to open repo URL in new tab
       - Delete button unlinks commits
       - All links tracked with user and timestamp


════════════════════════════════════════════════════════════
                    HOW TO WORK WITH IT
════════════════════════════════════════════════════════════

STEP 1: START THE BACKEND
─────────────────────────
  cd backend
  node server.js

  ✅ Watch for output:
    ✨ Database connected!
    ✨ Table testcase_lifecycle created
    ✨ Table testcase_reopen_history created
    ✨ Table testcase_commits created
    ✨ Table execution_commits created
    ✨ Table comment_reactions created
    ✨ Table comment_mentions created
    🚀 Server running on port 5000
    ✅ All 19 endpoints loaded successfully

  NOTE: Database tables auto-create on first run. No SQL needed!


STEP 2: START THE FRONTEND
──────────────────────────
  cd frontend
  npm start

  ✅ Should load at http://localhost:3000


STEP 3: INTEGRATE COMPONENTS INTO TESTCASE.JS
──────────────────────────────────────────────
  👇 See "INTEGRATION EXAMPLE" section below
  
  - Copy the import statements
  - Add state variables
  - Add the JSX sections
  - Add CSS styling
  
  Takes 10-15 minutes. All code provided below.


STEP 4: TEST EACH FEATURE
─────────────────────────
  a) Create a test case
  b) Test Lifecycle:
     - Click "Change State" button
     - Select "Ready" from dropdown
     - Add reason: "Ready for execution"
     - Confirm change
     - See state badge update to "Ready"
  
  c) Test Comments:
     - Add a comment: "Test scenario A"
     - Try replying to comment (threading)
     - Add emoji reaction 👍
     - Try pinning comment
  
  d) Test Commit Link:
     - Paste test commit SHA: "abc1234" (7 chars)
     - See it appear as card
     - Try deleting it
  
  e) Test Reopen:
     - Change state to "Closed"
     - Reopen button appears
     - Click it, add reason "Bug fix"
     - See reopen counter update
     - See state change to "Reopened"


════════════════════════════════════════════════════════════
                    DATABASE SCHEMA AT A GLANCE
════════════════════════════════════════════════════════════

testcase_lifecycle (WHO changed it, WHEN, and WHY)
├─ testcase_id: links to test case
├─ state: ENUM (Draft, Ready, InExecution, Completed, Closed, Reopened)
├─ reason: VARCHAR(500) - required
├─ changed_by: user ID
└─ changed_at: timestamp

testcase_reopen_history (Tracking reopens)
├─ testcase_id: which test
├─ reason: why reopen
├─ reopened_by: who did it
└─ reopened_at: when

testcase_commits (Linking code to tests)
├─ testcase_id
├─ commit_sha: Git commit hash
├─ commit_message: from Git
├─ commit_author: from Git
└─ repository_url: where to find it

comment_reactions (Team emoji reactions)
├─ comment_id
├─ user_id
├─ reaction: "👍" or "❤️" or etc
└─ created_at: when added

comment_mentions (@ mentions system)
├─ comment_id
├─ mentioned_user_id
├─ notified: BOOLEAN (for future notifications)
└─ created_at

execution_commits (Which code ran during execution)
├─ execution_id
├─ commit_sha
└─ linked_at


════════════════════════════════════════════════════════════
                    API ENDPOINTS (19 TOTAL)
════════════════════════════════════════════════════════════

LIFECYCLE ENDPOINTS (4):
- GET  /api/testcase/:id/lifecycle         → Get current state
- GET  /api/testcase/:id/lifecycle-history  → Get all past changes
- PUT  /api/testcase/:id/lifecycle         → Change state
- POST /api/testcase/:id/lifecycle-validate → Validate next state

REOPEN ENDPOINTS (1):
- POST /api/testcase/:id/reopen            → Reopen closed test

COMMIT ENDPOINTS (5):
- POST /api/testcase/:id/commits           → Link commit to test
- GET  /api/testcase/:id/commits           → Get linked commits
- DELETE /api/testcase/:id/commits/:sha    → Unlink commit
- POST /api/execution/:id/commits          → Link commit to execution
- GET  /api/execution/:id/commits          → Get linked commits

COMMENTS ENDPOINTS (9):
- POST /api/comments                       → Add comment
- GET  /api/comments/:caseId               → Get all comments
- PUT  /api/comments/:id                   → Edit comment
- DELETE /api/comments/:id                 → Delete comment
- POST /api/comments/:id/reply             → Reply (threading)
- POST /api/comments/:id/pin               → Pin/unpin
- POST /api/comments/:id/reactions         → Add emoji reaction
- DELETE /api/comments/:id/reactions/:emoji → Remove reaction
- GET  /api/comments/:id/reactions         → Get all reactions


════════════════════════════════════════════════════════════
                    PERMISSIONS (WHO CAN DO WHAT)
════════════════════════════════════════════════════════════

TESTER ROLE:
  ✅ Can change lifecycle state
  ✅ Can reopen closed tests
  ✅ Can add/edit/delete comments
  ✅ Can link commits
  ✅ Can view all features

DEVELOPER ROLE:
  ❌ Cannot change lifecycle state (view only)
  ❌ Cannot reopen tests (view only)
  ✅ Can add/edit/delete comments
  ✅ Can link commits
  ✅ Can view all features

ADMIN ROLE:
  ✅ Can do everything
  ✅ Can force change any state
  ✅ Can delete any comment
  ✅ Unrestricted access


════════════════════════════════════════════════════════════
                    3 COMMON USE CASES
════════════════════════════════════════════════════════════

USE CASE 1: Feature Release Workflow
─────────────────────────────────────
Day 1:
  - QA creates test case → State: Draft
  - Adds comments with test scenarios
  - Links commits: abc1234, bcd2345
  - Changes state to "Ready"
  - Reason: "All scenarios documented"

Day 2:
  - Tester picks up test
  - State changes to "In Execution"
  - Adds comment: "Found edge case in login"
  - Pins important comment
  - Adds 👍 reaction to approved scenario

Day 3:
  - Test completes successfully
  - State changes to "Completed"
  - All comments and commits preserved
  - Can reference this test later


USE CASE 2: Bug Regression Testing
───────────────────────────────────
Previous: Test case is Closed (finished feature A)

Today: Bug found in feature A, fixed in commit x1y2z3a

Action:
  - Find old test case
  - Click "Reopen"
  - Reason: "Bug regression - commit x1y2z3a"
  - Link new commit: x1y2z3a
  - Run test again with new code
  - See reopen counter = 2
  - All old comments still there for context


USE CASE 3: Code Review & Traceability
───────────────────────────────────────
Dev: "What tests should I run for my code?"
  - Find commits: a1b2c3d, b2c3d4e
  - Query: Get test cases linking to these commits
  - See: Test #50, #51, #67 test my code
  - Run those specific tests

QA: "What code does this test validate?"
  - Open test case #50
  - See linked commits:
    • a1b2c3d "Add password validation"
    • b2c3d4e "Fix edge cases"
  - Know exactly what code to test


════════════════════════════════════════════════════════════
                    WHAT GETS TRACKED (AUDIT TRAIL)
════════════════════════════════════════════════════════════

LIFECYCLE CHANGES:
  ✓ WHO changed it (user ID)
  ✓ WHEN they changed it (timestamp)
  ✓ FROM what state
  ✓ TO what state
  ✓ WHY (reason text)

REOPENS:
  ✓ WHO reopened (user ID)
  ✓ WHEN (timestamp)
  ✓ WHY (reason text)
  ✓ Reopen count incremented

COMMENTS:
  ✓ WHO wrote/edited (user ID)
  ✓ WHEN (created_at, edited_at)
  ✓ WHAT text they wrote
  ✓ Edit history preserved
  ✓ Delete logs

COMMITS:
  ✓ WHO linked (user ID)
  ✓ WHEN (timestamp)
  ✓ WHAT commit SHA
  ✓ From WHERE (repository)
  ✓ Full commit metadata

RESULT: Complete audit trail for compliance, debugging, and traceability!


════════════════════════════════════════════════════════════
                    WHAT HAPPENS ON BACKEND START
════════════════════════════════════════════════════════════

When you run: node server.js

✅ Connects to MySQL database
✅ Creates 6 new tables if they don't exist:
   - testcase_lifecycle
   - testcase_reopen_history
   - testcase_commits
   - execution_commits
   - comment_reactions
   - comment_mentions

✅ Adds columns to existing tables:
   - testcases: lifecycle_state, reopen_count
   - comments: parent_comment_id, is_pinned, execution_id

✅ Loads all database indexes
✅ Loads 3 new route files:
   - lifecycleRoutes.js (4 endpoints)
   - commitRoutes.js (5 endpoints)
   - commentRoutes.js (9 endpoints, enhanced)
   - testcaseRoutes.js (1 endpoint added: reopen)

✅ Registers middleware for:
   - Auth validation (JWT tokens)
   - Role-based permissions

✅ Logs confirmation: "✅ All 19 endpoints loaded successfully"

NOT REQUIRED: No manual migrations, no SQL scripts, FULLY AUTOMATIC!

*/

// ============================================================
// INTEGRATION EXAMPLE FOR TESTCASE.JS
// ============================================================
// Copy these sections into your Testcase.js file to integrate
// all 4 new advanced features
// ============================================================

// 1. ADD IMPORTS AT THE TOP OF YOUR FILE
// ============================================================

import React, { useState, useEffect } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";

// ADD THESE NEW IMPORTS:
import LifecycleState from "../components/LifecycleState";
import ReopenTestcase from "../components/ReopenTestcase";
import EnhancedComments from "../components/EnhancedComments";
import CommitLinker from "../components/CommitLinker";

// Keep existing imports...
import "./Testcase.css";

// ============================================================
// 2. ADD STATE VARIABLES IN YOUR COMPONENT
// ============================================================

function Testcase() {
  // Your existing state...
  const [testcaseId, setTestcaseId] = useState(null);
  const [testcase, setTestcase] = useState(null);
  const [loading, setLoading] = useState(false);

  // ADD THESE NEW STATE VARIABLES:
  const [currentState, setCurrentState] = useState("");
  const [reopenCount, setReopenCount] = useState(0);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Your existing code...
  useEffect(() => {
    if (testcaseId) {
      fetchTestcaseDetails();
    }
  }, [testcaseId]);

  const fetchTestcaseDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/testcase/${testcaseId}`);
      setTestcase(response.data[0]);
      
      // ADD THIS TO GET LIFECYCLE INFO:
      setCurrentState(response.data[0]?.lifecycle_state || "Draft");
      setReopenCount(response.data[0]?.reopen_count || 0);
    } catch (error) {
      console.error("Failed to fetch testcase:", error);
    } finally {
      setLoading(false);
    }
  };

  // ADD THESE NEW HANDLER FUNCTIONS:
  const handleStateChange = (newState) => {
    setCurrentState(newState);
    // Optionally refresh testcase details
    fetchTestcaseDetails();
  };

  const handleReopen = (result) => {
    setCurrentState("Reopened");
    setReopenCount(result.reopenCount);
    // Optional: show success notification
    console.log("Test case reopened:", result);
  };

  // ============================================================
  // 3. ADD JSX IN YOUR RENDER (BELOW EXISTING FORM FIELDS)
  // ============================================================

  return (
    <div className="testcase-container">
      <Navbar />
      <div className="testcase-content">
        <h1>📋 Test Cases</h1>

        {/* Your existing form fields here... */}

        {testcase && testcaseId && (
          <div className="testcase-details-section">
            
            {/* EXISTING FEATURES */}
            <div className="existing-features">
              {/* Your existing code for displaying testcase info */}
            </div>

            {/* ================================================================ */}
            {/* NEW ADVANCED FEATURES - ADD THIS SECTION */}
            {/* ================================================================ */}
            <div className="advanced-features-section">
              <h2>🚀 Advanced Features</h2>

              {/* FEATURE 1: LIFECYCLE STATE MANAGEMENT */}
              <div className="feature-card lifecycle-card">
                <LifecycleState 
                  testcaseId={testcaseId}
                  onStateChange={handleStateChange}
                />
              </div>

              {/* FEATURE 2: REOPEN CLOSED TEST CASE */}
              {currentState === "Closed" && (
                <div className="feature-card reopen-card">
                  <ReopenTestcase
                    testcaseId={testcaseId}
                    currentState={currentState}
                    reopenCount={reopenCount}
                    onReopen={handleReopen}
                  />
                </div>
              )}

              {/* FEATURE 3: COMMIT LINKING */}
              <div className="feature-card commit-card">
                <CommitLinker
                  testcaseId={testcaseId}
                  onCommitLinked={() => {
                    console.log("Commit linked to test case");
                  }}
                />
              </div>

              {/* FEATURE 4: ENHANCED COMMENTS WITH THREADING */}
              <div className="feature-card comments-card">
                <EnhancedComments testcaseId={testcaseId} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Testcase;

// ============================================================
// 4. ADD CSS STYLING (ADD TO TESTCASE.CSS)
// ============================================================

/* 
Add these styles to your Testcase.css file:

.advanced-features-section {
  margin-top: 40px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 10px;
}

.advanced-features-section h2 {
  color: #333;
  font-size: 24px;
  margin-bottom: 30px;
  border-bottom: 3px solid #667eea;
  padding-bottom: 10px;
}

.feature-card {
  margin-bottom: 25px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lifecycle-card { }
.reopen-card { }
.commit-card { }
.comments-card { }
*/

// ============================================================
// 5. OPTIONAL: ADD TO BUG.JS FOR BUG COMMENTS
// ============================================================

// In Bug.js, you can also use EnhancedComments:

import EnhancedComments from "../components/EnhancedComments";

// In your JSX:
<EnhancedComments bugId={bugId} />

// ============================================================
// 6. USAGE NOTES
// ============================================================

/*
LIFECYCLE STATE VOTING:
- LifecycleState component handles state validation automatically
- Shows available next states based on current state
- Requires a reason for every state change
- Prevents invalid transitions

REOPEN LOGIC:
- ReopenTestcase only shows when state is "Closed"
- Requires a reason for reopening
- Tracks reopen count (shows badge with count)
- Unable to reopen if already in another state

COMMIT LINKING:
- Link any number of commits to a test case
- Shows commit author, date, message, and repo URL
- Click to open GitHub/GitLab repo in new tab
- Useful for traceability and code review

ENHANCED COMMENTS:
- Full threading - reply to any comment
- Pin important comments for visibility
- Add emoji reactions (:thumbsup:, :heart:, etc.)
- Edit/delete your own comments (5 min window)
- @mention users for notifications
- All changes are tracked with user info
*/

// ============================================================
// 7. PERMISSIONS REFERENCE
// ============================================================

/*
ROLE PERMISSIONS:
- Tester: Can change lifecycle state, reopen, comment, link commits
- Developer: Can see lifecycle, comment, link commits (NO state changes, NO reopen)
- Admin: Full access to all features

The backend automatically enforces these permissions via requireRole() middleware
*/

// ============================================================
// 8. DATABASE & BACKEND
// ============================================================

/*
The backend is already configured to:
1. Create all required database tables on startup
2. Add necessary columns to existing tables
3. Enforce state transitions
4. Validate all operations

No additional database setup needed!
Server will auto-create tables when you start it.
*/

// ============================================================
// 9. TESTING
// ============================================================

/*
To test the implementation:

1. Start backend:
   cd backend
   node server.js

2. Start frontend:
   cd frontend
   npm start

3. Create a test case
4. Try changing its lifecycle state
5. Add some comments and test threading
6. Link a commit (use any 7-char hex as test commit SHA)
7. Close the test case
8. Try reopening it

All features should work seamlessly!
*/
