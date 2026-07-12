# From Hyperlocal Issue to Campaign Factory

## Executive recommendation

The strongest conference prototype is a **county- or city-level “campaign factory” that begins with a single hyperlocal issue template and then reveals how the same pipeline can be cloned across many places**. For this audience, the most convincing template is **a school-street or safer-school-run issue**, because it is legible in seconds, routinely documented by councils, naturally tied to wards, councillors, MPs, local media, transport and public-health data, and can plausibly be argued from more than one legitimate campaigning perspective. The best primary scenario from the July 2026 evidence reviewed here is **Leicester, Clarendon Park, around St John the Baptist CofE Primary School**, where Leicester City Council announced an experimental school-street scheme in May 2026, describing it as resident- and school-community-led and explicitly linked to road-safety and congestion concerns. citeturn20search6

For the live event, I recommend **one location, one scout agent, one evidence challenge, then successive visible handoffs**: issue detection, evidence verification, strategy and power mapping, lobbying research, content generation, and finally a “run this everywhere” factory view. The demo should be **partly live and partly pre-cached**. The live parts should be limited to resilient endpoints and small calls: postcode-to-ward/constituency resolution, one or two official-data pulls, one evidence cross-check, and one model-generated synthesis. The brittle parts—PDF-heavy council papers, scraped committee pages, local-news enrichment, and long content packs—should be pre-fetched and cached, because council democracy portals, consultations hubs, and PDF attachments are too operationally fragile to trust entirely on stage. That recommendation follows directly from the fragmented state of local UK civic-data publishing: some national datasets now have robust APIs, while local agendas, minutes, board papers, and transparency documents are still largely spread across individual authority sites, many using ModernGov-style pages or PDF uploads rather than reliable uniform APIs. citeturn18search1turn18search9turn18search15turn18search18turn34view0

The most important design choice is **not to pretend the entire stack is “just agents.”** A credible prototype should show that much of the system is deterministic: postcode and geography joins, URL discovery, HTML extraction, CSV ingestion, citation binding, entity resolution by code lists, and orchestration should be ordinary software. Agents should be saved for tasks where they are genuinely additive: ranking messy possible issues, identifying contradictions, producing stakeholder hypotheses, drafting strategy options, adapting content for different campaign frames, and surfacing uncertainties for human review. That division is essential both for reliability and for the democratic point of the demonstration: the unsettling part is not merely that models can write, but that **they can sit on top of reliable public-data plumbing and massively reduce the amount of distributed local human effort previously needed to research and package campaign action**. citeturn40search0turn10search0turn27view0turn34view0turn19search9

The recommended implementation is a **Python-first backend with a lightweight custom orchestration harness, ordinary function tools, structured JSON outputs, PostgreSQL plus PostGIS for canonical entities, DuckDB for fast batch analytics, a file cache for PDFs and HTML, and a simple React or Next.js dashboard**. MCP is optional, not required. For a conference prototype, ordinary function tools are lower-risk than adding another dispatch layer. The UI should keep three things visible at almost all times: **source citations, agent traces, and human approval gates**. Without those, the demo will look magical but not trustworthy; with them, the audience can see both the capability and the danger. That is the right ending for the panel discussion that follows. citeturn40search0turn34view0turn19search9turn25search1turn35search0

## Verified source catalogue

What follows is the most useful **July 2026** UK public/open-data stack I could verify for this use case. The headline finding is that **national data is increasingly API-friendly, while local democratic records remain fragmented and should be treated as a discovery-and-ingestion problem, not an API problem**. citeturn34view0turn18search1turn18search9turn18search15turn18search18

**Local authority, public-body, planning, procurement, and civic-process sources**

| Source | Responsible organisation | URL | What it provides | Granularity | Update rhythm | Access method | Auth | Licence / reuse | Reliability, coverage, known issues, live-demo suitability, sample retrieval | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| Planning Data platform datasets | MHCLG | `https://www.planning.data.gov.uk/` | Structured planning and local-plan datasets, including local authorities, plan timetables, CIL schedules, brownfield and selected planning-related datasets | England; authority to site/dataset level | Varies by dataset | API / CSV / JSON | None | OGL v3.0 | Strong for some planning reference datasets, but **planning applications remain incomplete and stale nationally**: the planning-application dataset showed only 6 providers and last collector activity in September 2025, so it is **not sufficient as the sole live source for nationwide current applications**; use as enrichment, not source of truth. Sample: `.../dataset/local-authority`, `.../dataset/plan-timetable`, `.../dataset/brownfield-land.csv`. | citeturn25search9turn25search11turn25search12turn25search14 |
| Open Data Communities | MHCLG | `https://opendatacommunities.org/` and service transition announcement at `https://mhclgdigital.blog.gov.uk/...` | MHCLG open releases, including local-government and housing-related data collections | England, mostly authority and subauthority | Varies by release | Bulk download / web access | None | Open/open-government style reuse on the service; platform transition underway | Important as a catalogue and release channel, but the platform itself is in transition in July 2026, so build with caching and dataset-specific adapters rather than hard-coding one ODC parser. | citeturn14search22 |
| Contracts Finder | Cabinet Office / GOV.UK | `https://www.contractsfinder.service.gov.uk/` | UK public procurement notices and search | Buyer / contract / region | Frequent / ongoing | Search UI, API, bulk import docs | Search is public; some API operations require token/Sid4Gov credentials | GOV.UK content under OGL unless stated otherwise | Good for procurement discovery, but parts of the API documentation are aimed at notice publishers and authenticated integrations. For demo use, prefer search UI plus cached pull from search endpoints. Sample docs show `search_notices` endpoints in v2. | citeturn34view1turn33search1 |
| Find a Tender OCDS/API | Cabinet Office / GOV.UK | `https://www.find-tender.service.gov.uk/Developer/Documentation` | UK tender notices in OCDS JSON and XML | Buyer / contract / procurement notice | Frequent / ongoing | OCDS API, XML downloads, data.gov bulk | Public data outputs available; submission endpoints require auth | Notice data under OGL | Strong for procurement notices and transparency at scale. Distinguish carefully between **public outputs** and **authenticated submission APIs**. Sample public output route family: OCDS release/record package APIs from developer docs. | citeturn34view0turn34view2 |
| Council democracy portals | Individual councils; often ModernGov, CMIS, Civic, or bespoke | Example patterns: `https://democracy.greatermanchester-ca.gov.uk/`, `https://governance.southyorkshire-ca.gov.uk/`, council-specific `ieListDocuments...` pages | Agendas, reports, minutes, decisions, future meetings, committee memberships | Authority / committee / meeting / document | Near-real-time around meetings | HTML, PDF, sometimes RSS/ICS | None | Council-specific terms; many pages are public-sector open-publication pages | This is the **core source class** for hyperlocal issue discovery, but it is fragmented. Suitability is high **if pre-cached** and if the demo uses one known authority. Sample retrieval: discover meetings page, enumerate future/past meetings, extract document links, cache PDFs before event. | citeturn18search1turn18search3turn18search15turn18search17turn24search1turn24search4 |
| Combined-authority governance portals | Individual combined authorities | Examples: `https://democracy.greatermanchester-ca.gov.uk/`, `https://governance.southyorkshire-ca.gov.uk/`, `https://www.westyorks-ca.gov.uk/governance/meetings-and-committees/` | Board papers, agendas, minutes, decisions, constitutional rules | Combined authority / board / committee | Near-real-time around meetings | HTML + PDF | None | Public-sector publication terms | Excellent for transport, economic strategy, skills, and mayoral decisions. Better structured than many district-council portals. Highly suitable for demo if cached. | citeturn18search1turn18search3turn18search9turn18search19 |
| ICB board meetings and papers | NHS Integrated Care Boards | Example patterns on ICB sites | Public board papers, meeting dates, questions process, minutes | ICB / committee / document | Around each board meeting | HTML + PDF | None | NHS site terms; public documents | Very useful for local healthcare campaigns, but structurally fragmented and accessibility quality varies by board. Best for pre-cached demos. | citeturn18search0turn18search2turn18search8turn18search12turn18search16turn18search18 |
| Council and public-body consultations | GOV.UK departments and local authorities | Examples: GOV.UK search, council consultation hubs | Open consultations, outcomes, background docs | National to local | While live; archived after close | HTML, PDF, survey links | Usually none | GOV.UK under OGL unless stated; local terms vary | Strong intervention-point source because it directly reveals timelines and decision windows. For local campaigns, council “have your say” hubs are often more actionable than minutes. | citeturn17search1turn17search2turn20search7turn20search16turn23search12 |
| UK Government and Parliament petitions | UK Government and Parliament | `https://petition.parliament.uk/` | Petition text, status, signature counts, constituency search | Petition / constituency | Frequent while open | Web access | None | Public parliamentary service terms | Useful as a public-salience signal, but it is national rather than hyperlocal unless tied back to constituency search and local issue framing. | citeturn17search0turn17search6turn17search11 |
| Open Council Data UK | Independent civic-data publisher | `https://opencouncildata.co.uk/` | Councillor archives, council compositions, wards, by-elections, some communications datasets | UK council / ward / councillor | Frequently updated; live stats shown July 2026 | CSV downloads / web | None for free CSVs | Site states CSV downloads are public domain; site content CC BY-SA-style attribution | Not an official source, but one of the best verified **cross-council convenience layers** for councillor composition/history. Use as acceleration, then verify against authority pages when material. Highly useful for demo backups. | citeturn15search1turn15search5turn15search9turn15search10 |
| Local authority open-data / transparency pages | Individual councils | Examples: Merton, Preston | Spending reports, FOI/open-data catalogues, transparency releases | Authority | Usually monthly/quarterly/annual | Web / CSV / manual download | None | Often OGL or council-stated reuse terms | Valuable but inconsistent. There is no single robust UK-wide verified API for council transparency packs in this research pass; treat as a discovery-and-cache layer. | citeturn14search11turn14search20 |

