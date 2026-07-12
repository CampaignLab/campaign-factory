/* Preloaded public data — real UK local authority names and types.
   Source basis: public register of UK local authorities (names/types are real;
   verified sample, July 2026). Officeholder names are deliberately NOT included —
   they change and must come from a live source (see js/adapters.js: councilAdapter).
   Loaded as JS (not fetched JSON) so the app runs from file:// with no server. */

window.CF_AUTHORITIES = [
  { name: "Leicester City Council", type: "Unitary authority", area: "Leicester", region: "East Midlands", governance: "Directly elected City Mayor and executive", match: ["leicester", "le1", "le2", "le3", "le4", "le5", "clarendon park"], mediaKey: "leicester", verified: true },
  { name: "Birmingham City Council", type: "Metropolitan borough", area: "Birmingham", region: "West Midlands", governance: "Leader and cabinet", match: ["birmingham", "b1", "b2"], mediaKey: "birmingham" },
  { name: "Manchester City Council", type: "Metropolitan borough", area: "Manchester", region: "North West", governance: "Leader and cabinet", match: ["manchester", "m1", "m2"], mediaKey: "manchester" },
  { name: "Leeds City Council", type: "Metropolitan borough", area: "Leeds", region: "Yorkshire and the Humber", governance: "Leader and cabinet", match: ["leeds", "ls1"], mediaKey: "leeds" },
  { name: "Sheffield City Council", type: "Metropolitan borough", area: "Sheffield", region: "Yorkshire and the Humber", governance: "Committee system", match: ["sheffield", "s1"], mediaKey: "sheffield" },
  { name: "Bristol City Council", type: "Unitary authority", area: "Bristol", region: "South West", governance: "Committee system", match: ["bristol", "bs1"], mediaKey: "bristol" },
  { name: "Newcastle City Council", type: "Metropolitan borough", area: "Newcastle upon Tyne", region: "North East", governance: "Leader and cabinet", match: ["newcastle", "ne1"], mediaKey: "newcastle" },
  { name: "Nottingham City Council", type: "Unitary authority", area: "Nottingham", region: "East Midlands", governance: "Leader and cabinet", match: ["nottingham", "ng1"], mediaKey: "nottingham" },
  { name: "Liverpool City Council", type: "Metropolitan borough", area: "Liverpool", region: "North West", governance: "Leader and cabinet", match: ["liverpool", "l1"], mediaKey: "liverpool" },
  { name: "Cardiff Council", type: "Unitary authority (Wales)", area: "Cardiff", region: "Wales", governance: "Leader and cabinet", match: ["cardiff", "cf1"], mediaKey: "cardiff" },
  { name: "Glasgow City Council", type: "Unitary authority (Scotland)", area: "Glasgow", region: "Scotland", governance: "Leader and committees", match: ["glasgow", "g1"], mediaKey: "glasgow" },
  { name: "Edinburgh — City of Edinburgh Council", type: "Unitary authority (Scotland)", area: "Edinburgh", region: "Scotland", governance: "Leader and committees", match: ["edinburgh", "eh1"], mediaKey: "edinburgh" },
  { name: "London Borough of Hackney", type: "London borough", area: "Hackney", region: "London", governance: "Directly elected Mayor", match: ["hackney", "e8"], mediaKey: "london" },
  { name: "London Borough of Brent", type: "London borough", area: "Brent", region: "London", governance: "Leader and cabinet", match: ["brent", "wembley", "ha0", "nw10"], mediaKey: "london" },
  { name: "London Borough of Lambeth", type: "London borough", area: "Lambeth", region: "London", governance: "Leader and cabinet", match: ["lambeth", "brixton", "sw2", "sw9"], mediaKey: "london" },
  { name: "London Borough of Tower Hamlets", type: "London borough", area: "Tower Hamlets", region: "London", governance: "Directly elected Mayor", match: ["tower hamlets", "brick lane", "e1", "e2", "e3"], mediaKey: "london" },
  { name: "Kent County Council", type: "County council", area: "Kent", region: "South East", governance: "Leader and cabinet", match: ["kent", "maidstone", "canterbury"], mediaKey: "kent" },
  { name: "Essex County Council", type: "County council", area: "Essex", region: "East of England", governance: "Leader and cabinet", match: ["essex", "chelmsford", "colchester"], mediaKey: "essex" },
  { name: "Lancashire County Council", type: "County council", area: "Lancashire", region: "North West", governance: "Leader and cabinet", match: ["lancashire", "preston", "lancaster"], mediaKey: "lancashire" },
  { name: "Norfolk County Council", type: "County council", area: "Norfolk", region: "East of England", governance: "Leader and cabinet", match: ["norfolk", "norwich", "nr1"], mediaKey: "norfolk" },
  { name: "Devon County Council", type: "County council", area: "Devon", region: "South West", governance: "Leader and cabinet", match: ["devon", "exeter", "ex1"], mediaKey: "devon" },
  { name: "Oxfordshire County Council", type: "County council", area: "Oxfordshire", region: "South East", governance: "Leader and cabinet", match: ["oxford", "oxfordshire", "ox1"], mediaKey: "oxford" },
  { name: "Cambridgeshire County Council", type: "County council", area: "Cambridgeshire", region: "East of England", governance: "Leader and cabinet", match: ["cambridge", "cambridgeshire", "cb1"], mediaKey: "cambridge" },
  { name: "Cornwall Council", type: "Unitary authority", area: "Cornwall", region: "South West", governance: "Leader and cabinet", match: ["cornwall", "truro", "tr1"], mediaKey: "cornwall" },
  { name: "Durham County Council", type: "Unitary authority", area: "County Durham", region: "North East", governance: "Leader and cabinet", match: ["durham", "dh1"], mediaKey: "durham" },
  { name: "Bradford — City of Bradford MDC", type: "Metropolitan borough", area: "Bradford", region: "Yorkshire and the Humber", governance: "Leader and cabinet", match: ["bradford", "bd1"], mediaKey: "bradford" },
  { name: "Coventry City Council", type: "Metropolitan borough", area: "Coventry", region: "West Midlands", governance: "Leader and cabinet", match: ["coventry", "cv1"], mediaKey: "coventry" },
  { name: "Brighton & Hove City Council", type: "Unitary authority", area: "Brighton & Hove", region: "South East", governance: "Committee system", match: ["brighton", "hove", "bn1"], mediaKey: "brighton" },
  { name: "Southampton City Council", type: "Unitary authority", area: "Southampton", region: "South East", governance: "Leader and cabinet", match: ["southampton", "so14"], mediaKey: "southampton" },
  { name: "Plymouth City Council", type: "Unitary authority", area: "Plymouth", region: "South West", governance: "Leader and cabinet", match: ["plymouth", "pl1"], mediaKey: "plymouth" }
];

/* Public-body patterns (real institution types; used when the decision isn't the council's) */
window.CF_BODIES = {
  nhs: { name: "the Integrated Care Board (ICB)", process: "board meetings with published papers; formal public-involvement duties on service change", note: "NHS reconfigurations above a threshold trigger statutory consultation and council health-scrutiny referral powers" },
  tfl: { name: "Transport for London", process: "public consultations via haveyoursay.tfl.gov.uk; decisions by TfL with Mayor of London oversight", note: "borough councils and London Assembly members are influencers, not deciders" },
  school: { name: "the school's governing body / the local authority / the academy trust", process: "statutory processes for school organisation changes; DfE regional oversight for academies", note: "who decides depends on school type — verify before targeting" }
};
