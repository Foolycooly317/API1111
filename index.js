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

app.post("/track", async (req, res) => {
  const ip =
    function getIPv4(req) {
  let ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "";

  // Convert IPv6 localhost / mapped IPv4
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  // If it's pure IPv6, you can't convert it to real IPv4
  if (ip.includes(":")) {
    return "IPv6";
  }

  return ip;
}

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
  } catch {}

  visits.unshift({
    ip,
    time: new Date().toISOString(),
    page: req.body.page || "Unknown",
    referrer: req.body.referrer || "None",
    userAgent: req.headers["user-agent"] || "Unknown",
    ...location
  });

  res.sendStatus(204);
});

app.get("/api/visits", (req, res) => {
  if (req.headers.authorization !== `Bearer ${ADMIN_KEY}`) {
    return res.sendStatus(403);
  }

  res.json(visits);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Analytics running on port ${PORT}`);
});