**Demographics, labour market, health-context, geography, and environmental sources**

| Source | Responsible organisation | URL | What it provides | Granularity | Update rhythm | Access method | Auth | Licence / reuse | Reliability, coverage, known issues, live-demo suitability, sample retrieval | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| ONS API | Office for National Statistics | `https://developer.ons.gov.uk/` | Programmatic access to ONS datasets including Census 2021 and other series | UK to small-area depending dataset | Dataset-specific | API | None | ONS open material generally under OGL | Excellent for current official statistics. ONS states the API is open and unrestricted, with no API keys required. Sample: `/datasets/TS008/editions/2021/versions/1/json`. | citeturn40search0turn40search11turn40search2 |
| Nomis API | Durham University on behalf of ONS / Nomis | `https://www.nomisweb.co.uk/` | Labour market, claimant count, earnings, business demography, population and related datasets | UK to local authority, ward/LSOA for some tables | Dataset-specific | API / bulk / profiles | Usually no key for open datasets; some datasets are restricted/licensed | OGL for ONS material; some restricted tables require licence | One of the best “campaign context” sources. Important caveat: some tables, such as parts of BRES, are restricted and require a licence, while others are open. Use open-access tables for demo. | citeturn39search4turn39search1turn39search6 |
| OHID Fingertips API | DHSC / Office for Health Improvement and Disparities | `https://fingertips.phe.org.uk/api` | Public-health indicators, health profiles, inequalities, outcomes | England; many indicators at LA and some smaller-area levels | Dataset/profile-specific | API / CSV | None | Public-sector reuse; site provides API and exports | Very useful for fast contextual packs. Known issue: ward-level small-area access changed in 2025; the main tool removed ward-level display but separate ward-level files remain available. | citeturn9search1turn9search4turn9search8turn9search16 |
| NHS Organisation Data Service APIs | NHS England | `https://digital.nhs.uk/developer/api-catalogue/organisation-data-service-ord` | Reference data for NHS organisations, sites, relationships, succession | England and Wales organisation level | Maintained reference data | API | Public API, standard developer access | NHS terms; public reference data | Essential for joining ICBs, trusts, GP practices, and sites across datasets. Highly suitable for entity resolution. | citeturn9search3turn9search15 |
| Appointments in General Practice | NHS England / NHS Digital publication | `https://digital.nhs.uk/data-and-information/publications/statistical/appointments-in-general-practice` | GP appointment counts and characteristics | National to sub-ICB and practice coverage | Monthly | Publication, downloadable data | None | NHS publication terms | Strong for healthcare capacity arguments. Best used as supporting context rather than first-stage issue detection. | citeturn8search2turn8search7turn8search10 |
| NHSBSA Open Data Portal | NHS Business Services Authority | `https://opendata.nhsbsa.net/` | Open data products including prescribing, dentistry, payments and other NHSBSA-administered services | Varies by dataset | Dataset-specific | API + download portal | Public; some portal registration patterns may apply depending product | NHSBSA portal terms | Good for dentistry, prescribing and grant/payment context. Use selectively. | citeturn8search1turn8search4 |
| ONS Open Geography Portal | ONS Geography | `https://geoportal.statistics.gov.uk/` | Boundaries, postcode products, registers of geographic codes, lookup tables | UK from postcode to national geographies | Frequent releases by product | Download / ArcGIS-hosted tables | None | OGL v3.0 | Core mapping source. Very suitable for demo if ingested locally before the event. | citeturn39search2turn39search5turn39search19 |
| ONS Postcode Directory / NSPL | ONS Geography | ONSPD/NSPL items on Open Geography Portal | Postcode to geography lookups, administrative codes, NHS and statistical areas | Postcode unit | Quarterly-ish release cycle evident in Feb/May 2026 releases | Bulk CSV / hosted tables | None | OGL v3.0 | Critical for postcode-to-ward/constituency/LSOA pipelines. Best to mirror locally. | citeturn13search0turn13search1turn13search4turn13search5turn13search12turn13search24 |
| Code-Point Open | Ordnance Survey | `https://www.ordnancesurvey.co.uk/products/code-point-open` | Open GB postcode point dataset with local government and NHS codes | GB postcode unit | Updated quarterly | Bulk download | None | Free to use; OS OpenData terms | Good postcode-point fallback for spatial work, though it does not cover Northern Ireland. | citeturn13search3turn13search11turn13search15 |
| data.police.uk API and downloads | UK police open-data service | `https://data.police.uk/` | Street-level crime, outcomes, stop and search, neighbourhood teams, force data | England, Wales, Northern Ireland; street/LSOA/force | Monthly archives and API availability | API + CSV archives | None | Open public police-data terms | Excellent for hyperlocal crime and disorder context. Known issue: data are anonymised and spatially displaced/aggregated, so use for patterns, not exact-address claims. | citeturn10search0turn10search4turn10search12turn10search16 |
| Environment Agency Flood Monitoring API | Environment Agency | `https://environment.data.gov.uk/flood-monitoring/doc/reference` | Flood warnings, alert areas, water levels, flows, stations | England, station/area/catchment | Near-real-time | API | None | Public EA/Defra open-data terms | Excellent live-demo source because the API is stable and current. | citeturn10search1turn10search5turn10search19 |
| Environment Agency Water Quality / Catchment / Hydrology APIs | Environment Agency / Defra DSP | `https://environment.data.gov.uk/water-quality/api-docs`, `https://environment.data.gov.uk/catchment-planning/api/docs`, `https://environment.data.gov.uk/hydrology/doc/reference` | Water-quality samples, catchment status, historic hydrology | England, sampling point/catchment/water body | Ongoing; archive + current | API | None | OGL / EA terms on platform | Very useful for bathing-water, river-health, and pollution campaigns. Known issue: API changes occurred; third-party guidance notes the old water-quality API was retired in December 2025, so pin to current documented endpoints only. | citeturn11search1turn11search3turn11search4turn11search10turn11search16 |
| UK-AIR / Defra air-quality services | Defra | `https://uk-air.defra.gov.uk/` | Air-quality monitoring, forecasts, network maps, measured data, APIs/SOS services | UK, site and network level | Ongoing | Web tools + API/SOS + downloads | None | Defra open-data policy / OGL-style public availability | Strong for air-quality framing, though less turnkey than simple JSON APIs. Pre-cache for demo. | citeturn10search2turn10search6turn10search10turn10search14turn10search22 |

