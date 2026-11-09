import http from "k6/http";
import { check, sleep } from "k6";

const targetVus = Number(__ENV.TARGET_VUS || 100);
const baseUrl = (__ENV.BASE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

export const options = {
  discardResponseBodies: true,
  scenarios: {
    catalog: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: Math.max(1, Math.ceil(targetVus * 0.1)) },
        { duration: "3m", target: targetVus },
        { duration: "5m", target: targetVus },
        { duration: "1m", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500", "p(99)<1000"],
  },
};

export default function () {
  const response = http.get(`${baseUrl}/api/products`, {
    headers: {
      // Exercise the API origin rather than a browser's fresh cache entry.
      "Cache-Control": "no-cache",
      Origin: __ENV.FRONTEND_ORIGIN || "http://localhost:3000",
    },
    tags: { endpoint: "catalog" },
  });

  check(response, {
    "catalog status is 200": (result) => result.status === 200,
    "catalog response is cacheable": (result) =>
      (result.headers["Cache-Control"] || "").includes("s-maxage"),
  });

  sleep(Number(__ENV.THINK_TIME_SECONDS || 1));
}
