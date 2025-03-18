import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { csvFormat } from "d3";
import { Market } from "./market.js";

const port = process.env.PORT || 3000;
const eventTimeout = process.env.EVENTS_TIMEOUT || 2000;
const simulateLateResponse = !!process.env.LATE_RESPONSE || false;
const startAt = process.env.START_AT || 0;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  allowEIO3: true,
  cors: { credentials: true, origin: "http://localhost:5173" },
});
const market = new Market(startAt);

app.use(cors());

app.get("/market-history", (req, res) => {
  setTimeout(function () {
    const data = csvFormat(market.history, ["timestamp", "ticker", "price"]);
    setTimeout(function () {
      res.set("Content-Type", "text/csv").status(200).send(data);
    }, simulateLateResponse * eventTimeout);
  }, simulateLateResponse * eventTimeout);
});

server.listen(port, function () {
  console.log("Server listening at port %d", port);
});

io.on("connection", (socket) => {
  console.log("Connected");

  socket.on("disconnect", (reason) => {
    console.log(reason);
  });
});

setInterval(() => {
  const events = market.generateMarketEvents();
  if (events.newDay) {
    io.emit("start new day", events);
  } else {
    io.emit("market events", events);
  }
}, eventTimeout);