**Parliament, elections, organisations, media, grants, and platform-transparency sources**

| Source | Responsible organisation | URL | What it provides | Granularity | Update rhythm | Access method | Auth | Licence / reuse | Reliability, coverage, known issues, live-demo suitability, sample retrieval | Verification |
|---|---|---|---|---|---|---|---|---|---|---|
| UK Parliament Developer Hub and APIs | UK Parliament | `https://developer.parliament.uk/` | Directory of official open-data APIs | Parliament-wide | Ongoing | API catalogue | Varies by endpoint; many public | Open Parliament Licence | Canonical starting point for official parliamentary data integrations. | citeturn19search9turn19search19 |
| Members API | UK Parliament | `https://members-api.parliament.uk/` | Current and historical MPs/Lords, parties, memberships, constituencies | Member / constituency | Ongoing | API | Public | Open Parliament Licence | Excellent for constituency resolution and current-member lookups. Sample: member search endpoints from the API index. | citeturn19search3 |
| Hansard | UK Parliament | `https://hansard.parliament.uk/` | Debates, member contributions, petitions, divisions | Debate / speech / division / member | Next working day publication for daily debates | Search UI, official web | None | Open Parliament Licence / parliamentary terms | Best official source for statements and debate context. Very suitable for briefing packs and quoted positions. | citeturn19search2turn19search14 |
| Commons Votes API / Votes in Parliament | UK Parliament | `https://votes.parliament.uk/` and Commons Votes API swagger | House of Commons divisions and member votes | Vote / member | Ongoing | API + web | Public for results; submission/admin not relevant | Parliamentary open-data terms | Strong official voting-record source. Docs note older Digiminster URLs were deprecated by March 2026. | citeturn19search0turn19search1 |
| Committee publications and committee sites | UK Parliament | `https://committees.parliament.uk/` | Committee reports, inquiries, publications, news | Committee / publication | Ongoing | Web / feeds where available | None | Parliamentary terms | Important for issue packs where select committees have already investigated the topic. | citeturn17search14 |
| Electoral Commission Election Information API | Electoral Commission | `https://api.electoralcommission.org.uk/` | Elections, councils, candidates, polling stations from postcode or UPRN | Address/postcode/council/election | Current/upcoming elections | API | **API key required** | Electoral Commission developer terms | New alpha service in July 2026; useful for schedules and current electoral context. Sample: `/api/postcode/{postcode}` then `/api/address/{UPRN}`. | citeturn25search1turn27view1 |
| Electoral Commission registers search | Electoral Commission | `https://search.electoralcommission.org.uk/` | Party registrations, donations, loans, spending, accounts | Entity / donation / spending return | Ongoing | Search UI | None for search UI | Electoral Commission terms | Best official source for political finance and party-registry checks, though not as developer-friendly as a modern API. | citeturn29search0turn29search8turn29search11turn29search15 |
| Democracy Club API | Democracy Club | `https://developers.democracyclub.org.uk/api/v1/` | Upcoming ballots, candidates, polling stations, electoral services, postcode/address resolution | Address/postcode/election | Focused on upcoming elections | API | **API key required; private beta** | Terms of use apply | Valuable practical election-data layer, especially for postcode/address and candidate lists, but not a source for historical winners/results. Use as optional secondary source, not primary official source. | citeturn28view1turn27view2 |
| Election results collections on data.gov.uk | data.gov.uk / publishers such as UK Parliament, councils, GLA | `https://www.data.gov.uk/collections/government` | National and local election-result datasets | Constituency / authority / candidate | Dataset-specific | Bulk download / CKAN API | None | Dataset-specific; often OGL | Good for historic election results, especially where official parliamentary or council datasets exist. Coverage is uneven by publisher. | citeturn29search2turn29search4turn29search7turn29search12 |
| Charity Commission Register API and bulk register | Charity Commission for England and Wales | `https://register-of-charities.charitycommission.gov.uk/` | Charity metadata, finances, trustees/public register information | Charity / organisation | Ongoing; register download available | API + bulk download + web | **API key required** | Commission terms; public register data | Good for stakeholder discovery and ally mapping in England and Wales. Official docs state the API is beta and rate-limited. | citeturn12search2turn12search7turn27view0 |
| Companies House API and data products | Companies House | `https://developer.company-information.service.gov.uk/` and `https://download.companieshouse.gov.uk/` | Live company register data, officers, filings, bulk snapshots, PSC and accounts products | Company / filing / officer | Live API plus monthly/daily products | API + bulk + streaming | **API key / Basic auth** for public REST; OAuth for some functionality | Public register reuse under GOV.UK/OGL context, with service-specific terms | Excellent for company and landowner/developer/stakeholder checks. Rate limit documented at 600 requests per 5 minutes. | citeturn12search0turn31search0turn31search1turn31search2turn32search3turn32search10 |
| 360Giving API and standard | 360Giving | `https://www.360giving.org/api-docs/` | UK grants data from funders, including government and trusts using the 360Giving standard | Grant / funder / recipient / geography depending dataset | Ongoing; data updated on platform | API / JSON | No auth; rate limiting applies | API terms plus publisher dataset licences; standard docs under CC BY 4.0 | One of the best sources for campaign-funding landscape and local civil-society support mapping. CHECK publisher-level licensing before heavy reuse. | citeturn35search0turn36search0turn36search4 |
| ICNN members directory and map | Independent Community News Network | `https://www.communityjournalism.co.uk/icnn-members/` | Member publications and independent local/community journalism network | Publication / geographic spread | Maintained directory | Web | None | Site terms | Useful for local-public-interest media discovery where formal press databases are unavailable or expensive. | citeturn16search1turn16search5 |
| Impress member directory | Impress | `https://www.impressorg.com/join-us/our-members/member-directory/` | Member publishers and publications in the UK regulated independent press network | Publication / publisher | Maintained directory | Web | None | Site terms | Useful secondary local-media discovery source. | citeturn16search18turn16search21 |
| Meta Ad Library API | Meta | `https://www.facebook.com/ads/library/api/` | Political/issue ads globally for 7 years; all ads delivered to the UK or EU during the past year; spend, impressions and demographics for political/issue ads and UK/EU ad transparency fields | Ad / page / country | Ongoing | Graph API | **Developer account + identity/location confirmation + access token** | Meta platform/ToS | Strongest programmatic public-ad-transparency source in this set. Suitable for demo only if pre-authorised and token-tested; not something to set up on the morning of the event. Sample: Graph API `ads_archive` query. | citeturn37view0 |
| Google Ads Transparency Center | Google | Public transparency UI | Ad disclosures for Google/YouTube ads | Ad / advertiser | Ongoing | Web UI; limited API access by jurisdiction | Public UI; API access not general for UK | Google terms | Important negative finding: Google’s help documentation says API access to Ads Transparency Center data is for ads served in the **EEA**, while outside the EEA Google may provide API access only to regulators/self-regulatory organisations. For a UK campaign demo, assume **manual UI only**, not general API access. | citeturn37view2 |
| YouTube Data API v3 | Google | `https://developers.google.com/youtube/v3` | Channel/video metadata, search, comments and related public YouTube data | Video / channel | Ongoing | API | API key or OAuth; quota-limited | YouTube API policies | Good for local-campaign and politician-video research. Default quota is documented; use sparingly. | citeturn7search9turn7search2turn7search6turn7search18 |
| Bluesky public APIs / AT Protocol | Bluesky / atproto | `https://docs.bsky.app/` | Public posts, profiles, feeds, repo exports, federated social data | Account / post / feed | Ongoing | HTTP APIs | Public reads vary by endpoint; auth patterns depend on service; public repo exports can be unauthenticated | Open protocol / service-specific terms | Good optional social-signal source. Official docs emphasise that Bluesky is not one centralized API and that hosts/auth differ; repository exports of public content can be unauthenticated. Use cautiously and cache results. | citeturn37view3turn38search0turn38search5turn38search8turn38search15 |

