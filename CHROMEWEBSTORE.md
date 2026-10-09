# Chrome Web Store Listing - Antigravity Status Checker

This document contains all metadata, descriptions, permissions justifications, and privacy disclosures required for publishing to the Chrome Web Store Developer Dashboard.

---

## 1. Store Listing Metadata

- **Extension Name:** Antigravity Status Checker
- **Short Description (max 132 chars):** Real-time connectivity and latency checker for Google Antigravity and Gemini AI services.
- **Category:** Developer Tools / Productivity
- **Language:** English (Default) / Persian
- **Version:** 1.0.0

### Detailed Description (Markdown formatted for Store):
```text
Antigravity Status Checker is a lightweight, real-time connectivity monitor designed for developers and users interacting with Google AI and Antigravity environments.

Key Features:
- Instant Connectivity Testing: Measures latency and response status against Google's Gemini API endpoints (generativelanguage.googleapis.com).
- Account & Console Health: Validates reachability to Google Accounts and AI Studio consoles.
- Real-time Toolbar Badge: Color-coded status badge directly in the Chrome toolbar (Green = Ready, Amber = Restricted/403, Red = Unreachable).
- Server Location & IP Detection: Quickly inspects outbound egress IP and country to confirm proxy or VPN routing.
- Zero Data Collection: Operates strictly client-side with no tracking, analytics, or third-party data telemetry.
```

---

## 2. Permissions Justification

| Permission / Host | Why it is needed |
| :--- | :--- |
| `storage` | Required to cache the latest ping results and user preferences locally on the device. |
| `alarms` | Required to run periodic background checks at user-configured intervals to keep the toolbar badge status accurate. |
| `https://generativelanguage.googleapis.com/*` | Target API host to verify Gemini & Antigravity endpoint availability and latency. |
| `https://aistudio.google.com/*` | Target host to test reachability to Google AI Studio. |
| `https://accounts.google.com/*` | Target host to test authentication gateway reachability. |
| `https://ipwho.is/*` | Non-commercial IP geo-lookup service used to display active connection country and IP in the popup UI. |

---

## 3. Privacy & Data Use Disclosure

- **Does this extension collect user data?** No.
- **Does it transmit personal information?** No.
- **Single Purpose Policy:** The sole purpose of this extension is to diagnose and display network connectivity and latency to Google AI services.
