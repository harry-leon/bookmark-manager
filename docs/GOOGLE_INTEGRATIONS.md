# LinkNest — Google Integrations Architecture & Findings

## 1. Google Integrations Status
As requested, external OAuth integrations for Google Drive and Google Calendar are slated for **Post-MVP**. The data model and architecture are prepared without breaking or imposing mandatory third-party accounts on local users.

---

## 2. Google Keep Research Gate Findings
Research into Google's official developer documentation and APIs indicates:
- **No Public Consumer API**: There is **no public consumer REST API** for Google Keep that supports arbitrary user-authenticated note creation, retrieval, or synchronization for third-party OAuth apps.
- **Enterprise-Only API**: The Enterprise Keep API (`keep.googleapis.com`) is strictly scoped to Google Workspace domains with service accounts managing corporate data loss prevention (DLP) and enterprise compliance, not personal user notes.
- **Policy on Scraping**: Automated browser scraping or unofficial reverse-engineered endpoints violate Google's Terms of Service and are fragile.
- **Architectural Resolution for LinkNest**:
  - Direct Keep synchronization is not technically feasible for standard OAuth applications and is not a release blocker.
  - LinkNest provides a dedicated Markdown note editor with clipboard paste support, enabling users to copy from Google Keep and paste directly into LinkNest notes (including attached images).

---

## 3. Post-MVP Integration Specifications

### 3.1 Google Drive (Priority 1)
- **Scope**: `https://www.googleapis.com/auth/drive.file` (narrowest practical scope — allows viewing and managing only files opened or created by LinkNest).
- **Functionality**:
  - Users can connect their Google account from Settings → Integrations.
  - Browse or select a file reference via Google Drive Picker.
  - Attach Drive file references (file ID, name, mimeType, webViewLink) to URLs, Notes, or Tasks without copying the entire file content into LinkNest storage.

### 3.2 Google Calendar (Priority 2)
- **Scope**: `https://www.googleapis.com/auth/calendar.events` (restricted to event management only, no access to calendar settings or private calendar metadata).
- **Functionality**:
  - Explicit user action to export/sync a task with due date into Google Calendar.
  - LinkNest stores the external `calendarId` and `eventId` to permit updating or removing the event if the task due date changes.
  - Task data in LinkNest remains authoritative.
