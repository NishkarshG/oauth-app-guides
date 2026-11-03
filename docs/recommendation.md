# Which apps should Composio make managed next?

**My recommendation: start with Shopify, Meta Ads and Webflow, not simply the apps with the longest approval.** A managed OAuth app only helps when one approval held by Composio can serve every developer. In my sample of 20 bring-your-own toolkits, several of the hardest apps can't be fixed this way.

## How I got here

I generated a guide for 20 of the 262 bring-your-own toolkits, chosen by judgment for likely agent use and variety, not at random. I then sorted them on two questions: how much pain does a developer face alone, and could one approval held by Composio remove it? Composio's tool count is my rough stand-in for investment. It isn't demand, and Composio's own data should replace it.

## The ranking

| Group | Apps | Why |
|---|---|---|
| **1. Make managed next** | **Shopify** (407 tools), **Meta Ads** (95), **Webflow** (60), **LinkedIn Ads** (28) | Each developer waits on a review of about 2-6 weeks, and one approved app could cover them all. |
| **2. Quick wins** | **Pipedrive** (406), **Klaviyo** (233) | There's no mandatory review, so these could be cheap to offer. It saves about an hour each, and these have large toolkits. |
| **3. Managed won't help: help the admin instead** | **Workday** (588), **ServiceNow** (171), **Snowflake** (17) | Each customer's admin creates the client in their own tenant, so there's no shared app to hold. |
| **4. Don't default to managed** | **Datadog, DocuSign, PayPal, Spotify, X, Xero** | The gate is commercial, or the costs would fall on Composio: partner programs, a 250k-user minimum, per-call charges, or plans priced by connection. Each needs a business decision. |
| **5. Later** | **TikTok, Vercel, Smartsheet, NetSuite, Deel** | Lower investment so far, a private beta, or setup that depends on the customer's own account. Deel has a large toolkit, but its docs don't say whether review is needed before other organizations can connect, so test that first. |

## The three that matter most

- **Shopify:** merchants can't connect until App Store review, which developers report takes about 2-5 weeks (an estimate). Composio's Shopify docs mention a default app that may be under review or expired, so this may already have been tried. I'd find out why it stopped first.
- **Meta Ads:** full access needs 500 Marketing API calls in the past 15 days. A new developer has no traffic to reach that, but Composio's shared traffic could. This is the clearest case where Composio has an advantage a single developer can't have.
- **Webflow:** external users can't install an app until it's approved, and private apps go through the same review. So every developer hits this gate, and Webflow aims to decide within 10 business days.

## A cheaper step to take first

Composio's `composio.dev/auth` pages explain how to get credentials. I found pages for 7 of the 20 toolkits (DocuSign, Pipedrive, Shopify, Snowflake, X, Workday and Xero), though other pages may exist under different addresses. None gives an approval time, and the Shopify and Xero pages don't mention App Store review or certification. Adding a short "what happens after this works for you" section would help every developer now, with no provider approval needed. For group 3, an admin handoff kit would do the same job.

## What could make this wrong

- **Provider terms:** I didn't check whether each provider allows one app to serve many developers' customers. This could rule out apps in group 1.
- **Quotas and risk:** a shared app means a shared quota and shared reputation. One bad actor could affect everyone.
- **Demand:** tool count isn't usage. Composio's connection and failure data would be a better ranking input.
- **Evidence:** I rechecked the main claims against provider pages, but not every claim. Review times are often estimates, and the Workday and TikTok claims rest on third-party sources.

The first thing I'd ask Composio: which bring-your-own toolkits have the most developers who start an auth config and never complete a connection?
