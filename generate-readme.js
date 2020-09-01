const fs = require("fs");
const readmeTemplate = fs.readFileSync("./readme-template.txt").toString();
const packageFile = JSON.parse(fs.readFileSync("./package.json"));
const readme = readmeTemplate.replace(/{{(.+)}}/g, (match, variable) => packageFile[variable]);
fs.writeFileSync("./README.md", readme);