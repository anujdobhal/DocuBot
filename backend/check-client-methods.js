import client from "./src/config/qdrant.js";

console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(client)).filter(m => m.toLowerCase().includes("search") || m.toLowerCase().includes("query")));