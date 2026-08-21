'use strict';
const db = require('./db');
const STORE = 'fileOrders';

// Track ID like FF-FILE-8392
function genTrackId() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `FF-FILE-${n}`;
}

function createOrder({ buyerNumber, buyerName, cat, plat, filename, price }) {
  let trackId = genTrackId();
  // avoid rare collisions
  while (db.get(STORE, trackId)) trackId = genTrackId();

  const order = {
    trackId,
    buyerNumber,
    buyerName,
    category: cat,
    platform: plat,
    filename,
    price,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.set(STORE, trackId, order);
  return order;
}

function getOrder(trackId) {
  if (!trackId) return null;
  return db.get(STORE, trackId.toUpperCase(), null) || db.get(STORE, trackId, null);
}

function setOrderStatus(trackId, status) {
  const order = getOrder(trackId);
  if (!order) return null;
  order.status = status;
  db.set(STORE, order.trackId, order);
  return order;
}

module.exports = { createOrder, getOrder, setOrderStatus, genTrackId };