**What this means for the prototype**

The **best currently available UK stack in July 2026 is hybrid**. Use official national APIs wherever they exist, but for local documents assume you will need **authority registries + search/discovery + HTML/PDF extraction + cache**. In other words, the “public-data discovery” layer is as important as the “LLM” layer. The catalogue above is good enough to build a real conference prototype, but not a fully automated national production platform without a substantial crawler and operations effort. citeturn34view0turn18search1turn18search9turn18search15turn18search18turn25search14

## Candidate issues and recommended scenario

The best demo issues are the ones that quickly become legible, have documentary evidence from more than one public source, and point to a recognisable decision-maker. The following candidates are real July 2026-ready options.

| Candidate | Location | Issue | Evidence available | Decision-makers | Allies / blockers | Demo strengths | Risks | Recommended use |
|---|---|---|---|---|---|---|---|---|
| **Primary: school-street trial** | Leicester, Clarendon Park, around St John the Baptist CofE Primary School | Leicester City Council announced an experimental school-street scheme prohibiting general traffic on school-run roads at peak times, explicitly linking it to road safety and congestion and stating it followed requests from residents and the school community. | Leicester council announcement; ward/constituency and deprivation joins via ONS/NSPL; councillor/MP lookup via Parliament/Open Council Data; supplemental traffic/crime/public-health context via police/ONS/Fingertips. | Leicester City Council highways decision-makers, ward councillors, local MP, school leadership. | Allies could include school leadership, parents seeking safety, active-travel and clean-air advocates; blockers could include residents opposed to access restrictions, some drivers/businesses. | Instantly understandable; easy to map; naturally produces a power map; same evidence can plausibly support pro-, anti-, or redesign-oriented campaigns; replicable nationwide. | Moderate controversy; risk of appearing to endorse one side unless the demo explicitly shows multiple legitimate framings. | **Use live with pre-cached evidence pack.** Best overall choice. | citeturn20search6turn40search0turn13search1turn19search3turn15search1 |
| **Backup: active school-street consultation** | Brent, around Harris Primary Academy area | Brent opened a consultation in June 2026 on a local school-street safety scheme covering named roads around Harris Primary Academy. | Brent consultation page and leaflet; postcode/ward joins; councillor lookup; local demographics from ONS. | Brent Council transport/highways and ward councillors. | School community and road-safety groups vs residents opposing restrictions or displacement. | Very good because the issue is visibly in consultation, so the intervention point is obvious. | Consultation timing may shift; council hub performance and PDFs should be cached. | **Use as backup or pre-cached alternative.** | citeturn20search7turn20search14turn13search1turn19search3 |
| **Backup: bus-route change controversy** | Barnes, London | TfL proposed changes to local bus routes including extending route 209 and withdrawing most of route 533, while changing 378 and 485. | TfL consultation page; ONS age/disability/car ownership context; councillors/MPs; local-media and petition discovery. | TfL, London borough councillors, London Assembly members, MP. | Public-transport users, disability and older-person groups, local businesses, residents’ groups. | Clean public consultation with a clear “who decides” story; naturally leads to stakeholder and audience segmentation. | More transit-specific; requires London governance explanation on stage. | **Good backup, especially if audience is London-heavy.** | citeturn21search3turn25search1turn19search3 |
| **Pre-cached only: school closure** | Brighton & Hove, Middle Street Primary School | Brighton & Hove cabinet papers in 2026 set out consultation and statutory steps for closure because the school was judged not financially viable. | Cabinet report with consultation chronology; demographics and place context; parliamentary/council actors; local press. | Cabinet, ward councillors, DfE regional actors, school community. | Parents, staff, unions, community groups vs fiscal/viability arguments. | Very high emotional clarity and rich documentary trail. | **Higher reputational and ethical risk** because it concerns a named school and children; easy to seem exploitative. | **Keep as a pre-cached backup, not first choice.** | citeturn22search0turn22search4 |
| **Pre-cached alternative: bathing-water designation** | River Thames at Ham and Kingston or another 2026 proposed/newly designated site | Defra consulted in early 2026 on 13 proposed bathing waters, while guidance and government responses set a clear process and criteria for designation from May 2026. | Defra consultation, government response, EA water-quality/catchment data, local consultation evidence, borough/council and parliamentary actors. | Defra, Environment Agency, local authority, water company, MP/GLA where relevant. | Swimmers, river campaigners, local businesses vs water-company cost/regulatory resistance or local concerns about designation feasibility. | Strong multi-source evidence; good environmental visualisations; clear democratic implications. | Slightly more process-heavy; less instantly local than a school street unless tightly framed around one site. | **Use as a strong thematic alternative, especially for environmental audiences.** | citeturn23search5turn23search7turn23search9turn23search14turn11search3turn11search10 |

The recommended demonstration scenario is therefore:

**Choose Leicester → scout finds the Clarendon Park school-street issue → evidence agents pull council documents, area context, councillors and MP → strategy agent frames two possible legitimate campaign stances → lobbying agent identifies intervention points → content agents generate a press release, supporter email, doorknock script, and decision-maker briefing → factory view clones the pipeline across multiple school-street or safer-school-run cases.** That flow is both practically credible and politically provocative, because it begins with an issue that feels civic and mundane, then ends with the realisation that the same machine can be pointed across dozens of neighbourhoods at once. citeturn20search6turn20search7turn13search1turn19search3turn15search1

If the organisers want a less transport-focused narrative, the next-best option is the **Barnes bus-route consultation**, because it is similarly legible and intervention-rich. If they want a sharper democratic edge with lower reliance on transport-specific context, the **bathing-water designation** route is the best environmental alternative. citeturn21search3turn23search5turn23search7

## Architecture from agent to factory

The architecture should make the escalation path visible: **plain prompt → one tool-using scout → fixed workflow → specialist agents → orchestrated factory → scaled multi-place system**. The point of the demo is not to show the audience a swarm from the start; it is to make them feel the step-change at each layer.

