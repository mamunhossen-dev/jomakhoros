
## Phase 1: Foundation (Database & Branding)
1. **Rename MoneyWise → JomaKhoros** everywhere (sidebar, PDF, login, register, etc.)
2. **Database migration** — Add user roles table, subscription fields to profiles, feedback table, payment_requests table
3. **User roles system** — Implement `user_roles` table with `admin`, `moderator`, `user` roles using security definer function

## Phase 2: Auth & Registration Flow
4. **Terms & Conditions page** — Full page with trial policy, pricing, limitations, no refund
5. **Registration update** — Add T&C checkbox, post-registration profile update page, category setup page
6. **Trial system** — Auto-set 1-month trial on signup, track trial_start/end dates

## Phase 3: Subscription & Payments
7. **Subscription plans page** — Show 3 plans (10/50/100 BDT), payment instructions with personal number warning
8. **Payment submission flow** — User submits payment method + transaction ID
9. **Feature gating** — Free users: last 15 days only, no PDF, limited reports; Pro: full access

## Phase 4: Admin & Moderation
10. **Feedback page** — Submit feedback form, save to DB
11. **Admin panel** — View users, approve payments, activate Pro, view feedback, manage roles
12. **Moderator panel** — View feedback, approve/reject payments

## Notes
- Each phase will be implemented in separate messages
- Will start with Phase 1 (branding + database) in this message
- Phases 2-4 will follow in subsequent messages

## Estimated effort: 4-6 messages to complete all phases
