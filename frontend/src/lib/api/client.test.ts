import { describe, expect, it, vi } from "vitest";

import { createTypedClient, CSRF_HEADER, readCookie } from "./client";
import { ApiError, call, toApiError } from "./errors";
import type { paths } from "./schema";

function stubFetch(status = 200, body: unknown = {}) {
  const fetchMock = vi.fn(
    async (_request: Request) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentRequest(fetchMock: ReturnType<typeof stubFetch>): Request {
  const request = fetchMock.mock.calls[0]?.[0];
  if (!request) throw new Error("fetch was not called");
  return request;
}

describe("CSRF header injection", () => {
  it("adds X-CSRFToken from the csrftoken cookie on unsafe methods", async () => {
    document.cookie = "csrftoken=abc123";
    const fetchMock = stubFetch(201, {});
    const api = createTypedClient<paths>();

    await api.POST("/api/v1/brands/", { body: { name: "Sunrise Foods" } });

    const request = sentRequest(fetchMock);
    expect(request.method).toBe("POST");
    expect(request.headers.get(CSRF_HEADER)).toBe("abc123");
    expect(request.credentials).toBe("include");
  });

  it.each(["PATCH", "DELETE"] as const)("adds it on %s too", async (method) => {
    document.cookie = "csrftoken=tok";
    const fetchMock = stubFetch(200, {});
    const api = createTypedClient<paths>();
    const params = { params: { path: { brand_id: "brd_1", member_id: "mem_1" } } };

    if (method === "PATCH") {
      await api.PATCH("/api/v1/brands/{brand_id}/members/{member_id}/", {
        ...params,
        body: { role: "viewer" },
      });
    } else {
      await api.DELETE("/api/v1/brands/{brand_id}/members/{member_id}/", params);
    }
    expect(sentRequest(fetchMock).headers.get(CSRF_HEADER)).toBe("tok");
  });

  it("reads the cookie fresh each time (login rotates it)", async () => {
    const fetchMock = stubFetch(201, {});
    const api = createTypedClient<paths>();
    document.cookie = "csrftoken=first";
    await api.POST("/api/v1/invitations/accept/", { body: { token: "t" } });
    document.cookie = "csrftoken=second";
    await api.POST("/api/v1/invitations/accept/", { body: { token: "t" } });
    expect(fetchMock.mock.calls[1]?.[0].headers.get(CSRF_HEADER)).toBe("second");
  });

  it("does not add it on safe methods", async () => {
    document.cookie = "csrftoken=abc123";
    const fetchMock = stubFetch(200, { id: "usr_1" });
    const api = createTypedClient<paths>();

    await api.GET("/api/v1/me/");

    const request = sentRequest(fetchMock);
    expect(request.headers.get(CSRF_HEADER)).toBeNull();
    expect(new URL(request.url).pathname).toBe("/api/v1/me/");
  });

  it("decodes cookie values", () => {
    document.cookie = "csrftoken=a%3Db";
    expect(readCookie("csrftoken")).toBe("a=b");
    expect(readCookie("missing")).toBeNull();
  });
});

describe("error parsing", () => {
  it("reads the RetentionOS {code, message, details} shape", () => {
    const error = toApiError(400, {
      code: "invalid",
      message: "Some fields need attention.",
      details: { email: ["This person is already a member of this brand."] },
    });
    expect(error.code).toBe("invalid");
    expect(error.field("email")).toBe("This person is already a member of this brand.");
  });

  it("keeps the mfa_setup_required code", () => {
    const error = toApiError(403, {
      code: "mfa_setup_required",
      message: "Please set up 2-step login to continue.",
      details: {},
    });
    expect(error.code).toBe("mfa_setup_required");
    expect(error.message).toBe("Please set up 2-step login to continue.");
  });

  it("reads allauth's {errors: [...]} shape", () => {
    const error = toApiError(400, {
      status: 400,
      errors: [{ code: "email_taken", message: "A user is already registered.", param: "email" }],
    });
    expect(error.field("email")).toBe("A user is already registered.");
  });

  it("turns network failures into a plain-English ApiError", async () => {
    await expect(call(Promise.reject(new TypeError("Failed to fetch")))).rejects.toMatchObject({
      code: "network_error",
    });
  });

  it("returns data for 2xx and throws ApiError otherwise", async () => {
    const ok = { data: { id: 1 }, response: new Response(null, { status: 200 }) };
    await expect(call(Promise.resolve(ok))).resolves.toEqual({ id: 1 });
    const bad = { error: { code: "x", message: "Nope." }, response: new Response(null, { status: 403 }) };
    await expect(call(Promise.resolve(bad))).rejects.toBeInstanceOf(ApiError);
  });
});
