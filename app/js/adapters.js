/* Data adapters — the seam where live integrations replace static data.
   Every adapter returns { status, source, data } where status is one of:
   'preloaded' (real static data shipped with the app), 'mock' (realistic but
   invented, always labelled), 'placeholder' (future API integration).

   Verified-open sources for each adapter (live-checked 11 Jul 2026):
   - councilAdapter      → ModernGov/CMIS council sites (HTML+PDF), Open Council Data (CC0 CSV)
   - electoralAdapter    → postcodes.io (keyless), ONS NSPL (bulk), Parliament Members API (keyless)
   - consultationAdapter → GOV.UK search API, Citizen Space /api/2.4, Go Vocal /web_api/v1
   - contextAdapter      → ONS census-observations, Nomis, Fingertips, data.police.uk, DfT STATS19, GIAS bulk CSV
   - mediaAdapter        → ICNN/Impress directories + human-verified contacts (no open API for journalists)
   - orgsAdapter         → Charity Commission API (key), Companies House API (key), 360Giving
   - hansardAdapter      → TheyWorkForYou / Hansard / Members API (keyless)
   Replace the bodies below with real calls; keep the return shape. */

window.CF_ADAPTERS = {
  electoral: {
    /** Postcode → ward, constituency, MP. Live: postcodes.io + members-api.parliament.uk */
    lookup(postcodeOrPlace) {
      const hay = " " + (postcodeOrPlace || "").toLowerCase() + " ";
      const auth = (window.CF_AUTHORITIES || []).find(a =>
        a.match.some(m => new RegExp("(^|[^a-z0-9])" + m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[^a-z0-9])").test(hay)));
      if (auth) return { status: "preloaded", source: "Preloaded public data — UK local authority register", data: auth };
      return { status: "placeholder", source: "Future API integration — postcodes.io / Parliament Members API", data: null };
    }
  },
  council: {
    /** Committees, meeting dates, decision calendars. Live: ModernGov scrape + cache */
    meetings() { return { status: "placeholder", source: "Future API integration — council democracy portal (ModernGov/CMIS)", data: null }; },
    /** Named officeholders (portfolio holders, officers). Never invented. */
    officeholders(auth) {
      if (auth && auth.verified) return { status: "preloaded", source: "Preloaded public data — verified 11 Jul 2026", data: true };
      return { status: "placeholder", source: "External source required — the council's own website lists cabinet members and committee chairs", data: null };
    }
  },
  consultations: {
    open() { return { status: "placeholder", source: "Future API integration — GOV.UK search API · Citizen Space · Go Vocal", data: null }; }
  },
  context: {
    demographics() { return { status: "placeholder", source: "Future API integration — ONS census-observations / Nomis / Fingertips", data: null }; }
  },
  media: {
    outlets(mediaKey) {
      const list = (window.CF_MEDIA || {})[mediaKey] || window.CF_MEDIA.generic;
      return { status: "preloaded", source: "Preloaded public data — real outlet names; contacts require human verification", data: list };
    },
    contacts() { return { status: "mock", source: "Mock contact for prototype — never pitch without a human-verified name", data: window.CF_MEDIA_MOCK_CONTACTS }; }
  },
  orgs: {
    localGroups() { return { status: "placeholder", source: "Future API integration — Charity Commission register API (key required)", data: null }; }
  }
};
