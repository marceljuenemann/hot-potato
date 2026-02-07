import { decode, encode } from "@ensdomains/content-hash";

const ipfs = "bafybeibiiicnjtdd63enq4awu3ww65bdsgphb5ejr5exgc77yf5wcv2gjm";
const encoded = encode("ipfs", ipfs);

console.log(encoded);
