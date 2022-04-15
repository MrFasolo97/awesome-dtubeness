const { Command, Option } = require('commander');
const fs = require("fs");
const { Prompt, prompt } = require('enquirer');
const string_similarity = require("string-similarity");

function buildPage() {
  const categories = JSON.parse(fs.readFileSync('data/categories.json'));
  let r = "# Awesome DTubeness\n";
  let data = fs.readFileSync('data/data.json');
  data = JSON.parse(data);
  data.sort((a, b) => a.title.localeCompare(b.title));
  for (let category in categories) {
    r = r + "\n## " + categories[category] + "\n";
    for(let i=0; i<data.length; i++) {
      if (data[i]["category"] == categories[category]) {
        r = r + "- ["+data[i]["title"]+"]("+data[i]["url"]+")"+" "+data[i]["description"]+"\n";
      }
    }
  }
  fs.writeFileSync("docs/index.md", r);
}

async function addElement(url, desc, category, title=null) {
    let data = fs.readFileSync('data/data.json');
    let json = JSON.parse(data);
    let new_title = null;
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
                  default: "y",
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
    if (title !== null) {
      new_title = title;
    } else {
      let array_title = url.split("/");
      new_title = array_title[array_title.length-2]+"/"+array_title[array_title.length-1];
    }
    json.push({title: new_title, url: url, description: desc, category: category});
    fs.writeFileSync('data/data.json', JSON.stringify(json, null, 4));
}

const categories = JSON.parse(fs.readFileSync('data/categories.json'));
const program = new Command();
program
  .name('dtube-awesomeness')
  .description('Utility for the dtube-awesomeness list')
  .version('0.0.1');
  program.command("add").description("Adds an element to the list")
  .argument("<URL>", "URL to the relevant page (I.e. GitHub repository)")
  .argument("<desc>", "The item description.")
  .addOption(new Option('-c, --category <category_name>', 'In which category should we add this item?', "miscellanea").choices(categories))
  .addOption(new Option('-t, --title <title>', 'The title this item should have (defaults to user/repository).', null))
  .action((url, desc, category, title) => addElement(url, desc, category.category, title.title));
program.command("build").description("Builds the page").action(() => buildPage());

program.parse();
