import { Encoding } from "./sl/encoder.js";


const encoder = new Encoding();
let encoded = encoder.encode("a\na")
let decoded = encoder.decode(encoded)
console.log(encoded,decoded);