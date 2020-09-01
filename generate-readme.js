const fs = require("fs");
const readmeTemplate = fs.readFileSync("./readme-template.md").toString();
const packageFile = JSON.parse(fs.readFileSync("./package.json"));
const readme = readmeTemplate.replace(/{{([^}]+)}}/g, (match, variable) => {
  const parts = variable.split(".");
  let value = packageFile[parts.shift()];
  while (parts.length > 0) {
    value = value[parts.shift()];
  }
  return value;
});
fs.writeFileSync("./README.md", readme);