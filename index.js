#!/usr/bin/env node

const csv = require('csv-parser');
const fs = require('fs');
const util = require('util');
const urlparse = require('url-parse');
const commander = require('commander');

let res = [];

commander.version('0.0.1')
    .option('-i, --input <path>', 'Input CSV file', null)
    .option('-o, --output <path>', 'Output file name', null)
    .option('-t, --type <type>', 'Output type [nginx, apache, vue]', /^(nginx|apache|vue)$/i ,null)
    .parse(process.argv);

if (commander.input === null || commander.type === null) {
    console.log("You seem lost ... Here's the help");
    commander.outputHelp();
    return;
}

let converted = [];

function getVue(url, redir) {
    return {path: url, redirect: redir};
}

function getNginx(url, redir) {
    return util.format("location = %s {\n\trewrite ^ %s permanent;\n}", url, redir);
}

function getApache(url, redir) {
    return util.format("RedirectPermanent %s \t %s", url, redir);
}

fs.createReadStream(commander.input)
    .pipe(csv())
    .on('data', (data) => res.push(data))
    .on('end', () => {
	res.forEach((item) => {
	    if (!("url" in item) || !("redir" in item)) {
		console.log("panic.jpg Malformed CSV (CSV needs to contain 'url' and 'redir' columns");
		process.exit(1);
	    }
	    let parsedUrl = urlparse(encodeURI(decodeURI(item.url)));
	    let parsedRedir = urlparse(encodeURI(decodeURI(item.redir)));
	    
	    let finalUrl = parsedUrl.pathname + parsedUrl.query;
	    let finalRedir = parsedRedir.pathname + parsedRedir.query;

	    switch (commander.type) {
	    case "vue":
		converted.push(getVue(finalUrl, finalRedir));
		break;
	    case "nginx":
		converted.push(getNginx(finalUrl, finalRedir));
		break;
	    case "apache":
		converted.push(getApache(finalUrl, finalRedir));
		break;
	    }
	    
	});
	console.log("done");
	//console.log(converted);
	let toWrite = "";
	if (commander.type === "vue") {
	    toWrite = JSON.stringify(converted, null, 4);
	} else {
	    toWrite = converted.join('\n');
	}
	
	if (commander.output === null) {
	    console.log("-----------------TERMINAL OUTPUT------------------(use -o to specify an output file)");
	    console.log(toWrite);
	} else {
	    fs.writeFile(commander.output, toWrite, (err, data) => {
		if (err) {
		    console.log("Error while writing to file : ", err);
		} else {
		    console.log("Sucessfully wrote to file !");
		}
	    });
	}
    });