| Layer | What it is | What it should do in the demo | What it should not do |
|---|---|---|---|
| Normal LLM prompt | One model, no tools | Rephrase a user aim, summarise a preloaded issue card | Claim it “found” anything in the world |
| Single tool-using agent | One model plus geography/data tools | Take a postcode/place; resolve geography; search a narrow source set; propose 2–3 candidate local issues with citations | Produce full strategy, lobby plan and media pack unaided |
| Fixed workflow | Deterministic sequence with small model calls | Resolve geography → fetch documents → extract claims → verify → rank issues | Branch wildly or invent tasks |
| Specialised agents | Separate roles with bounded inputs/outputs | Issue detection, evidence verification, strategy, lobbying, content, review | Share unconstrained memory or write directly to the UI without schemas |
| Orchestrated factory | Task router plus queue | Run same pipeline for multiple issues/places/audience frames; show traces and approvals | Publish or send content automatically |
| Scaled operating system | Real multi-organisation deployment | Batch across councils/constituencies with caching, audit, policy controls and capacity planning | Be implied by the prototype as “already solved” |

The following agents are sufficient and implementation-ready for a conference prototype.

| Agent | Goal | Inputs | Allowed tools | Output schema | Capability type | Dependencies | Failure conditions | Human approval | Logging / traceability |
|---|---|---|---|---|---|---|---|---|---|
| Geographic Resolver | Convert place, postcode, school name, or street into canonical geographies | Free text, postcode, OS/ONS lookups | NSPL/ONSPD cache, ONS geography tables, optional postcodes.io-style mirror | `PlaceResolution { canonical_name, postcode, lat, lon, ward, local_authority, constituency, lsoa, msoa, region, confidence }` | Deterministic + light extraction | None | Ambiguous place, split postcode, missing code join | Only if ambiguity remains after deterministic resolution | Log raw input, matched code rows, confidence, fallbacks |
| Public-Data Scout | Find plausible actionable issues from a defined source set | Canonical place + source inventory | Search functions over cached council docs/APIs, consultations, police, ONS | `IssueCandidate[] { title, summary, issue_type, why_actionable, sources[], confidence, next_checks[] }` | Retrieval + reasoning | Geographic Resolver | No meaningful documents, low-confidence source match, unchanged stale documents only | Yes for choosing candidate to pursue live | Log queries, source hits, ranking rationale, discarded candidates |
| Council/Public-Body Ingestor | Normalise HTML/PDF civic records | URLs from discovery layer | HTML fetcher, PDF parser, OCR only if unavoidable | `DocumentRecord { source_url, title, body_text, date, authority, committee, doc_type, cited_lines }` | Deterministic extraction | Discovery layer | Broken PDF, scan-only doc, malformed HTML | No | Log fetch status, parse method, checksum, page count |
| Issue Ranker | Score candidates against demo criteria | Candidate issues + metadata | Local scoring rules + small model | `RankedIssues { ranked[], reasons[] }` | Classification + short reasoning | Scout | Overfit to noisy wording; no action point | Yes for final user-visible issue | Log features, score weights, chosen issue |
| Evidence Verifier | Build an evidence pack and mark support strength | Selected issue + source records | Citation binder, cross-source retrieval | `EvidencePack { claims[], support_level, source_matrix[], caveats[] }` | Retrieval + verification | Ingestor | Claim unsupported, source mismatch, one-source-only pack | Yes before strategy generation | Log each claim/source link and contradiction flags |
| Contradiction / Missing-Evidence Checker | Find weak points | Evidence pack | Cross-check retrieval, rule checks | `EvidenceAudit { disputed_claims[], missing_data[], stale_sources[], recommended_checks[] }` | Verification + classification | Evidence Verifier | False confidence; overly broad objections | Yes if the demo explicitly challenges a claim | Log challenged claims and outcomes |
| Constituency Context Builder | Add local socioeconomic and political context | Canonical place | ONS, Nomis, Fingertips, police, election context | `ContextPack { demographics, deprivation, transport, health, labour, political_context, key_stats[] }` | Retrieval + summarisation | Geographic Resolver | Data unavailable at matched geography; incompatible time periods | No, unless the pack will be shown directly | Log dataset versions and geography joins |
| Stakeholder Discovery Agent | Identify local actors | Place + issue + evidence | Companies House, Charity Commission, councillor lists, ICB/authority pages, media directories | `StakeholderList[] { name, type, likely_position, evidence, contact_path, confidence }` | Retrieval + classification | Context + Evidence | Entity collisions; unsupported “likely position” labels | Yes | Log every inferred stance separately from directly evidenced stance |
| Power Map Agent | Turn actors into influence map | Stakeholder list + governance rules | No extra web in demo; use cached actor data | `PowerMap { nodes[], edges[], decision_path, influencers[], blockers[], unknowns[] }` | Reasoning + graph synthesis | Stakeholder Discovery | Inflated confidence; hidden assumptions | Yes | Log decision logic and evidence per edge |
| Strategy Agent | Produce objective, theory of change, audiences and outcomes | Evidence + context + power map + chosen campaign frame | Structured synthesis only | `Strategy { objective, theory_of_change, audiences[], message_frames[], risks[], success_metrics[] }` | Reasoning | Evidence, Context, Power Map | Jumps to tactics without evidence; assumes illegal targeting | Yes | Log inputs, versioned prompt, output JSON |
| Tactics Agent | Offer conventional and experimental tactics | Strategy + constraints | Template library + bounded generation | `TacticsBoard[] { tactic, type, why_here, dependencies, cost_band, risk_band, approval_required }` | Reasoning + writing | Strategy | Suggests unlawful, manipulative, or non-human-approved publication | Yes | Log tactic provenance and banned-tactic checks |
| Lobbying Research Agent | Research decision-makers and intervention points | Place + issue + stakeholders | Parliament APIs, council/CA/ICB pages, committee docs | `LobbyingBrief { targets[], previous_statements[], voting_or_decision_records[], process_steps[], intervention_points[] }` | Retrieval + synthesis | Geographic Resolver, Evidence | Cannot identify live officeholder or process step | Yes | Log source per target and whether data are direct or inferred |
| Media Discovery Agent | Find relevant local publications and journalists | Place + issue | Local publication directories, site searches, parliamentary journalist register only as context, ICNN/Impress | `MediaList[] { outlet, geography, type, likely_relevance, rss_or_site, journalist_names? }` | Retrieval + ranking | Geographic Resolver | False journalist/outlet matching; stale newsroom data | Yes | Log source and freshness note |
| Content Generation Agent | Draft assets with citations attached | Strategy + tactic + lobbying brief + media list | Template system + model writing | `ContentPack { press_release, social_posts[], supporter_email, volunteer_briefing, conversation_script, decision_maker_brief }` | Writing | Strategy, Lobbying, Media | Hallucinated facts or unattributed claims | Yes, mandatory | Log asset version, citations, reviewer status |
| Audience Adaptation Agent | Reframe for organisation type or audience segment | Base content + organisation profile | Controlled rewriting | `AdaptedContentPack` | Writing + classification | Content Generation | Drifts facts; implies individual targeting | Yes | Log deltas from base content |
| Legal / Factual / Ethical Review Agent | Stop unsafe or weak outputs | Any user-visible artifact | Rule checks + targeted review prompt | `ReviewReport { factual_flags[], legal_flags[], ethical_flags[], reputational_flags[], pass_fail, required_edits[] }` | Verification + classification | Evidence + Content | Misses unsupported claim or defamatory phrasing | Yes, final gate | Log every flag and whether resolved |
| Orchestrator | Assign tasks, retries, and approvals | User action + system state | Queue, scheduler, function tools | `RunState { tasks[], status, costs, approvals, failures }` | Deterministic orchestration | All | Task loop, duplicate work, silent failures | Operator-controlled | Comprehensive run log and event trace |

The implementation principle is simple: **agents decide, software proves**. Geography resolution, data extraction, citation binding, date handling, deduplication, entity matching by codes, and approval-state transitions should be deterministic. Agents should operate on already-normalised data and must emit structured JSON that downstream code can validate. That is the difference between a compelling demonstration and a brittle magic trick. citeturn40search0turn13search1turn9search3turn19search9

