/* Preloaded public data — real UK local media outlet NAMES per area (titles are real
   publications, July 2026). Contact details are deliberately mock: real journalist
   names/emails must come from a live, human-verified source (see js/adapters.js:
   mediaAdapter). The app labels every contact "Mock contact for prototype". */

window.CF_MEDIA = {
  leicester:   [ { outlet: "Leicester Mercury / LeicestershireLive", type: "Daily (Reach plc), free to read" }, { outlet: "BBC Radio Leicester", type: "BBC local radio" }, { outlet: "Great Central Gazette", type: "Independent co-operative newsroom" } ],
  birmingham:  [ { outlet: "Birmingham Mail / BirminghamLive", type: "Daily (Reach plc)" }, { outlet: "BBC Radio WM", type: "BBC local radio" }, { outlet: "Birmingham Dispatch", type: "Independent newsletter newsroom" } ],
  manchester:  [ { outlet: "Manchester Evening News", type: "Daily (Reach plc)" }, { outlet: "BBC Radio Manchester", type: "BBC local radio" }, { outlet: "The Mill", type: "Independent newsletter newsroom" } ],
  leeds:       [ { outlet: "Yorkshire Evening Post", type: "Daily (National World)" }, { outlet: "BBC Radio Leeds", type: "BBC local radio" }, { outlet: "Leeds Inspired listings / community press", type: "Community" } ],
  sheffield:   [ { outlet: "The Star (Sheffield)", type: "Daily (National World)" }, { outlet: "BBC Radio Sheffield", type: "BBC local radio" }, { outlet: "Sheffield Tribune", type: "Independent newsletter newsroom" } ],
  bristol:     [ { outlet: "Bristol Post / BristolLive", type: "Daily (Reach plc)" }, { outlet: "BBC Radio Bristol", type: "BBC local radio" }, { outlet: "The Bristol Cable", type: "Independent media co-op" } ],
  newcastle:   [ { outlet: "The Chronicle / ChronicleLive", type: "Daily (Reach plc)" }, { outlet: "BBC Radio Newcastle", type: "BBC local radio" } ],
  nottingham:  [ { outlet: "Nottingham Post / NottinghamshireLive", type: "Daily (Reach plc)" }, { outlet: "BBC Radio Nottingham", type: "BBC local radio" } ],
  liverpool:   [ { outlet: "Liverpool Echo", type: "Daily (Reach plc)" }, { outlet: "BBC Radio Merseyside", type: "BBC local radio" }, { outlet: "The Post (Liverpool)", type: "Independent newsletter newsroom" } ],
  cardiff:     [ { outlet: "WalesOnline / South Wales Echo", type: "Daily (Reach plc)" }, { outlet: "BBC Radio Wales", type: "BBC national radio (Wales)" } ],
  glasgow:     [ { outlet: "Glasgow Times", type: "Daily (Newsquest)" }, { outlet: "BBC Radio Scotland", type: "BBC national radio (Scotland)" }, { outlet: "Glasgow Live", type: "Reach plc" } ],
  edinburgh:   [ { outlet: "Edinburgh Evening News", type: "Daily (National World)" }, { outlet: "BBC Radio Scotland", type: "BBC national radio (Scotland)" } ],
  london:      [ { outlet: "MyLondon", type: "Reach plc" }, { outlet: "BBC Radio London", type: "BBC local radio" }, { outlet: "Local borough paper / hyperlocal (e.g. Southwark News, Hackney Citizen)", type: "Independent local press" } ],
  brighton:    [ { outlet: "The Argus (Brighton)", type: "Daily (Newsquest)" }, { outlet: "BBC Radio Sussex", type: "BBC local radio" } ],
  oxford:      [ { outlet: "Oxford Mail", type: "Daily (Newsquest)" }, { outlet: "BBC Radio Oxford", type: "BBC local radio" }, { outlet: "Oxford Clarion", type: "Independent" } ],
  cambridge:   [ { outlet: "Cambridge News", type: "Reach plc" }, { outlet: "BBC Radio Cambridgeshire", type: "BBC local radio" } ],
  generic:     [ { outlet: "Your area's daily/weekly title (Reach, Newsquest or National World)", type: "Regional press" }, { outlet: "BBC local radio for your county", type: "BBC local radio" }, { outlet: "Independent/community newsroom where present (ICNN member)", type: "Community press" } ]
};

/* Mock contact shells — used only to show the intended UI; always labelled. */
window.CF_MEDIA_MOCK_CONTACTS = [
  { role: "Local democracy reporter (LDRS)", note: "covers council decisions as their beat — usually the right first pitch" },
  { role: "News desk / newsdesk email", note: "generic route; slower, still works for photo-led stories" },
  { role: "Breakfast show producer", note: "BBC local radio — strong for parent/resident voices" }
];
