# 4.1 - Clerk Multi-Tenant Auth & Google OAuth Setup

> 🧭 **Note:** ⬅️ Previous: [07 - Mock Data to Live Database Migration Guide](https://notion.so/3e0968d84bdf819eb43cf28cc9de9a3f)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)


# 🔑 Module 08: Google OAuth & Social Login (Clerk Configuration)

> 📋 **Note:** Working notes, architectural requirements, and configuration blueprint for enabling Google Sign-In/Sign-Up via Clerk for mechanic accounts.


## 1. Architectural Requirements & Overview

- Google Cloud Project with OAuth 2.0 Client ID and Secret.
- Clerk Authentication Dashboard with Social Connections enabled.
- Clerk authorized redirect URI: https://accounts.clerk.dev/v1/oauth_callback.
- No code changes required in Next.js — handled by Clerk.

## 2. What Needs to Be Done

Enable Google Social Login in Clerk so mechanics can register or log into MechanicMate using their existing Gmail account, or create a new Gmail account during the signup flow.


## 3. Where Configurations Are Made & What Is Being Configured

| Configuration Area | Platform / Location | What Is Being Configured | Role / Purpose |
| --- | --- | --- | --- |
| Google Cloud Console | console.cloud.google.com | OAuth Consent Screen & Web Client ID | Authorizes MechanicMate to request Google profile identity |
| Clerk Dashboard | dashboard.clerk.com | Social Connections -> Google toggle | Stores Google Client ID & Secret; manages OAuth token exchange |
| Next.js Codebase | app/(auth)/sign-in & sign-up | Clerk <SignIn /> and <SignUp /> | Automatically renders 'Continue with Google' button |


## 4. How It Is Configured & How It Works (Step-by-Step)


### A. Google Cloud Console Setup

1. 1. Create Project 'MechanicMate Auth' at console.cloud.google.com.
1. 2. Enable the Google People API under APIs & Services -> Library.
1. 3. Configure the OAuth Consent Screen (User Type: External, Scopes: email, profile).
1. 4. Create OAuth Client ID (Application Type: Web Application).
1. 5. Add Authorized Redirect URI: https://accounts.clerk.dev/v1/oauth_callback.
1. 6. Copy the generated Client ID and Client Secret.

### B. Clerk Dashboard Configuration

1. 1. Open dashboard.clerk.com -> Select your MechanicMate app.
1. 2. Go to User & Authentication -> Social Connections -> Google (Toggle ON).
1. 3. Paste the Google Client ID and Google Client Secret -> Click 'Apply Changes'.

### C. Gmail Account Creation Flow for Users Without Gmail

If a new mechanic does not have a Gmail account, they click 'Continue with Google' -> Google displays a 'Create account' link -> they register a new Gmail on Google's secure portal -> Google redirects back to MechanicMate logged in.


## 5. Why It Has Been Done (Architectural Justification)

- 🚀 One-Click Onboarding: Mechanics avoid entering passwords or waiting for email verification codes.
- 🔒 Enterprise Security: Leverages Google's 2-factor authentication and fraud protection without writing OAuth token management code.
- ⚡ Zero App Code: Clerk completely encapsulates the OAuth redirect and token lifecycle.

---

> 🧭 **Note:** ⬅️ Previous: [07 - Mock Data Migration Guide](https://notion.so/3e0968d84bdf819eb43cf28cc9de9a3f)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [09 - DVI & Body Damage Mapping](https://notion.so/3e0968d84bdf819b9e58e587b7ee7f76)

