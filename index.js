const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.set("trust proxy", true);
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const ADMIN_KEY = process.env.ADMIN_KEY || "FLCL1483";
const visits = [];

// 🔧 FIXED IP FUNCTION
function getIP(req) {
  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.socket.remoteAddress ||
    "";

  if (!ip) return "Unknown";

  // Convert IPv4-mapped IPv6
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  return ip;
}

// 📡 TRACK ENDPOINT
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
  } catch (err) {
    console.log("Geo lookup failed");
  }

  const visit = {
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

// 🔐 PROTECTED API
app.get("/api/visits", (req, res) => {
  if (req.headers.authorization !== `Bearer ${ADMIN_KEY}`) {
    return res.sendStatus(403);
  }

  res.json(visits);
});

// 🏠 OPTIONAL HOMEPAGE
app.get("/", (req, res) => {
  res.send("Analytics server running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Analytics running on port ${PORT}`);
});
