# MechanicMate — Clerk Auth Troubleshooting & Architecture Guide

This guide documents every authentication error encountered during development, the exact root causes, where they occurred, and how to fix them if they happen again.

---

## Quick Reference Summary

| #     | Error Message / Symptom                                                      | Affected File(s)                                                       | Root Cause                                                                               | Fix Summary                                                                                                   |
| ----- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **1** | `Property 'afterSignInUrl' does not exist on type...`                        | `app/layout.tsx`                                                       | Deprecated Clerk v5/v6 props in Clerk v7                                                 | Use `signInFallbackRedirectUrl` and `signUpFallbackRedirectUrl`                                               |
| **2** | `Property 'isLoaded' does not exist on type 'SignInSignalValue'`             | `app/(auth)/sign-in/.../page.tsx`<br>`app/(auth)/sign-up/.../page.tsx` | Clerk v7 default hooks return experimental signals                                       | Import from `@clerk/nextjs/legacy`                                                                            |
| **3** | `AuthenticateWithRedirectCallback can only be used within <ClerkProvider />` | `app/(auth)/sso-callback/page.tsx`                                     | Component evaluated during SSR prerender without ClerkProvider                           | Guard with `mounted && isClerkConfigured`                                                                     |
| **4** | `Missing publishableKey` (500 Error on all routes)                           | `middleware.ts`                                                        | `clerkMiddleware()` invoked when keys are blank                                          | Check `isClerkConfigured` before delegating to `clerkMiddleware`                                              |
| **5** | `Cannot initialize Smart CAPTCHA widget... 'clerk-captcha' not found`        | `app/(auth)/layout.tsx`                                                | Clerk DOM search runs before React client components mount                               | Place `<div id="clerk-captcha" />` directly in `app/(auth)/layout.tsx`                                        |
| **6** | `This verification has already been verified` (OTP verification stuck)       | `app/(auth)/sign-up/.../page.tsx`                                      | Double submission + catch block treated success as failure + soft navigation cookie race | Lock verify button + handle `verification_already_verified` in catch block + use `window.location.href = "/"` |
| **7** | No users appearing in Clerk Dashboard                                        | `.env.local`                                                           | Empty keys triggered local Demo Simulation Mode                                          | Add live keys to `.env.local` and restart dev server                                                          |

---

## Detailed Issue Breakdowns & Solutions

### 1. ClerkProvider Deprecated URL Props

#### Symptom:

During `npm run build`:

```text
app/layout.tsx(47,9): error TS2322: Type '{ ... afterSignInUrl: string; afterSignUpUrl: string; }'
is not assignable to type 'NextClerkProviderProps'.
Property 'afterSignInUrl' does not exist. Did you mean 'afterSignOutUrl'?
```

#### Where to Check:

