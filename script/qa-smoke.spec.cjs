const { test, expect } = require("@playwright/test");

const BASE_URL = process.env.SMOKE_BASE_URL || "https://relateiq-growth.pages.dev";

const ROUTES = [
  "/",
  "/profiles",
  "/questionnaire",
  "/coach",
  "/insights",
  "/check-in",
  "/tools",
  "/triggers",
  "/repair",
  "/chat",
  "/analysis",
  "/insight-library",
  "/knowledge",
  "/roadmap",
  "/daily",
  "/playbook",
  "/journal",
  "/vision",
  "/health-report",
];

function createIssueTracker(page) {
  const issues = [];

  page.on("pageerror", (error) => {
    issues.push({ type: "pageerror", message: String(error) });
  });

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/Failed to load resource: the server responded with a status of 405/i.test(text)) {
      issues.push({ type: "console", message: text });
      return;
    }
    if (/Failed to load resource: the server responded with a status of 5\d\d/i.test(text)) {
      issues.push({ type: "console", message: text });
      return;
    }
    if (/Uncaught|TypeError|ReferenceError|SyntaxError/i.test(text)) {
      issues.push({ type: "console", message: text });
    }
  });

  page.on("response", async (response) => {
    const status = response.status();
    const url = response.url();
    if (!url.startsWith(BASE_URL) && !url.includes("relate-iq-growth-api")) return;
    if (status >= 400) {
      issues.push({ type: "response", status, url });
    }
  });

  return issues;
}

async function dismissTransientOverlays(page) {
  const selectors = [
    'button[aria-label="Close"]',
    'button:has-text("Close")',
    'button:has-text("Got it")',
    'button:has-text("Dismiss")',
  ];
  for (const selector of selectors) {
    const button = page.locator(selector).first();
    if (await button.count()) {
      await button.click({ force: true }).catch(() => {});
    }
  }
}

test.describe.configure({ mode: "serial" });

test("route smoke", async ({ page }) => {
  const issues = createIssueTracker(page);

  for (const route of ROUTES) {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
    await dismissTransientOverlays(page);
    const bodyText = await page.locator("body").innerText();
    expect(bodyText, `route ${route} missing app shell`).toContain("Home");
    expect(bodyText.length, `route ${route} rendered blank`).toBeGreaterThan(200);
  }

  const actionable = issues.filter((issue) => {
    if (issue.type === "response" && issue.status === 404 && /favicon|\.map$/.test(issue.url)) return false;
    return true;
  });

  expect(actionable, JSON.stringify(actionable, null, 2)).toEqual([]);
});

test("questionnaire ai coach responds", async ({ page }) => {
  const issues = createIssueTracker(page);
  await page.goto(`${BASE_URL}/questionnaire`, { waitUntil: "networkidle" });
  await dismissTransientOverlays(page);

  const input = page.locator('input[placeholder*="Ask"], textarea[placeholder*="Ask"]').first();
  await expect(input).toBeVisible({ timeout: 15000 });
  await input.fill("hi");
  await input.press("Enter");

  await expect(page.locator("text=/temporarily|Please try again|Tony|Drew|understand/i").last()).toBeVisible({
    timeout: 20000,
  });

  const actionable = issues.filter((issue) => !(issue.type === "response" && issue.status === 429));
  expect(actionable, JSON.stringify(actionable, null, 2)).toEqual([]);
});

test("profiles can generate a profile", async ({ page }) => {
  const issues = createIssueTracker(page);
  await page.goto(`${BASE_URL}/profiles`, { waitUntil: "networkidle" });
  await dismissTransientOverlays(page);

  const button = page.getByRole("button", { name: /generate profile|regenerate profile/i }).first();
  await expect(button).toBeVisible({ timeout: 15000 });
  await button.click();

  await expect(
    page.locator("text=/Communication Style|Conflict Tendencies|Who You Are|How You Communicate/i").first(),
  ).toBeVisible({ timeout: 30000 });

  const bodyText = await page.locator("body").innerText();
  expect(bodyText.includes("hasn't been generated yet")).toBeFalsy();

  const actionable = issues.filter((issue) => !(issue.type === "response" && issue.status === 429));
  expect(actionable, JSON.stringify(actionable, null, 2)).toEqual([]);
});

test("analysis generates non-empty output", async ({ page }) => {
  const issues = createIssueTracker(page);
  await page.goto(`${BASE_URL}/analysis`, { waitUntil: "networkidle" });
  await dismissTransientOverlays(page);

  const button = page.getByRole("button", { name: /generate analysis/i }).first();
  await expect(button).toBeVisible({ timeout: 15000 });
  await button.click();

  await expect(page.locator("text=/Explain This|In-Depth|Summary|Action Plan/i").first()).toBeVisible({
    timeout: 30000,
  });

  const bodyText = await page.locator("body").innerText();
  expect(bodyText.includes("Analysis could not be generated. Please regenerate.")).toBeFalsy();

  const actionable = issues.filter((issue) => !(issue.type === "response" && issue.status === 429));
  expect(actionable, JSON.stringify(actionable, null, 2)).toEqual([]);
});

test("relationship chat returns a reply", async ({ page }) => {
  const issues = createIssueTracker(page);
  await page.goto(`${BASE_URL}/chat`, { waitUntil: "networkidle" });
  await dismissTransientOverlays(page);

  const input = page.locator('textarea[placeholder*="Ask"], textarea').last();
  await expect(input).toBeVisible({ timeout: 15000 });
  await input.fill("What does Tony need to feel heard?");
  await input.press("Enter");

  await expect(page.locator("text=/Tony|Drew|temporarily|relationship/i").last()).toBeVisible({
    timeout: 30000,
  });

  const actionable = issues.filter((issue) => !(issue.type === "response" && issue.status === 429));
  expect(actionable, JSON.stringify(actionable, null, 2)).toEqual([]);
});
