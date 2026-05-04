const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.set("trust proxy", true);
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const ADMIN_KEY = process.env.ADMIN_KEY || "change-this-password";
const visits = [];

function getIP(req) {
  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.socket.remoteAddress ||
    "";

  if (!ip) return "Unknown";

  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
}

function isAdmin(req) {
  return req.headers.authorization === `Bearer ${ADMIN_KEY}`;
}

app.post("/track", async (req, res) => {
  const ip = getIP(req);

  let location = {
    city: "Unknown",
    state: "Unknown",
    country: "Unknown"
  };

  try {
    const geo = await axios.get(`https://ipapi.co/${ip}/json/`);

    location = {
      city: geo.data.city || "Unknown",
      state: geo.data.region || "Unknown",
      country: geo.data.country_name || "Unknown"
    };
  } catch {
    console.log("Geo lookup failed");
  }

  const visit = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    ip,
    time: new Date().toISOString(),
    page: req.body.page || "Unknown",
    referrer: req.body.referrer || "None",
    userAgent: req.headers["user-agent"] || "Unknown",
    ...location
  };

  visits.unshift(visit);
  console.log(visit);

  res.sendStatus(204);
});

app.get("/api/visits", (req, res) => {
  if (!isAdmin(req)) return res.sendStatus(403);
  res.json(visits);
});

app.delete("/api/visits/:id", (req, res) => {
  if (!isAdmin(req)) return res.sendStatus(403);

  const index = visits.findIndex(v => v.id === req.params.id);

  if (index === -1) {
    return res.sendStatus(404);
  }

  visits.splice(index, 1);
  res.sendStatus(204);
});

app.delete("/api/visits", (req, res) => {
  if (!isAdmin(req)) return res.sendStatus(403);

  visits.length = 0;
  res.sendStatus(204);
});

app.get("/", (req, res) => {
  res.send("Analytics server running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Analytics running on port ${PORT}`);
});