## Technical implementation plan

Two viable prototype approaches stand out.

**Approach A: Python-first custom harness**

Python handles document processing, dataframe work, geospatial joins, PDF tooling, DuckDB/Postgres integration, and evaluation more naturally than TypeScript. It is the easiest path for stitching together council documents, ONS/Nomis pulls, police/environment APIs, and structured model outputs. The harness can be simple: function-call tools plus a queue, Pydantic schemas for every agent output, a Postgres/PostGIS canonical store, DuckDB for analytics, and a small FastAPI service layer serving the frontend. This approach is strongest when the demo depends on **ingestion, normalization, caching, and evidence tables** more than on rich frontend browser automation. That is the case here. citeturn40search0turn10search0turn34view0turn13search1

**Approach B: TypeScript full-stack with framework-heavy agents**

A TypeScript stack can unify backend and frontend, reduce language switching, and work well if the team wants deep browser-native interactivity, streaming agent traces, and a highly polished client experience. But for this use case, TypeScript is weaker where the work is heaviest: PDF parsing, dataframe joins, and one-off civic-data cleanup. It can still work, but the team will likely recreate Python’s data-engineering ergonomics elsewhere or outsource them to services, which adds complexity and failure surface for a prototype. citeturn18search1turn24search1turn34view0

**Recommendation**

Use **Approach A**: Python backend, lightweight custom harness, and ordinary function tools. Use **MCP only if the team already has MCP infrastructure**; otherwise, it adds more ceremony than value for a short-lived conference build. For models, route by task class rather than by brand marketing label: a **small fast model** for extraction and classification, a **more capable reasoning model** for issue ranking/strategy/power mapping, and optionally an **open-weight local model** for some offline simulations or fallback demonstrations. Do not rely on a single huge “best” model for everything; it is slower, more expensive, and harder to debug. Use structured outputs everywhere, and treat every model response as untrusted until it passes schema validation and citation checks. citeturn40search0turn35search0turn27view0turn19search9

The data path should look like this:

```text
User selects place
   -> Geographic Resolver
   -> Source Discovery + Cached Fetchers
   -> Normalisers (HTML/PDF/CSV/API)
   -> Canonical Store (Postgres/PostGIS)
   -> Analytics Layer (DuckDB)
   -> Evidence Builder
   -> Agents (Scout -> Verify -> Strategy -> Lobbying -> Content -> Review)
   -> Dashboard state store
   -> Human approvals
   -> Exportable content pack
```

A practical component diagram for the prototype:

```text
┌──────────────────────────────── Frontend ────────────────────────────────┐
│ Map / place search │ Agent graph │ Evidence pane │ Strategy │ Assets     │
└───────────────▲──────────────────────▲──────────────────────▲────────────┘
                │                      │                      │
        WebSocket/SSE            REST/JSON state       Export endpoints
                │                      │                      │
┌──────────────────────────────── Backend ─────────────────────────────────┐
│ FastAPI app                                                             │
│  - orchestration service                                                │
│  - geography service                                                    │
│  - evidence service                                                     │
│  - review service                                                       │
│  - run logger                                                           │
└──────▲───────────────▲─────────────────────▲─────────────────────▲──────┘
       │               │                     │                     │
   Task queue      Function tools        Model router         Cache manager
       │               │                     │                     │
┌──────┴───────┐ ┌─────┴────────┐   ┌───────┴────────┐   ┌───────┴────────┐
│ Postgres     │ │ DuckDB       │   │ Provider A     │   │ HTML/PDF/CSV    │
│ + PostGIS    │ │ analytics    │   │ Provider B     │   │ object/file cache│
└──────▲───────┘ └─────▲────────┘   └────────────────┘   └───────▲────────┘
       │               │                                           │
       └────── Normalised civic, geography, evidence entities ─────┘
```

Suggested repository structure:

```text
campaign-factory/
  apps/
    api/
    web/
  packages/
    schemas/
    prompts/
    toolkits/
    ui-components/
  data/
    seeds/
    caches/
    fixtures/
  pipelines/
    geography/
    councils/
    parliament/
    public_health/
    environment/
  agents/
    resolver/
    scout/
    verifier/
    context/
    stakeholders/
    power_map/
    strategy/
    lobbying/
    media/
    content/
    review/
  infra/
    docker/
    migrations/
    observability/
  evals/
    golden_sets/
    scoring/
  docs/
    demo-script/
    source-catalogue/
```

Core data schemas should stay narrow and auditable:

```json
{
  "Place": {
    "id": "place_...",
    "name": "Clarendon Park",
    "postcode": "LE2 ...",
    "ward_code": "E050...",
    "constituency_code": "WMC...",
    "local_authority_code": "E060...",
    "lsoa_code": "E010..."
  },
  "SourceDocument": {
    "id": "doc_...",
    "publisher": "Leicester City Council",
    "url": "https://...",
    "title": "New school street scheme to be trialled",
    "published_at": "2026-05-28",
    "doc_type": "news|agenda|minutes|report|consultation",
    "checksum": "sha256:...",
    "cached_path": "/cache/..."
  },
  "EvidenceClaim": {
    "id": "claim_...",
    "claim_text": "The council plans an experimental school street...",
    "support_status": "supported|mixed|unsupported",
    "citations": ["doc_...#L12-L22"],
    "confidence": 0.94
  },
  "Issue": {
    "id": "issue_...",
    "place_id": "place_...",
    "title": "Safer school-run access around St John the Baptist",
    "issue_type": "school_street",
    "decision_window": "consultation|experimental_order|committee|unknown",
    "decision_makers": ["actor_..."],
    "evidence_claim_ids": ["claim_..."]
  }
}
```

Example structured output from the scout agent:

```json
{
  "issue_candidates": [
    {
      "title": "Experimental school street around St John the Baptist CofE Primary",
      "issue_type": "street_safety",
      "summary": "Leicester City Council says it will trial timed traffic restrictions on roads around the school to improve safety and reduce congestion.",
      "why_actionable": "A named public authority is implementing a defined intervention with traceable public documents and local stakeholders.",
      "sources": [
        {
          "publisher": "Leicester City Council",
          "url": "https://news.leicester.gov.uk/news-articles/2026/may/new-school-street-scheme-to-be-trialled/"
        }
      ],
      "confidence": 0.88,
      "next_checks": [
        "Resolve exact ward and constituency",
        "Fetch any traffic-order documents",
        "Add demographic and school-area context"
      ]
    }
  ]
}
```

Example structured output from the review agent:

```json
{
  "pass_fail": "requires_edits",
  "factual_flags": [
    {
      "asset": "press_release",
      "sentence": "Parents have demanded the road be closed.",
      "reason": "Only council source confirms resident and school-community request, not quantified parental demand.",
      "required_fix": "Replace with wording tied directly to source."
    }
  ],
  "legal_flags": [],
  "ethical_flags": [
    {
      "asset": "social_post_x",
      "reason": "Tone overstates certainty and implies adversarial mobilisation before human approval."
    }
  ],
  "required_edits": [
    "Downgrade unsupported claim wording",
    "Add citation tag to factual statements",
    "Mark post as draft pending approval"
  ]
}
```

**Storage and execution choices**

Use **PostgreSQL + PostGIS** for canonical entities and joins; **DuckDB** for ad hoc analytics and fast local slices; **SQLite only** for local dev or single-user fallback. Use a plain file/object cache for fetched HTML, PDFs and parsed text. Vector storage is optional; if used at all, keep it narrow—document chunk retrieval for previously cached council reports and Hansard—not as a replacement for proper metadata and citation indexing. OCR should be used only when a PDF is image-only, because official pages and born-digital PDFs usually parse adequately without it. That is especially important for live-demo reliability. citeturn34view0turn18search0turn24search1turn40search0

