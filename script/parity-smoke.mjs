// Smoke test against deployed parity worker. Usage:
// WORKER_URL=https://reflectivai-api-parity-v2.tonyabdelmalak.workers.dev node script/parity-smoke.mjs
// Defaults to parity v2 URL if env not set.

const BASE = process.env.WORKER_URL || "https://reflectivai-api-parity-v2.tonyabdelmalak.workers.dev";
const SID = `smoke-${Date.now()}`;

function pass(name) {
    console.log(`PASS ${name}`);
}

function fail(name, info) {
    console.error(`FAIL ${name}: ${info}`);
    process.exitCode = 1;
}

async function req(method, path, body) {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "x-session-id": SID,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try {
        data = await res.json();
    } catch { }
    return { res, data };
}

async function main() {
    console.log(`Using worker: ${BASE}`);
    console.log(`Session: ${SID}`);

    // Clear chat
    {
        const { res } = await req("POST", "/api/chat/clear");
        if (res.ok) pass("chat/clear");
        else fail("chat/clear", res.status);
    }

    // Chat send
    let sendData;
    {
        const { res, data } = await req("POST", "/api/chat/send", { message: "Test parity" });
        sendData = data;
        const ok = res.ok && data?.messages?.length >= 2 && data.messages.at(-1)?.role === "assistant" && Array.isArray(data?.signals);
        if (ok) pass("chat/send");
        else fail("chat/send", JSON.stringify(data));
    }

    // Chat messages
    {
        const { res, data } = await req("GET", "/api/chat/messages");
        const ok = res.ok && Array.isArray(data?.messages) && data.messages.length >= 2;
        if (ok) pass("chat/messages");
        else fail("chat/messages", JSON.stringify(data));
    }

    // Dashboard insights
    {
        const { res, data } = await req("GET", "/api/dashboard/insights");
        const ok =
            res.ok &&
            data?.dailyTip &&
            data?.focusArea &&
            data?.suggestedExercise &&
            data?.motivationalQuote &&
            (data?.source === "ai" || data?.source === "preset");
        if (ok) pass("dashboard/insights");
        else fail("dashboard/insights", JSON.stringify(data));
    }

    // Daily focus
    {
        const { res, data } = await req("GET", "/api/daily-focus");
        const ok = res.ok && data?.focus && data?.category && data?.timestamp && (data?.source === "ai" || data?.source === "preset");
        if (ok) pass("daily-focus");
        else fail("daily-focus", JSON.stringify(data));
    }

    // Summary
    {
        let { res, data } = await req("POST", "/api/chat/summary", {});
        if (!res.ok && (res.status === 404 || res.status === 405)) {
            ({ res, data } = await req("GET", "/api/chat/summary"));
        }
        const ok = res.ok && data && "summary" in data;
        if (ok) pass("chat/summary");
        else fail("chat/summary", JSON.stringify(data));
    }

    if (process.exitCode) {
        console.error("Smoke test completed with failures");
    } else {
        console.log("Smoke test completed: PASS");
    }
}

main().catch((err) => {
    console.error("Smoke test error", err);
    process.exitCode = 1;
});
