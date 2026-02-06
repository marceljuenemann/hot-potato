import { decode, encode } from "@ensdomains/content-hash";

const ipfs = "bafybeif7g3sma2a2mjatfsfodylnkbsdr5xhiy27tiavwri5qygz7lv4ei";
const encoded = encode("ipfs", ipfs);

console.log(encoded);