**Observability, versioning, and evaluation**

Persist every run as an event log: tool calls, timings, model name/class, prompt version, input hash, output JSON, schema pass/fail, reviewer actions, and cost estimates. Store prompts and workflow definitions as versioned files in-repo. Build a small “golden set” of 10–20 cached issues and evaluate on four things: factual grounding, citation completeness, decision-maker accuracy, and reviewer trust. This demo will stand or fall on traceability more than raw eloquence. citeturn19search9turn27view0turn40search0

**Minimal prototype scope**

A credible minimum is:

- one place selector
- one issue template family
- one council/authority discovery pipeline
- one evidence builder
- one strategy generator
- one lobbying brief
- four content assets
- one review gate
- one multi-place factory simulation

**Stretch scope**

A worthwhile stretch version adds:

- selectable organisation framing
- parallel runs across 5–20 constituencies
- comparative issue heatmap
- richer local-media discovery
- more differentiated public-body research across ICBs, combined authorities, and planning committees

**Features to simulate rather than fully implement**

For the conference build, simulate these rather than solving them end-to-end:

- fully automated local journalist contact discovery
- nationwide universal council crawling
- exhaustive councillor contact enrichment
- live ad-library integration setup
- probabilistic audience segmentation beyond broad non-sensitive categories
- auto-publication or outbound email/social posting

## Dashboard and live demonstration

The dashboard should visually teach the audience one idea: **this begins as help for one local organiser and ends as industrialised political capacity**.

A good information hierarchy is:

```text
Left: place + issue selection
Center: agent workflow and issue/evidence view
Right: strategy, power map, lobbying brief, draft assets
Bottom ribbon: status, approvals, cost, tokens, cache/live indicators
Secondary full-screen mode: national factory view
```

