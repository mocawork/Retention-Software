/**
 * GENERATED — DO NOT EDIT.
 * Source: backend/openapi.json (openapi-typescript).
 * Regenerate with `pnpm generate:api`; CI fails if this file is out of date.
 */

export interface paths {
    "/api/v1/brands/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description Brands I belong to; create a new brand (I become its Owner). */
        get: operations["brands_list"];
        put?: never;
        /** @description Brands I belong to; create a new brand (I become its Owner). */
        post: operations["brands_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/brands/{brand_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description Every /api/v1/ view uses this (directly or via BrandScopedMixin), except the short
         *     exemption list in tests/test_mfa_enforcement.py (me, health, schema, public pages).
         */
        get: operations["brands_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * @description Every /api/v1/ view uses this (directly or via BrandScopedMixin), except the short
         *     exemption list in tests/test_mfa_enforcement.py (me, health, schema, public pages).
         */
        patch: operations["brands_partial_update"];
        trace?: never;
    };
    "/api/v1/brands/{brand_id}/audit-log/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description Every /api/v1/ view uses this (directly or via BrandScopedMixin), except the short
         *     exemption list in tests/test_mfa_enforcement.py (me, health, schema, public pages).
         */
        get: operations["brands_audit_log_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/brands/{brand_id}/invitations/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description Every /api/v1/ view uses this (directly or via BrandScopedMixin), except the short
         *     exemption list in tests/test_mfa_enforcement.py (me, health, schema, public pages).
         */
        get: operations["brands_invitations_list"];
        put?: never;
        /**
         * @description Every /api/v1/ view uses this (directly or via BrandScopedMixin), except the short
         *     exemption list in tests/test_mfa_enforcement.py (me, health, schema, public pages).
         */
        post: operations["brands_invitations_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/brands/{brand_id}/invitations/{invitation_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** @description Revoke (cancel) an invitation. Owner/Admin; only an Owner can revoke an Owner invite. */
        delete: operations["brands_invitations_destroy"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/brands/{brand_id}/members/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description Every /api/v1/ view uses this (directly or via BrandScopedMixin), except the short
         *     exemption list in tests/test_mfa_enforcement.py (me, health, schema, public pages).
         */
        get: operations["brands_members_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/brands/{brand_id}/members/{member_id}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * @description Every /api/v1/ view uses this (directly or via BrandScopedMixin), except the short
         *     exemption list in tests/test_mfa_enforcement.py (me, health, schema, public pages).
         */
        delete: operations["brands_members_destroy"];
        options?: never;
        head?: never;
        /**
         * @description Every /api/v1/ view uses this (directly or via BrandScopedMixin), except the short
         *     exemption list in tests/test_mfa_enforcement.py (me, health, schema, public pages).
         */
        patch: operations["brands_members_partial_update"];
        trace?: never;
    };
    "/api/v1/brands/{brand_id}/onboarding/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description Every /api/v1/ view uses this (directly or via BrandScopedMixin), except the short
         *     exemption list in tests/test_mfa_enforcement.py (me, health, schema, public pages).
         */
        get: operations["brands_onboarding_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/health/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["health_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/invitations/{token}/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description Public: what an invitation link is for, so the invitee can sign up or log in.
         *
         *     Unknown tokens get a plain 404, the same as any missing page.
         */
        get: operations["invitations_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/invitations/accept/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * @description Every /api/v1/ view uses this (directly or via BrandScopedMixin), except the short
         *     exemption list in tests/test_mfa_enforcement.py (me, health, schema, public pages).
         */
        post: operations["invitations_accept_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** @description The logged-in user's own profile. */
        get: operations["me_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** @description The logged-in user's own profile. */
        patch: operations["me_partial_update"];
        trace?: never;
    };
    "/api/v1/me/security-events/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * @description My own latest 50 security events (logins, failed attempts, password and 2-step
         *     changes). Reachable before 2-step login is set up, like /me/.
         */
        get: operations["me_security_events_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AcceptInvitationRequest: {
            token: string;
        };
        AuditLog: {
            readonly id: string;
            action: string;
            /** Format: email */
            readonly actor_email: string;
            target_type?: string;
            target_id?: string;
            metadata?: unknown;
            /** Format: date-time */
            readonly created_at: string;
        };
        Brand: {
            readonly id: string;
            name: string;
            timezone?: string;
            readonly currency: string;
            readonly platform: components["schemas"]["PlatformEnum"];
            readonly status: components["schemas"]["BrandStatusEnum"];
            readonly my_role: string | null;
            /** Format: date-time */
            readonly created_at: string;
        };
        BrandRequest: {
            name: string;
            timezone?: string;
        };
        /**
         * @description * `onboarding` - Onboarding
         *     * `active` - Active
         *     * `suspended` - Suspended
         * @enum {string}
         */
        BrandStatusEnum: "onboarding" | "active" | "suspended";
        /** @description Every API error has this shape (apps/core/exceptions.py). */
        Error: {
            /** @description Stable machine code, e.g. "not_found". */
            code: string;
            /** @description Plain-English message that can be shown. */
            message: string;
            /** @description Field errors, or {} when there are none. */
            details: unknown;
        };
        Health: {
            status: string;
        };
        Invitation: {
            readonly id: string;
            /** Format: email */
            email: string;
            role: components["schemas"]["RoleEnum"];
            /**
             * @description 'expired' = the 7-day link ran out; invite again to send a new one.
             *
             *     * `pending` - Pending
             *     * `accepted` - Accepted
             *     * `revoked` - Revoked
             *     * `expired` - Expired
             */
            readonly status: components["schemas"]["InvitationStatusEnum"];
            /** Format: date-time */
            readonly expires_at: string;
            /** Format: date-time */
            readonly created_at: string;
        };
        /** @description What the invitee sees before logging in. No IDs, nothing else about the brand. */
        InvitationPreview: {
            brand_name: string;
            role: components["schemas"]["RoleEnum"];
            /**
             * Format: email
             * @description The address the invitation was sent to.
             */
            email: string;
            /** @description Inviter's name, or their email. */
            invited_by_name: string;
            status: components["schemas"]["InvitationStatusEnum"];
            /** Format: date-time */
            expires_at: string;
        };
        InvitationRequest: {
            /** Format: email */
            email: string;
            role: components["schemas"]["RoleEnum"];
        };
        /**
         * @description * `pending` - Pending
         *     * `accepted` - Accepted
         *     * `revoked` - Revoked
         *     * `expired` - Expired
         * @enum {string}
         */
        InvitationStatusEnum: "pending" | "accepted" | "revoked" | "expired";
        Me: {
            readonly id: string;
            /** Format: email */
            readonly email: string;
            full_name?: string;
            readonly mfa: components["schemas"]["MfaStatus"];
        };
        Membership: {
            readonly id: string;
            /** Format: email */
            readonly email: string;
            readonly full_name: string;
            role: components["schemas"]["RoleEnum"];
            /** Format: date-time */
            readonly created_at: string;
        };
        MfaStatus: {
            /** @description 2-step login is set up. */
            enabled: boolean;
            /** @description The current policy requires it. */
            required: boolean;
            /**
             * Format: date-time
             * @description When it becomes blocking. Null = never.
             */
            deadline: string | null;
            /** @description True = the user must set up 2-step login before continuing. */
            blocked: boolean;
        };
        Onboarding: {
            steps: components["schemas"]["OnboardingStep"][];
        };
        OnboardingStep: {
            key: string;
            title: string;
            state: components["schemas"]["StateEnum"];
            description: string;
        };
        PatchedBrandRequest: {
            name?: string;
            timezone?: string;
        };
        PatchedMeRequest: {
            full_name?: string;
        };
        PatchedMembershipRequest: {
            role?: components["schemas"]["RoleEnum"];
        };
        /**
         * @description * `none` - Not connected yet
         *     * `shopify` - Shopify
         *     * `woocommerce` - WooCommerce
         *     * `csv` - CSV import
         * @enum {string}
         */
        PlatformEnum: "none" | "shopify" | "woocommerce" | "csv";
        /**
         * @description * `owner` - Owner
         *     * `admin` - Admin
         *     * `marketer` - Marketer
         *     * `viewer` - Viewer
         * @enum {string}
         */
        RoleEnum: "owner" | "admin" | "marketer" | "viewer";
        SecurityEvent: {
            readonly id: string;
            readonly type: components["schemas"]["SecurityEventTypeEnum"];
            /** @description Plain-English line to show, e.g. 'Logged in'. */
            readonly description: string;
            /** Format: date-time */
            readonly created_at: string;
            readonly ip_address: string | null;
            readonly user_agent: string;
        };
        /**
         * @description * `login` - Logged in
         *     * `login_failed` - Failed login attempt
         *     * `logout` - Logged out
         *     * `email_verified` - Email address verified
         *     * `password_reset` - Password reset by email link
         *     * `password_changed` - Password changed
         *     * `mfa_enabled` - 2-step login turned on
         *     * `mfa_disabled` - 2-step login turned off
         *     * `recovery_codes_generated` - New recovery codes created
         * @enum {string}
         */
        SecurityEventTypeEnum: "login" | "login_failed" | "logout" | "email_verified" | "password_reset" | "password_changed" | "mfa_enabled" | "mfa_disabled" | "recovery_codes_generated";
        /**
         * @description * `done` - done
         *     * `current` - current
         *     * `coming_next` - coming_next
         *     * `locked` - locked
         * @enum {string}
         */
        StateEnum: "done" | "current" | "coming_next" | "locked";
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    brands_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Brand"][];
                };
            };
        };
    };
    brands_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BrandRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["BrandRequest"];
                "multipart/form-data": components["schemas"]["BrandRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Brand"];
                };
            };
        };
    };
    brands_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                brand_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Brand"];
                };
            };
        };
    };
    brands_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                brand_id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedBrandRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedBrandRequest"];
                "multipart/form-data": components["schemas"]["PatchedBrandRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Brand"];
                };
            };
        };
    };
    brands_audit_log_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                brand_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditLog"][];
                };
            };
        };
    };
    brands_invitations_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                brand_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Invitation"][];
                };
            };
        };
    };
    brands_invitations_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                brand_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InvitationRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["InvitationRequest"];
                "multipart/form-data": components["schemas"]["InvitationRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Invitation"];
                };
            };
        };
    };
    brands_invitations_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                brand_id: string;
                invitation_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    brands_members_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                brand_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Membership"][];
                };
            };
        };
    };
    brands_members_destroy: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                brand_id: string;
                member_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    brands_members_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                brand_id: string;
                member_id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedMembershipRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedMembershipRequest"];
                "multipart/form-data": components["schemas"]["PatchedMembershipRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Membership"];
                };
            };
        };
    };
    brands_onboarding_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                brand_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Onboarding"];
                };
            };
        };
    };
    health_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Health"];
                };
            };
        };
    };
    invitations_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                token: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvitationPreview"];
                };
            };
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    invitations_accept_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AcceptInvitationRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["AcceptInvitationRequest"];
                "multipart/form-data": components["schemas"]["AcceptInvitationRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Brand"];
                };
            };
        };
    };
    me_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Me"];
                };
            };
        };
    };
    me_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedMeRequest"];
                "application/x-www-form-urlencoded": components["schemas"]["PatchedMeRequest"];
                "multipart/form-data": components["schemas"]["PatchedMeRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Me"];
                };
            };
        };
    };
    me_security_events_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SecurityEvent"][];
                };
            };
        };
    };
}