📁 [`app/layout.tsx`](file:///c:/Users/Elihu%20Joseph%20Mvura/Documents/mech/app/layout.tsx)

#### Root Cause:

In Clerk v6/v7, `afterSignInUrl` and `afterSignUpUrl` were replaced by fallback redirect props to distinguish between forced and fallback redirects.

#### How to Fix:

Replace `afterSignInUrl` and `afterSignUpUrl` with `signInFallbackRedirectUrl` and `signUpFallbackRedirectUrl`:

```tsx
// app/layout.tsx
<ClerkProvider
  publishableKey={clerkKey}
  signInUrl="/sign-in"
  signUpUrl="/sign-up"
  signInFallbackRedirectUrl="/"
  signUpFallbackRedirectUrl="/"
  afterSignOutUrl="/sign-in"
>
  {children}
</ClerkProvider>
```

---

### 2. Clerk v7 Hook Types (`SignInSignalValue` vs `UseSignInReturn`)

#### Symptom:

During `npm run build`:

```text
app/(auth)/sign-in/[[...sign-in]]/page.tsx: error TS2339: Property 'isLoaded' does not exist on type 'SignInSignalValue'.
app/(auth)/sign-in/[[...sign-in]]/page.tsx: error TS2339: Property 'setActive' does not exist on type 'SignInSignalValue'.
app/(auth)/sign-in/[[...sign-in]]/page.tsx: error TS2339: Property 'attemptFirstFactor' does not exist on type 'SignInFutureResource'.
```

#### Where to Check:

📁 [`app/(auth)/sign-in/[[...sign-in]]/page.tsx`](file:///c:/Users/Elihu%20Joseph%20Mvura/Documents/mech/app/%28auth%29/sign-in/%5B%5B...sign-in%5D%5D/page.tsx)  
📁 [`app/(auth)/sign-up/[[...sign-up]]/page.tsx`](file:///c:/Users/Elihu%20Joseph%20Mvura/Documents/mech/app/%28auth%29/sign-up/%5B%5B...sign-up%5D%5D/page.tsx)

#### Root Cause:

`@clerk/nextjs` v7 exports experimental signals for `useSignIn` and `useSignUp` by default from the root package. For traditional custom flows requiring `{ isLoaded, signIn, signUp, setActive }`, Clerk provides the stable classical API under the `/legacy` subpath.

#### How to Fix:

Change the import paths to `@clerk/nextjs/legacy`:

```tsx
// BEFORE (Causes Signal Type Error)
import { useSignIn, useSignUp } from "@clerk/nextjs";

// AFTER (Stable Custom Flow API)
import { useSignIn } from "@clerk/nextjs/legacy";
import { useSignUp } from "@clerk/nextjs/legacy";
```

Always guard hook calls before use:

```tsx
const { isLoaded, signIn, setActive } = useSignIn();

// Guard both isLoaded and the object reference
if (!isLoaded || !signIn) return;
```

---

### 3. SSO Callback Prerender Error During Build

#### Symptom:

During `npm run build`:

```text
Error occurred prerendering page "/sso-callback":
Error: @clerk/react: AuthenticateWithRedirectCallback can only be used within the <ClerkProvider /> component.
```

#### Where to Check:

📁 [`app/(auth)/sso-callback/page.tsx`](file:///c:/Users/Elihu%20Joseph%20Mvura/Documents/mech/app/%28auth%29/sso-callback/page.tsx)

#### Root Cause:

Next.js attempts to statically prerender all pages at build time. When Clerk keys are pending or evaluated during static build, `<ClerkProvider>` is not wrapping the tree, causing `<AuthenticateWithRedirectCallback />` to throw a fatal error.

#### How to Fix:

Ensure the callback only mounts after client-side hydration AND when Clerk is verified:

```tsx
// app/(auth)/sso-callback/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = Boolean(
    clerkKey && !clerkKey.includes("YOUR_") && clerkKey.startsWith("pk_"),
  );

  return (
    <div>
      {mounted && isClerkConfigured ? (
        <AuthenticateWithRedirectCallback
          signUpForceRedirectUrl="/"
          signInForceRedirectUrl="/"
        />
      ) : (
        <p>Finalizing authorization...</p>
      )}
    </div>
  );
}
```

---

### 4. Middleware Crash on Empty Keys (`Missing publishableKey`)

#### Symptom:

When running `npm run dev`, opening `http://localhost:3000/sign-in` returned `HTTP 500`:

```text
⨯ Error: @clerk/nextjs: Missing publishableKey. To set up Clerk for this project, in your terminal run:
npx clerk@latest init
```

#### Where to Check:

📁 [`middleware.ts`](file:///c:/Users/Elihu%20Joseph%20Mvura/Documents/mech/middleware.ts)

#### Root Cause:

`clerkMiddleware()` validates that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` exists upon invocation. If the variable is empty in `.env.local`, every route request fails with an unhandled exception.

#### How to Fix:

Wrap `clerkMiddleware()` inside a delegating function that checks whether Clerk is configured before calling it:

```ts
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = Boolean(
  clerkKey && !clerkKey.includes("YOUR_") && clerkKey.startsWith("pk_"),
);

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/verify-email(.*)",
  "/sso-callback(.*)",
  "/estimate/(.*)",
  "/invoice/(.*)",
  "/inspection/(.*)",
  "/api/webhooks/(.*)",
]);

const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export default function middleware(request: NextRequest, event: any) {
  // If keys are not yet configured, allow traffic without crashing
  if (!isClerkConfigured) {
    return NextResponse.next();
  }
  return clerkHandler(request, event);
}
```

---

### 5. Smart CAPTCHA DOM Element Not Found (`clerk-captcha`)

#### Symptom:

Browser Console Warning:

```text
Cannot initialize Smart CAPTCHA widget because the `clerk-captcha` DOM element was not found;
falling back to Invisible CAPTCHA widget.
```

#### Where to Check:

📁 [`app/(auth)/layout.tsx`](file:///c:/Users/Elihu%20Joseph%20Mvura/Documents/mech/app/%28auth%29/layout.tsx)

#### Root Cause:

Clerk has Bot Protection / Smart CAPTCHA enabled by default. In custom flows, Clerk's script executes upon page load and immediately queries `document.getElementById('clerk-captcha')`. If the element is placed inside a component that mounts conditionally or after hydration, the element is not found during initial script execution.

#### How to Fix:

Place `<div id="clerk-captcha" />` inside **`app/(auth)/layout.tsx`** so that it is included in the server-generated HTML on every auth route before any client script runs:

```tsx
// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen ...">
      <div className="w-full max-w-[440px] rounded-3xl bg-[#141414] ...">
        {children}
        {/* Clerk Smart CAPTCHA Container - present in initial server HTML */}
        <div id="clerk-captcha" />
      </div>
    </div>
  );
}
```

---

### 6. "This verification has already been verified" & Navigation Freeze

#### Symptom:

Entering the 6-digit OTP code gave a console error:

```text
This verification has already been verified.
    at async handleVerifyOtp (app/(auth)/sign-up/[[...sign-up]]/page.tsx)
```

The user remained on the verification screen and was not logged in.

#### Where to Check:

📁 [`app/(auth)/sign-up/[[...sign-up]]/page.tsx`](file:///c:/Users/Elihu%20Joseph%20Mvura/Documents/mech/app/%28auth%29/sign-up/%5B%5B...sign-up%5D%5D/page.tsx)

#### Root Cause:

Three interacting issues:

1. **Rapid Submission / Double Submission**: When the user submitted the OTP code, the first network request succeeded and verified the email in Clerk. A rapid secondary click or re-render triggered a second verification call on the same code, causing Clerk to reject it with `verification_already_verified`.
2. **Error Handler Oversight**: The catch block interpreted `verification_already_verified` as a failure and showed an error, rather than recognizing that the email was already verified and establishing the session.
3. **Cookie Race on Soft Navigation**: `router.push("/")` performed a client-side Next.js soft navigation before the browser finished writing Clerk's `__session` cookie, triggering middleware redirection back to auth.

#### How to Fix:

1. **Prevent Double-Submission**: Add an immediate check `if (!isLoaded || !signUp || loading) return;`.
2. **Handle `verification_already_verified` in `catch`**: If the code is already verified, proceed to activate the session or redirect to sign in.
3. **Use `window.location.href = "/"`**: Perform a clean top-level reload so the new session cookie is sent with the HTTP request to Next.js middleware.

```tsx
// app/(auth)/sign-up/[[...sign-up]]/page.tsx
const handleVerifyOtp = async (e: React.FormEvent) => {
  e.preventDefault();
  // Prevent double submissions
  if (!isLoaded || !signUp || loading) return;

  const fullCode = otpCode.join("").trim();
  if (fullCode.length < 6) {
    setErrorMsg("Please enter the complete 6-digit verification code.");
    return;
  }

  setLoading(true);
  setErrorMsg(null);

  try {
    const completeSignUp = await signUp.attemptEmailAddressVerification({
      code: fullCode,
    });

    if (
      completeSignUp.status === "complete" ||
      completeSignUp.createdSessionId
    ) {
      if (completeSignUp.createdSessionId) {
        await setActive?.({ session: completeSignUp.createdSessionId });
      }
      // Top-level reload ensures __session cookie is sent to middleware
      window.location.href = "/";
      return;
    } else {
      setErrorMsg(
        `Verification status: ${completeSignUp.status}. Please sign in.`,
      );
    }
  } catch (err: unknown) {
    const clerkError = err as {
      errors?: Array<{ message?: string; longMessage?: string; code?: string }>;
    };
    const firstErr = clerkError.errors?.[0];

    // Check if the code was already verified
    const isAlreadyVerified =
      firstErr?.code === "verification_already_verified" ||
      firstErr?.message?.toLowerCase().includes("already been verified") ||
      firstErr?.longMessage?.toLowerCase().includes("already been verified");

    if (isAlreadyVerified) {
      if (signUp.createdSessionId) {
        await setActive?.({ session: signUp.createdSessionId });
        window.location.href = "/";
        return;
      } else {
        // Account exists & is verified; redirect to sign-in
        setErrorMsg("Email already verified! Redirecting to sign in...");
        setTimeout(() => {
          window.location.href = "/sign-in";
        }, 1000);
        return;
      }
    }

    setErrorMsg(
      firstErr?.longMessage ||
        firstErr?.message ||
        "Invalid verification code.",
    );
  } finally {
    setLoading(false);
  }
};
```

---

### 7. Users Not Appearing in Clerk Dashboard (Demo Simulation Mode)

#### Symptom:

Sign-in or sign-up forms submit, but no users appear under **Users** in the Clerk Dashboard.

#### Where to Check:

📁 [`.env.local`](file:///c:/Users/Elihu%20Joseph%20Mvura/Documents/mech/.env.local)

#### Root Cause:

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are empty or still have placeholders. The application safely fell back to local **Demo Simulation Mode** to keep the UI interactive without making network calls to Clerk.

#### How to Fix:

1. Open [`.env.local`](file:///c:/Users/Elihu%20Joseph%20Mvura/Documents/mech/.env.local).
2. Paste the actual keys from [Clerk Dashboard $\rightarrow$ API Keys](https://dashboard.clerk.com/~/api-keys):
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
   CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
   ```
3. **Restart the Next.js development server** (`Ctrl + C`, then `npm run dev`) so the process reloads `.env.local`.

---

## Verification Commands

To verify your authentication setup at any time:

```bash
# 1. Verify TypeScript and Next.js Prerendering compile cleanly:
npm run build

# 2. Check that Clerk keys exist without printing secrets:
node -e "const fs = require('fs'); const env = fs.readFileSync('.env.local', 'utf8'); console.log('PK:', env.includes('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_'), 'SK:', env.includes('CLERK_SECRET_KEY=sk_'));"

# 3. Start local development server:
npm run dev
```
