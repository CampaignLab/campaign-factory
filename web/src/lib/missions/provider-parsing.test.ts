import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { detectModernGovServices, parseModernGovXml, parseParliamentJson } from "./providers";
import { type Campaign } from "@/lib/pipeline/types";

describe("official provider parsing", () => {
  it("parses UK Parliament resource collections", () => {
    const fixture = JSON.parse(readFileSync(new URL("./__fixtures__/parliament-committees.json", import.meta.url), "utf8"));
    const records = parseParliamentJson(fixture, "https://committees-api.parliament.uk/api/Committees");
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ id: "parliament-142", provider: "UK Parliament" });
    expect(records[0].url).toMatch(/^https:\/\//);
  });

  it("parses ModernGov XML meeting records", () => {
    const fixture = readFileSync(new URL("./__fixtures__/moderngov-meetings.xml", import.meta.url), "utf8");
    const records = parseModernGovXml(fixture, "https://democracy.example.gov.uk/mgWebService.asmx/GetAllMeetingsByDate");
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ id: "moderngov-3184", title: "Cabinet", body: "Civic Centre" });
    expect(records[0].url).toContain("MId=3184");
  });

  it("detects only official-domain ModernGov services", () => {
    const campaign = {
      sources: [
        { url: "https://democracy.example.gov.uk/mgCommitteeDetails.aspx?ID=8" },
        { url: "https://attacker.example/mgWebService.asmx" },
      ],
    } as Campaign;
    expect(detectModernGovServices(campaign)).toEqual(["https://democracy.example.gov.uk/mgWebService.asmx"]);
  });
});