A wireframe that works for non-technical campaigners:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top bar: Place search | Organisation frame | Run status | Live/Cache toggle │
├──────────────────────┬──────────────────────────────┬───────────────────────┤
│ UK map + place pane  │ Main canvas                 │ Decision/output pane  │
│ - postcode input     │ - agent graph               │ - campaign objective  │
│ - ward/constituency  │ - current task              │ - theory of change    │
│ - issue cards        │ - evidence timeline         │ - stakeholder map     │
│ - compare places     │ - citations/doc viewer      │ - lobbying brief      │
│                      │ - disagreement/confidence   │ - draft assets        │
├──────────────────────┴──────────────────────────────┴───────────────────────┤
│ Bottom ribbon: sources fetched | approvals pending | latency | tokens | £   │
└──────────────────────────────────────────────────────────────────────────────┘
```

The **main screen** should always keep five elements visible:

1. **Selected place and canonical geographies**  
2. **Current issue card with one-sentence explanation**  
3. **Agent graph with statuses**  
4. **Evidence pane with direct citations**  
5. **Approval state and live/pre-cached indicator**

That persistent visibility matters. If the evidence or approvals disappear, the audience loses the guardrails and only sees output volume.

Recommended visualisations:

- **Map**: constituency/ward overlays, with issue pins or shaded candidate areas
- **Agent graph**: nodes that move through waiting/running/review/failed/succeeded states
- **Evidence matrix**: claims vs sources with support/mixed/unsupported tags
- **Timeline**: issue history from consultation, agenda, decision, implementation
- **Power map**: force-directed graph or influence matrix, but with a simple legend
- **Tactics board**: kanban-style cards split into conventional / experimental / not approved
- **Factory view**: small multiples across constituencies or issue templates

Accessibility considerations should not be an afterthought. Use high contrast, don’t encode status by colour alone, keep text readable at a distance, and make every key state visibly labeled: “LIVE,” “PRE-CACHED,” “AWAITING HUMAN APPROVAL,” “SOURCE DISAGREEMENT,” and “LOW CONFIDENCE.” Council PDFs and civic portals themselves often have accessibility limitations, so the dashboard needs to compensate by extracting legible summaries and keeping the original source one click away. citeturn18search8turn18search14turn17search12

A low-complexity frontend option is **React plus a simple component library and a map panel**, with SSE/WebSocket updates from the backend. A more polished option is **Next.js with richer animations, graph transitions, and a full-screen stage mode**. For the conference, polish matters, but stability matters more. If the team is small, build the low-complexity version first and spend the saved time on cached-data quality and reviewer flows.

The live run-of-show should be precise and cumulative.

| Stage | Presenter says | Screen shows | Action | Workflow | Latency target | Live or cached | Audience takeaway | Tension introduced |
|---|---|---|---|---|---|---|---|---|
| Choose a place | “We’ll start with one real place, not a national dashboard.” | UK map, postcode search, Leicester selected | Enter place/postcode | Geographic Resolver | 1–2s | Live | This starts as something a local organiser could plausibly use. | None yet |
| Ask one scout agent | “One scout agent searches public records for something actionable.” | Agent graph with one node running; issue cards appear | Run scout | Resolver + Scout | 3–8s | Live, but against cached index | The first step is modest: finding possibilities. | Even one agent can surface more than a human could scan quickly. |
| Inspect and challenge a claim | “Let’s open the evidence and challenge one claim.” | Evidence pane, source viewer, support matrix | Click into source; rerun verifier | Evidence Verifier + Contradiction Checker | 2–5s | Mixed | Trust comes from inspectability, not rhetoric. | The system may be wrong; evidence laundering is a real risk. |
| Add specialised research agents | “Now we add teams: context, stakeholders, parliamentary, local media.” | Four more nodes light up; context cards populate | Launch batch | Context + Stakeholder + Lobbying + Media | 5–12s | Mostly cached with one live pull | Capability jumps when the work is decomposed. | Scale is emerging. |
| Generate strategy and power map | “Now it stops being research and starts becoming campaign planning.” | Objective, theory of change, stakeholder graph | Run strategy | Strategy + Power Map | 4–8s | Cached inputs, live synthesis | AI becomes organisational capacity, not just summarisation. | Centralisation risk becomes visible. |
| Switch organisation frame | “What if a different organisation interpreted the same facts differently?” | Toggle frame: resident safety / anti-restriction / clean-air group | Re-run adaptation | Audience Adaptation + Strategy delta | 2–5s | Live | Same facts can produce different campaigns. | Manufactured campaigns become thinkable. |
| Produce campaign materials | “Now it drafts the pack a local campaign might actually use.” | Press release, email, social posts, volunteer script, briefing note | Generate content | Content Agent | 4–8s | Live synthesis on cached evidence | Writing is now downstream of structured research. | Content saturation and deskilling become obvious. |
| Show human approvals and review | “Nothing leaves draft without human approval.” | Review flags, unsupported sentence highlighted | Open review pane | Review Agent | 1–3s | Live | Safeguards are essential and visible. | Even with safeguards, reviewers may become bottlenecks or rubber stamps. |
| Reveal the factory | “Now imagine running the same workflow everywhere.” | National grid of multiple places/issues spinning up | Trigger multi-run simulation | Orchestrator + batch runs | 2–6s for visible simulation | Mostly pre-cached | This is the provocative turn: one campaign workflow becomes an industrial system. | Centralisation, automation, and asymmetry become impossible to ignore. |
| End on the unsettling visual | “A volunteer could inspect one place. A factory can inspect many.” | Side-by-side comparison: manual vs factory throughput | Freeze final screen | No new run | Instant | Pre-built visual | The audience should feel both usefulness and unease. | Democratic implications fully foregrounded. |

**Contingencies**

If APIs are slow, switch the top bar to “cached mode” and say that the system is now replaying an evidence-backed run from the same public sources. If the model gives a weak scout answer, reveal the ranked backup issue cards and choose the best one manually; that actually reinforces the human-approval theme. If a citation fails, open the underlying source document from cache and continue. If the network fails completely, switch to a “replay trace” mode that shows a previously executed run with all inputs, outputs and timings preserved. If the agent loop stalls, kill the run visibly and show the failed node state; that is better theatre than quietly refreshing. If time is short, skip the organisation-frame switch and go straight from strategy to factory. If there are two extra minutes, show one additional constituency in the factory view and compare how the same issue template yields different stakeholder maps and tactics. citeturn34view0turn18search1turn18search8turn20search7

## Governance, cost, evaluation, milestones, and open decisions

The prototype’s benefits are real. Public-data research can become dramatically faster; small organisations can get access to local-government and parliamentary material that is otherwise dispersed across awkward websites and PDFs; and the evidencing and citation discipline can improve the quality of campaign prep when compared with ad hoc internet searching. The verified July 2026 data environment supports that optimism: official national APIs now exist for ONS, police, parts of Parliament, NHS reference data, EA flood data, and more. citeturn40search0turn10search0turn19search9turn9search3turn10search1turn27view1

The risks are equally real. The same stack can centralise strategy, flatten local knowledge into templateable inputs, accelerate synthetic grassroots-style output, and turn monitoring of public officials into an industrialised practice that advantages organisations with money, compute access, and data-engineering capacity. The most serious technical risk is **hallucination plus evidentiary laundering**: once the system can write polished strategies and assets, weak or misread evidence can travel further and faster. The most serious democratic risk is **the displacement of locally rooted organising with centrally generated campaign playbooks**. The prototype should say this plainly. That is why the restrictions matter: public data only; broad non-sensitive audience categories only; read-only tools; citations on factual claims; and human approval before any export, reuse, delivery, or publication. citeturn37view0turn37view2turn38search15turn17search12

A practical risk register for the prototype:

| Risk | Why it matters | Mitigation in prototype |
|---|---|---|
| Unsupported or stale local claim | Council records and planning datasets are fragmented and sometimes stale | Cache key source docs, run contradiction checks, show freshness badges, require evidence support status before strategy generation |
| Defamation / unfair implication about named actors | The system may infer motives or guilt from public records | Keep to public-role descriptions, previous statements, decisions and formal records; forbid speculative accusations |
| Manufactured-locality effect | Factory-generated campaigns may appear rooted but are centrally assembled | Make the dashboard show what was automated, what was pre-cached, and where human local knowledge is absent |
| Audience-targeting creep | Broad analysis could drift toward individual political targeting | Restrict to geography-level and broad non-sensitive audience categories; no individual targeting fields in schemas |
| Deskilling / volunteer displacement | The tool could reduce demand for distributed local research roles | Make human approval and local knowledge visible as required inputs, not cosmetic checks |
| Unequal access | Well-funded organisations could industrialise this faster | Surface this explicitly in the panel framing and in the final factory visual |
| Provider dependence | Model/API vendors can change access, terms, latency, or pricing | Use provider-agnostic task classes, caching, and fallbacks; avoid a design dependent on one live provider |
| Content saturation | Low-cost asset generation can flood local information spaces | Keep exports manual-only and frame autogenerated content as draft material requiring review |
| Surveillance perception | Persistent monitoring of officials/local actors can feel coercive | Limit sources to public official records and public institutional data; avoid personal-data enrichment |

The governance boundary should be explicit:

| Activity | In scope for prototype | Out of scope |
|---|---|---|
| Public-data research | Yes |  |
| Broad contextual audience analysis by place or community type | Yes |  |
| Individual-level political targeting |  | No |
| Regulated electoral data handling beyond public/reference use | Limited, careful, only where official/public and necessary | No operational canvassing lists |
| Automated publication, outreach, ad buying, or volunteer messaging |  | No |
| Read-only monitoring of official statements, decisions and consultations | Yes |  |
| Enrichment with private contact databases or private behavioural data |  | No |

**Cost and infrastructure estimate**

The infrastructure footprint is modest. A small VPS-class deployment is enough for the prototype backend, database, cache and dashboard if PDFs and bulky datasets are preloaded and the concurrency is low. The hard costs are much more likely to come from model/API usage spikes during rehearsals than from the server itself. Because provider prices were not fully verified in official docs during this research pass, treat the following as **planning assumptions rather than source-verified July 2026 tariffs**:

- one small VPS-class host plus managed backups and object storage equivalent
- one primary model provider plus one fallback provider
- a few gigabytes to tens of gigabytes of cached PDFs/HTML/CSV
- total rehearsal-and-event cost likely in the **low hundreds of pounds**, not thousands, if live calls are tightly bounded and most heavy retrieval is cached
- operational risk falls sharply if the team pre-computes evidence packs and only runs synthesis live

That makes the prototype financially realistic for a conference build, but the team should still build a **“hard offline” mode** that can run with zero internet after startup.

**Evaluation plan**

The prototype should be evaluated on seven dimensions:

1. **Issue usefulness**: would a campaigner say the issue is actionably real?  
2. **Source grounding**: are every displayed claims tied to real citations?  
3. **Decision-maker accuracy**: are the right public bodies and officeholders named?  
4. **Evidence challenge performance**: when challenged, can the system locate support, dispute, or uncertainty quickly?  
5. **Adaptation quality**: when reframed for another legitimate organisation type, does the system preserve facts while changing strategy?  
6. **Operational resilience**: how often can the system complete a run with one or more inputs degraded?  
7. **Audience comprehension**: do non-technical campaigners understand the progression from one agent to factory?

Use a gold set of 10–20 cached cases and score each run with a human review sheet. The success condition is not “perfect automation.” It is **credible, inspectable, bounded automation**.

**Build milestones**

| Milestone | Deliverable |
|---|---|
| Milestone one | Locked primary issue and two backups; source inventory frozen; canonical geography pipeline working |
| Milestone two | Council/public-body fetchers and document cache working for primary location |
| Milestone three | Scout, verifier, and context pack working end-to-end with structured outputs |
| Milestone four | Strategy, lobbying brief, and content pack generation with review flags |
| Milestone five | Dashboard with place selection, agent graph, evidence pane, and approval gates |
| Milestone six | Factory simulation and contingency/replay mode |
| Milestone seven | Rehearsed stage script, operator runbook, and offline fallback tested |

**Open questions requiring decisions from Fatima, Hannah, or Ed**

- Should the demo explicitly present **two legitimate campaign framings** of the same local facts, or should it stay with one framing and leave the pluralism point to the panel?
- Is the conference audience more likely to respond to a **transport/school-street** example, a **public-service closure** example, or an **environment/water** example?
- Should the final “factory” reveal show **multiple places for one organisation type**, or **the same place processed for multiple organisation types**?
- How adversarial should the demo be about risks: lightly suggestive, or explicitly unsettling?
- Is the team comfortable showing a named real place live, or should the primary location be **real but pre-cached and operator-controlled**, with backups ready for live switching?
- Does the event want a **plain-language campaigner-first interface**, or a more visibly technical interface that foregrounds the agent graph and traces?
- What is the acceptable boundary on generated assets: **drafts visible on screen only**, or downloadable exports after approval?
- Which of the three named people is the final approver for **political framing**, **UX/story**, and **technical architecture** if those decisions diverge?

The implementation-ready recommendation is therefore: **build a Python-first, evidence-heavy, citation-visible prototype around a school-street issue in Leicester; pre-cache local civic documents; run geography resolution, one scout step, one verification challenge, and one synthesis step live; reveal a national factory last; and keep human approvals and traceability visible throughout.** That will feel genuinely useful to campaigners and funders while still surfacing the central democratic question the panel needs to confront.