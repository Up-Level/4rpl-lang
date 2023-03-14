import * as fs from "fs";
import axios from "axios";
import * as nhp from "node-html-parser";

processCommands();

async function processCommands() {
    let commands: {
        "name": String,
        "url": String,
        "usage": String,
        "description": String
    }[] = [];

    const file = fs.readFileSync("src/data/commands.html", "utf-8");
    const lines = file.split(/\r\n/)

    let i = 0;
    for (const line of lines) {
        // For each line, find the url and name.
        const results = line.match(/<a href="(.+)">(.+)<\/a>/);

        if (results == null || results.length < 3) continue; // If none found (should never happen)
        let command = {
            "name": results[2],
            "url": results[1],
            "usage": "",
            "description": ""
        };

        const res = await axios.get(command.url);
        const root = nhp.parse(res.data);

        let usage: nhp.HTMLElement | undefined;

        let usageCandidates = root.querySelectorAll(".level1");
        usage = usageCandidates.find(element => {
            // Find the correct element with the level1 class, as sometimes the tab items also use level1.
            return element.parentNode.classNames == "page group";
        });
        if (usage != undefined) command.usage = usage.innerText.trim();

        const description = root.querySelector(".level2");
        if (description != null) {
            let descriptionText = description.innerHTML.trim();
            // If urls are used in the description, then prepend them with the knucracker url so they work properly.
            descriptionText = descriptionText.replace("href=\"", "href=\"https://knucklecracker.com")

            command.description = descriptionText;
        }

        commands.push(command);

        i += 1;
        if (i % 10 == 0) {
            console.log(`${i / lines.length * 100}% complete, just completed ${command.name}`);
        }
    }

    fs.writeFileSync("src/data/commands.json", JSON.stringify(commands));
}