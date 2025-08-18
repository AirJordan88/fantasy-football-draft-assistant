// ✅ Load FantasyPros CSV from local folder
async function loadFantasyProsData() {
  try {
    const response = await fetch("FantasyPros_2025_Overall_ADP_Rankings.csv");
    const text = await response.text();
    const lines = text.split("\n").slice(1); // Skip header

    return lines.map((line, i) => {
      const parts = line.split(",").map(p => p.replace(/"/g, "").trim());
      if (parts.length < 12) return null;

      const [rank, name, team, bye, pos, , , , , , , avg] = parts;
      const parsedAdp = parseFloat(avg);
      if (!name || !pos || isNaN(parsedAdp)) return null;
      if (["K", "DST"].includes(pos.replace(/\d+$/, ""))) return null;


      return {
        id: `FantasyPros-${i}`,
        name,
        team,
        bye,
        position: pos.replace(/\d+$/, ""),
        adp: parsedAdp,
        tier: Math.ceil((parseInt(rank) || i + 1) / 15)
      };
    }).filter(Boolean);
  } catch (err) {
    console.error("FantasyPros load error:", err);
    return [];
  }
}

// ✅ Load Sleeper CSV from local folder
async function loadSleeperData() {
  try {
    const response = await fetch("Sleeper_2025_Overall_ADP_Rankings.csv");
    const text = await response.text();
    const lines = text.split("\n").slice(1); // Skip header

    return lines.map((line, i) => {
      const parts = line.split(",").map(p => p.replace(/"/g, "").trim());
      if (parts.length < 6) return null;

      const [name, team, bye, pos, , adp] = parts;
      const parsedAdp = parseFloat(adp);
      if (!name || !pos || isNaN(parsedAdp)) return null;
      if (["K", "DST"].includes(pos.replace(/\d+$/, ""))) return null;


      return {
        id: `Sleeper-${i}`,
        name,
        team,
        bye,
        position: pos.replace(/\d+$/, ""),
        adp: parsedAdp,
        tier: Math.ceil(i / 15)
      };
    }).filter(Boolean);
  } catch (err) {
    console.error("Sleeper load error:", err);
    return [];
  }
}

// ✅ Load ESPN CSV from local folder
async function loadEspnData() {
  try {
    const response = await fetch("ESPN_2025_Overall_ADP_Rankings.csv");
    const text = await response.text();
    const lines = text.split("\n").slice(1); // Skip header
    console.log("Raw ESPN lines:", lines.slice(0, 5));

    return lines.map((line, i) => {
      const parts = line.split(",").map(p => p.replace(/"/g, "").trim());
      console.log("Parsed ESPN row:", parts);
      if (parts.length < 6) return null;

      const [name, team, bye, pos, , adp] = parts;
      const parsedAdp = parseFloat(adp);
      if (!name || !pos || isNaN(parsedAdp)) {
        console.warn("Skipping invalid ESPN row:", { name, pos, adp });
        return null;
      }
      if (["K", "DST"].includes(pos.replace(/\d+$/, ""))) return null;


      return {
        id: `ESPN-${i}`,
        name,
        team,
        bye,
        position: pos.replace(/\d+$/, ""),
        adp: parsedAdp,
        tier: Math.ceil(i / 15)
      };
    }).filter(Boolean);
  } catch (err) {
    console.error("ESPN load error:", err);
    return [];
  }
}

async function loadRotoVizData() {
  try {
    const response = await fetch("RVRedraftRankings.csv");
    const text = await response.text();
    const lines = text.split("\n").slice(1); // Skip header

    return lines.map((line, i) => {
      const parts = line.split(",").map(p => p.replace(/"/g, "").trim());
      if (parts.length < 8) return null;

      const [, rank, name, pos, team, , avgRank, avgTier] = parts;
      const parsedAdp = parseFloat(avgRank);
      const parsedTier = parseInt(avgTier);

      if (!name || !pos || isNaN(parsedAdp)) return null;
      if (["K", "DST"].includes(pos)) return null;

      return {
        id: `RotoViz-${i}`,
        name,
        team,
        bye: "", // No bye info in this file
        position: pos,
        adp: parsedAdp,
        tier: parsedTier || Math.ceil(i / 15)
      };
    }).filter(Boolean);
  } catch (err) {
    console.error("RotoViz load error:", err);
    return [];
  }
}


// ✅ Generate mock data for ESPN and RotoViz
function generateMockData(source) {
  const positions = ["QB", "RB", "WR", "TE"];
  const data = [];
  for (let i = 0; i < 180; i++) {
    const pos = positions[i % positions.length];
    data.push({
      id: `${source}-${i}`,
      name: `${source} Player ${i + 1}`,
      position: pos,
      adp: Math.floor(Math.random() * 180) + 1,
      tier: Math.ceil((i % 60) / 15)
    });
  }
  return data;
}

// ✅ Initialize ADP data object
const adpData = {
  ESPN: [],
  RotoViz: generateMockData("RotoViz")
};

let currentSource = "ESPN";
let draftedPlayers = new Set();
let roster = {
  QB: [],
  RB: [],
  WR: [],
  TE: [],
  FLEX: []
};

// ✅ Load external data and render
Promise.all([
  loadFantasyProsData(),
  loadSleeperData(),
  loadEspnData(),
  loadRotoVizData()
]).then(([fantasyPros, sleeper, espn, rotoViz]) => {
  console.log("FantasyPros loaded:", fantasyPros.slice(0, 5));
  console.log("Sleeper loaded:", sleeper.slice(0, 5));
  console.log("ESPN loaded:", espn.slice(0, 5));
  console.log("RotoViz loaded:", espn.slice(0, 5));

  adpData.FantasyPros = fantasyPros;
  adpData.Sleeper = sleeper;
  adpData.ESPN = espn;
  adpData.RotoViz = rotoViz;

  renderTable(currentSource); // Initial render after data loads
});

// ✅ Filter buttons
document.querySelectorAll("#adpFilters button").forEach(btn => {
  btn.addEventListener("click", () => {
    currentSource = btn.dataset.source;
    renderTable(currentSource);
  });
});

// ✅ Render table
function renderTable(source) {
  console.log("Rendering source:", source);
  const table = document.getElementById("adpTable");
  table.innerHTML = "";

  const players = adpData[source];
  console.log("Players to render:", players?.length);

  if (!players || players.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="12" style="text-align:center; padding:1em;">
          No data available for ${source}
        </td>
      </tr>
    `;
    return;
  }

  const rows = 15;
  const cols = 12;

  for (let r = 0; r < rows; r++) {
    const row = document.createElement("tr");
    const cells = [];

    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("td");

      const colIndex = r % 2 === 0 ? c : cols - 1 - c;
      const index = r * cols + colIndex;
      const player = players[index];

      if (player) {
        cell.innerHTML = `
          <strong>${player.name}</strong><br>
          ADP: ${player.adp}<br>
          <span>${player.team} | ${player.position}</span><br>
          <small>Bye: ${player.bye}</small>
        `;

        cell.dataset.id = player.id;
        cell.dataset.position = player.position;
        cell.dataset.tier = player.tier;

        if (draftedPlayers.has(player.id)) {
          cell.classList.add("drafted");
        }

        cell.addEventListener("click", () => {
          if (draftedPlayers.has(player.id)) {
            draftedPlayers.delete(player.id);
            removeFromRoster(player);
          } else {
            draftedPlayers.add(player.id);
            addToRoster(player);
          }
          renderTable(currentSource);
        });
      } else {
        cell.textContent = "";
      }

      cells.push(cell);
    }

    cells.forEach(cell => row.appendChild(cell));
    table.appendChild(row);
  }
}

// ✅ Add player to roster
function addToRoster(player) {
  const pos = player.position;
  if (roster[pos]) {
    roster[pos].push(player.name);
  } else {
    roster.FLEX.push(player.name);
  }
  updateRosterDisplay();
}

function removeFromRoster(player) {
  const pos = player.position;
  if (roster[pos]) {
    roster[pos] = roster[pos].filter(name => name !== player.name);
  } else {
    roster.FLEX = roster.FLEX.filter(name => name !== player.name);
  }
  updateRosterDisplay();
}


// ✅ Update roster display
function updateRosterDisplay() {
  const list = document.getElementById("rosterList");
  list.innerHTML = "";

  Object.entries(roster).forEach(([pos, players]) => {
    const item = document.createElement("li");
    item.textContent = `${pos}: ${players.join(", ") || "—"}`;
    list.appendChild(item);
  });
}
