const { Command, Option } = require('commander');
const fs = require("fs");
const { Prompt, prompt } = require('enquirer');
const string_similarity = require("string-similarity");

function buildPage() {
  const categories = JSON.parse(fs.readFileSync('data/categories.json'));
  let r = "";
  let data = fs.readFileSync('data/data.json');
  data = JSON.parse(data);
  data.sort((a, b) => a.title.localeCompare(b.title));
  for (let category in categories) {
    r = r + "## " + categories[category] + "\n";
    for(let i=0; i<data.length; i++) {
      if (data[i]["category"] == categories[category]) {
        r = r + "- ["+data[i]["title"]+"]("+data[i]["url"]+")"+" "+data[i]["description"]+"\n";
      }
    }
  }
  fs.writeFileSync("pages/list.md", r);
}

async function addElement(url, title, desc, category) {
    let data = fs.readFileSync('data/data.json');
    let json = JSON.parse(data);
    if (category === null) {
      category = 'unknown';
    }
    for(let item in json) {
        let answer = null;
        if(string_similarity.compareTwoStrings(url, json[item]["url"])>0.95) {
           answer = await prompt(
                {
                  type: 'confirm',
                  name: 'double_check',
                  message: 'Did you mean '+json[item]["url"]+" ?",
                }
              ).then(answer => {
                return answer;
            });
            if (answer.double_check) {
                console.log("Skipping", url)
                return;
            }
        }
    }
    json.push({url: url, title: title, description: desc, category: category});
    fs.writeFileSync('data/data.json', JSON.stringify(json));
}

const categories = JSON.parse(fs.readFileSync('data/categories.json'));
const program = new Command();
program
  .name('dtube-awesomeness')
  .description('Utility for the dtube-awesomeness list')
  .version('0.0.1');
  program.command("add").description("Adds an element to the list")
  .argument("<URL>", "URL to the relevant page (I.e. GitHub repository)")
  .argument("<title>", "Will be the name on the list, also the link's text.")
  .argument("<desc>", "The item description.")
  .addOption(new Option('-c, --category <category_name>', 'In which category should we add this item?').choices(categories))
  .action((url, title, desc, category) => addElement(url, title, desc, category.category));
program.command("build").description("Builds the page").action(() => buildPage());

program.parse();
