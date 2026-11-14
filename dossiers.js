// One dossier per location in locations.json (same coordinates).
// "scene" = what happened there in the story (spoiler-light, beginner friendly)
// "intel" = three hints, from vague to nearly-giving-it-away
// "streetview" = what to look for in the GeoGuessr frame
window.DOSSIERS = [
  {
    id: "frost",
    codename: "FROZEN ECHO",
    sector: "Outer Rim — ice world",
    source: "The Empire Strikes Back (1980)",
    planet: "Hoth",
    place: "Finse & the Hardangerjøkulen glacier, Norway",
    lat: 60.60271200460722, lng: 7.501146703474706, heading: 187,
    scene:
      "The film opens on a planet of nothing but snow. The rebels are hiding in an ice base, a scout is dragged off by a snow beast, and then the Empire attacks with giant four-legged walking tanks. It is one of the most famous battles in the whole saga.",
    intel: [
      "There is no road into this village. The crew, like everyone else, arrived by train.",
      "Northern Europe, at 1,222 metres above sea level, on one of the continent's most famous mountain railways.",
      "A glacier town on the Bergen Railway in Norway. The hotel here put up the film crew in a real blizzard in 1979."
    ],
    streetview: [
      "Snow, rail tracks and almost no trees: you're above the treeline",
      "Red-painted Scandinavian wooden buildings",
      "Norwegian text (æ, ø, å) on any sign you can find"
    ]
  },
  {
    id: "sand",
    codename: "TWIN SUNS",
    sector: "Outer Rim — desert world",
    source: "A New Hope (1977)",
    planet: "Tatooine",
    place: "Matmata, Tunisia (Hotel Sidi Driss)",
    lat: 33.542518806270145, lng: 9.96758303308382, heading: 23,
    scene:
      "Where it all begins. A farm boy lives with his aunt and uncle in a sunken home dug into the desert ground, dreaming of leaving. The family's round courtyard home was a real underground Berber dwelling that is now a hotel, and you can still sleep in it.",
    intel: [
      "People here have lived in homes carved into the ground for centuries, to beat the heat.",
      "North Africa. Road signs come in two scripts, one of them French.",
      "A troglodyte village in southern Tunisia, where the farm boy's childhood home still stands."
    ],
    streetview: [
      "Dry, dusty hills and pale sandstone",
      "Arabic and French on the signs",
      "Cars drive on the right"
    ]
  },
  {
    id: "salt",
    codename: "WHITE SEA",
    sector: "Unknown Regions — mineral world",
    source: "The Last Jedi (2017)",
    planet: "Crait",
    place: "Salar de Uyuni, Bolivia",
    lat: -19.93932526073743, lng: -67.70624540182459, heading: 0,
    scene:
      "The last of the resistance flees to a planet covered in white salt. Every time a ship skims the ground, it leaves a trail of red behind it. A legendary hero makes a final stand here. The filmmakers shot real footage over the world's largest salt flat.",
    intel: [
      "The flattest place on Earth. When it rains, it turns into a mirror of the sky.",
      "South America, almost 3,700 metres up on the high Andean plateau.",
      "The world's largest salt flat, in Bolivia."
    ],
    streetview: [
      "Endless white ground cracked into hexagon shapes",
      "Mountains low on the horizon, nothing else",
      "No road lines at all, so the 'no road' look is itself the clue"
    ]
  },
  {
    id: "fire",
    codename: "BURNING DUEL",
    sector: "Outer Rim — volcanic world",
    source: "Revenge of the Sith (2005)",
    planet: "Mustafar",
    place: "Mount Etna, Sicily, Italy",
    lat: 37.72447340318279, lng: 15.004018799671895, heading: 104,
    scene:
      "Master and apprentice fight on a planet of rivers of lava. It's the moment the hero becomes the villain you meet in Empire Strikes Back. Some of the fire in the background is real: it was filmed during an actual eruption of this volcano in 2002.",
    intel: [
      "Europe's most active volcano. Locals call it 'Mongibello'.",
      "A Mediterranean island at the tip of a famous boot.",
      "Mount Etna in Sicily. Look for black lava rock right next to the road."
    ],
    streetview: [
      "Black volcanic gravel and old lava flows",
      "Italian signs, with white-and-red striped road posts",
      "Cars drive on the right"
    ]
  },
  {
    id: "jungle",
    codename: "TEMPLE MOON",
    sector: "Outer Rim — jungle moon",
    source: "A New Hope (1977)",
    planet: "Yavin 4",
    place: "Tikal, Guatemala",
    lat: 17.221756852559178, lng: -89.62303486128663, heading: 343,
    scene:
      "After escaping the Death Star, the heroes fly to the rebels' hidden base on a jungle moon. A lookout watches their ship arrive over ancient temples that rise out of the treetops. From here the rebels launch the attack that ends the movie.",
    intel: [
      "Ancient stepped pyramids rise above a jungle canopy.",
      "Central America. This was once one of the greatest cities of the Maya.",
      "A Maya ruin in northern Guatemala's Petén jungle."
    ],
    streetview: [
      "Steep stone temple steps, looking up",
      "Thick tropical forest all around",
      "Spanish on any information boards"
    ]
  },
  {
    id: "palace",
    codename: "ROYAL PLAZA",
    sector: "Mid Rim — lake world",
    source: "Attack of the Clones (2002)",
    planet: "Naboo",
    place: "Plaza de España, Seville, Spain",
    lat: 37.37704431824754, lng: -5.9871240178174086, heading: 0,
    scene:
      "Two young characters, a future senator and the boy who will become Darth Vader, walk through the elegant capital of a peaceful planet. This is where their love story starts. The 'palace' is a real half-moon plaza built for a 1929 world's fair.",
    intel: [
      "A huge half-circle of brick and painted tiles, with a canal you can row a boat on.",
      "Southern Europe, in the hottest region of its country, famous for flamenco.",
      "A plaza in Seville, Spain, with tiled alcoves for every province."
    ],
    streetview: [
      "Colourful ceramic tiles (azulejos) on benches and bridges",
      "Red brick arcades curving around you",
      "Horse carriages and orange trees nearby"
    ]
  },
  {
    id: "island",
    codename: "CACTUS OUTPOST",
    sector: "Unknown Regions — mineral world",
    source: "The Last Jedi (2017)",
    planet: "Crait (the salt plains)",
    place: "Isla Incahuasi, Salar de Uyuni, Bolivia",
    lat: -20.239782631775306, lng: -67.6269119830612, heading: 266,
    scene:
      "Same white world as before, from a different angle. In the middle of the endless salt there's a rocky 'island' covered in giant cacti, the only high ground for miles. The perfect spot for a lookout before the final stand.",
    intel: [
      "An island with no water around it.",
      "Its cacti are taller than a house and can be more than a thousand years old.",
      "A cactus island in the middle of Bolivia's great salt flat."
    ],
    streetview: [
      "Giant column cacti",
      "Rocky coral-like ground",
      "Bright white plain stretching to the horizon"
    ]
  },
  {
    id: "citadel",
    codename: "IMPERIAL CORRIDOR",
    sector: "Imperial Security — classified",
    source: "Rogue One (2016), Cassian Andor's final mission",
    planet: "Scarif Imperial citadel",
    place: "Canary Wharf, London, UK",
    lat: 51.50632290462817, lng: -0.01654610365279724, heading: 12,
    scene:
      "Before Andor became a series, Cassian Andor (the hero of the show) led a desperate mission to steal the Death Star plans from a high-security Imperial base. Its huge, cold, concrete-and-glass halls were filmed in this London business district's Underground station.",
    intel: [
      "Shining towers, cold concrete and glass: the Empire's style, borrowed from a banking district.",
      "A capital city on a famous river. Here they call the subway 'the Tube'.",
      "Canary Wharf in East London."
    ],
    streetview: [
      "Glass skyscrapers and very clean modern design",
      "Docklands water, if you can look outside",
      "UK: cars drive on the left"
    ]
  },
  {
    id: "heist",
    codename: "THE EYE",
    sector: "Imperial garrison — highland world",
    source: "Andor (2022), Season 1",
    planet: "Aldhani",
    place: "A85 near Loch Awe & Cruachan, Argyll, Scotland",
    lat: 56.40465200984469, lng: -5.01275776297946, heading: 34,
    scene:
      "Cassian joins a small band of rebels to rob an Imperial garrison of an entire quarter's payroll. They time it for a once-a-year meteor shower that lights up the sky. It's the heist that starts to turn him into a true rebel, and the dam they escape over is a real hydroelectric dam near here.",
    intel: [
      "Misty glens, a long loch and a dam hidden in a mountain.",
      "This country drives on the left, and its signs can be in two languages, one of them Gaelic.",
      "The A85 in Argyll, Scotland, close to Cruachan Dam."
    ],
    streetview: [
      "Green and brown highland hills, often with a loch",
      "Cars drive on the left, with white dashed centre lines",
      "Black-and-white roadside posts and UK-style signs"
    ]
  }
];
