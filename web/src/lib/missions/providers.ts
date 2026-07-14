import { type Campaign } from "@/lib/pipeline/types";
import { type ProviderCoverage } from "./types";

export interface ProviderRecord {
  id: string;
  title: string;
  date: string;
  url: string;
  body: string;
  provider: string;
}

export interface DecisionRouteProviderContext {
  dateWindow: { from: string; to: string };
  records: ProviderRecord[];
  coverage: ProviderCoverage[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function firstString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
    const nested = asRecord(value);
    if (nested) {
      const text = firstString(nested, ["name", "title", "description", "value"]);
      if (text) return text;
    }
  }
  return "";
}

function validHttpUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function parseParliamentJson(value: unknown, endpoint: string): ProviderRecord[] {
  const root = asRecord(value);
  const candidates = Array.isArray(value)
    ? value
    : root && [root.items, root.results, root.value, root.events].find(Array.isArray);
  if (!Array.isArray(candidates)) return [];

  return candidates.flatMap((candidate, index) => {
    const record = asRecord(candidate);
    if (!record) return [];
    const title = firstString(record, ["name", "title", "eventName", "committeeName", "description"]);
    if (!title) return [];
    const id = firstString(record, ["id", "eventId", "committeeId", "businessId"]) || `item-${index + 1}`;
    const date = firstString(record, ["date", "startDate", "eventDate", "publishedDate", "createdWhen"]);
    const suppliedUrl = firstString(record, ["url", "webUrl", "link", "parliamentUrl"]);
    const url = validHttpUrl(suppliedUrl) || endpoint;
    const body = firstString(record, ["description", "summary", "location", "status", "house"]);
    return [{ id: `parliament-${id}`, title, date, url, body, provider: "UK Parliament" }];
  });
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .trim();
}

function xmlField(record: string, names: string[]): string {
  for (const name of names) {
    const match = record.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (match?.[1]) return decodeXml(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
  }
  return "";
}

export function parseModernGovXml(xml: string, endpoint: string): ProviderRecord[] {
  const decoded = decodeXml(xml);
  const recordMatches = [...decoded.matchAll(/<(Meeting|Committee|Table|CalendarEvent)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)];
  return recordMatches.flatMap((match, index) => {
    const bodyXml = match[2];
    const title = xmlField(bodyXml, ["Title", "MeetingTitle", "CommitteeTitle", "Name", "CommitteeName"]);
    if (!title) return [];
    const id = xmlField(bodyXml, ["MeetingId", "CommitteeId", "Id", "ID"]) || `item-${index + 1}`;
    const date = xmlField(bodyXml, ["MeetingDate", "Date", "StartDate", "DateTime"]);
    const suppliedUrl = xmlField(bodyXml, ["URL", "Url", "WebUrl", "Link"]);
    const url = validHttpUrl(suppliedUrl) || endpoint;
    const body = xmlField(bodyXml, ["CommitteeName", "Venue", "Location", "Description"]);
    return [{ id: `moderngov-${id}`, title, date, url, body, provider: "ModernGov" }];
  });
}

export function detectModernGovServices(campaign: Campaign): string[] {
  const services = new Set<string>();
  for (const source of campaign.sources) {
    try {
      const url = new URL(source.url);
      const host = url.hostname.toLowerCase();
      if (!(host.endsWith(".gov.uk") || host === "gov.uk")) continue;
      if (/moderngov|mg[A-Z]|mgwebservice/i.test(`${host}${url.pathname}`)) {
        services.add(`${url.origin}/mgWebService.asmx`);
      }
    } catch {
      // Invalid source URLs are ignored and never fetched.
    }
  }
  return [...services];
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function modernGovDate(date: Date): string {
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function fetchXml(url: string): Promise<string> {
  const response = await fetch(url, { headers: { accept: "text/xml" }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

export async function loadDecisionRouteProviders(campaign: Campaign, now = new Date()): Promise<DecisionRouteProviderContext> {
  const from = new Date(now);
  from.setUTCFullYear(from.getUTCFullYear() - 1);
  const to = new Date(now);
  to.setUTCDate(to.getUTCDate() + 90);
  const fromDate = dateOnly(from);
  const toDate = dateOnly(to);
  const parliamentEndpoints = [
    `https://committees-api.parliament.uk/api/Broadcast/Meetings?FromDate=${fromDate}&ToDate=${toDate}`,
    "https://committees-api.parliament.uk/api/Committees?ShowOnWebsiteOnly=true&Take=30",
  ];

  const parliamentResults = await Promise.allSettled(parliamentEndpoints.map(async (endpoint) => ({
    endpoint,
    records: parseParliamentJson(await fetchJson(endpoint), endpoint),
  })));
  const parliamentSuccesses = parliamentResults.filter((result): result is PromiseFulfilledResult<{ endpoint: string; records: ProviderRecord[] }> => result.status === "fulfilled");
  const records = parliamentSuccesses.flatMap((result) => result.value.records);
  const coverage: ProviderCoverage[] = [{
    provider: "UK Parliament supported APIs",
    kind: "parliament_api",
    status: parliamentSuccesses.length === parliamentEndpoints.length ? "partial" : parliamentSuccesses.length ? "partial" : "unavailable",
    detail: parliamentSuccesses.length
      ? `${parliamentSuccesses.length} of ${parliamentEndpoints.length} supported committee and meeting endpoints responded. Relevance still requires reconciliation.`
      : "The supported committee and meeting endpoints did not respond during this run.",
    endpoint: "https://developer.parliament.uk/",
  }];

  const modernGovServices = detectModernGovServices(campaign);
  if (!modernGovServices.length) {
    coverage.push({
      provider: "Council ModernGov services",
      kind: "moderngov_api",
      status: "not_applicable",
      detail: "No supported ModernGov service was detected in the campaign evidence. Council coverage requires official-domain research.",
    });
  } else {
    for (const service of modernGovServices) {
      const params = new URLSearchParams({
        lCommitteeId: "0",
        sFromDate: modernGovDate(from),
        sToDate: modernGovDate(to),
        bIsAscendingDateOrder: "true",
      });
      const endpoints = [
        `${service}/GetCommittees`,
        `${service}/GetAllMeetingsByDate?${params}`,
      ];
      const results = await Promise.allSettled(endpoints.map(async (endpoint) => parseModernGovXml(await fetchXml(endpoint), endpoint)));
      const successes = results.filter((result): result is PromiseFulfilledResult<ProviderRecord[]> => result.status === "fulfilled");
      records.push(...successes.flatMap((result) => result.value));
      coverage.push({
        provider: new URL(service).hostname,
        kind: "moderngov_api",
        status: successes.length === endpoints.length ? "partial" : successes.length ? "partial" : "unavailable",
        detail: successes.length
          ? `${successes.length} of ${endpoints.length} detected ModernGov operations responded. Meeting relevance and missing minutes still require reconciliation.`
          : "The detected ModernGov service did not return usable committee or meeting data.",
        endpoint: service,
      });
    }
  }

  coverage.push({
    provider: "Official-domain web research",
    kind: "official_web",
    status: "partial",
    detail: "Researchers may fill API gaps from primary Parliament, council and public-body pages. Unfound or unsupported records remain incomplete.",
  });

  return { dateWindow: { from: fromDate, to: toDate }, records: records.slice(0, 80), coverage };
}
