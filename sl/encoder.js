import * as exceptions from "./exeptions.js"

const letters = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    " ",
    "a",
    "A",
    "b",
    "B",
    "c",
    "C",
    "d",
    "D",
    "e",
    "E",
    "f",
    "F",
    "g",
    "G",
    "h",
    "H",
    "i",
    "I",
    "j",
    "J",
    "k",
    "K",
    "l",
    "L",
    "m",
    "M",
    "n",
    "N",
    "o",
    "O",
    "p",
    "P",
    "q",
    "Q",
    "r",
    "R",
    "s",
    "S",
    "t",
    "T",
    "u",
    "U",
    "v",
    "V",
    "w",
    "W",
    "x",
    "X",
    "y",
    "Y",
    "z",
    "Z",
    "*",
    "/",
    ".",
    ",",
    "!",
    '"',
    "§",
    "$",
    "%",
    "_",
    "-",
    "(",
    "´",
    ")",
    "`",
    "?",
    "\n",
    "@",
    "#",
    "~",
    ";",
    ":",
    "+",
    "&",
    "|",
    "^",
    "'"
]

export class Encoding {
    decode(inp) {
        if (typeof inp != "string") throw (exceptions.InvalidDecodeInput)

        let outp = ""

        for (let i = 0; i < Math.floor(inp.length / 2); i++) {
            const letter = letters[+`${inp.charAt(i * 2)}${inp.charAt((i * 2) + 1)}`]
            outp += letter
        }
        return outp
    }
    encode(inp) {
        if (typeof inp != "string") throw (exceptions.InvalidDecodeInput)
        let outp = ""
       inp.split("").forEach((char)=>{
        outp += letters.indexOf(char)
       
       })
        return outp
    }
}