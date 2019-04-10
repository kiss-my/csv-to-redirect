#!/usr/bin/env node

const csv = require('csv-parser');
const fs = require('fs');
const util = require('util');
const urlparse = require('url-parse');
const jsstring = require('javascript-stringify');
const commander = require('commander');

let res = [];

commander.version('0.0.1')
    .option('-i, --input <path>', 'Input CSV file', null)
    .option('-o, --output <path>', 'Output file name (Defaults to outputing to terminal)', null)
	.option('-t, --type <type>', 'Output type [nginx, apache, vue]', /^(nginx|apache|vue)$/i ,null)
	.option('-s, --source <name>', 'Source cell name', 'source')
	.option('-d, --destination <name>', 'Destination cell name', 'destination')
    .parse(process.argv);

if (commander.input === null || commander.type === null) {
    console.log("You seem lost ... Here's the help");
    commander.outputHelp();
    return;
}

let converted = [];

function getVue(source, destination) {
    return {path: source, redirect: destination};
}

function getNginx(source, destination) {
    return util.format("%s\t%s;", source, destination);
}

function getApache(source, destination) {
    return util.format("RedirectPermanent %s \t %s", source, destination);
}

fs.createReadStream(commander.input)
    .pipe(csv())
    .on('data', (data) => res.push(data))
    .on('end', () => {
	res.forEach((item) => {
	    if (!(commander.source in item) || !(commander.destination in item)) {
		console.log(`panic.jpg! Malformed CSV. CSV needs to contain ${commander.source} and ${commander.destination} columns.`);
		process.exit(1);
	    }
	    let parsedSource = urlparse(encodeURI(decodeURI(item[commander.source])));
	    let parsedDestination = urlparse(encodeURI(decodeURI(item[commander.destination])));
	    
	    let finalSource = parsedSource.pathname + parsedSource.query;
		let finalDestination = parsedDestination.pathname + parsedDestination.query;
		if (finalDestination === "") {
			finalDestination = "/";
		}
		if (finalSource === ""){
			finalSource = "/";
		}

	    switch (commander.type) {
	    	case "vue":
				converted.push(getVue(finalSource, finalDestination));
				break;
	    	case "nginx":
				converted.push(getNginx(finalSource, finalDestination));
				break;
	    	case "apache":
				converted.push(getApache(finalSource, finalDestination));
				break;
	    }
	    
	});
	let toWrite = "";
	switch (commander.type) {
		case "vue":
			toWrite = jsstring.stringify(converted, null, " ");
			break;
		case "nginx":
			converted.push(getNginx("default", "0"));
			toWrite = "map $request_uri $redirect {\n"
						.concat(converted.join("\n"),
						"\n}");
			break;
		case "apache":
			toWrite = converted.join("\n");
			break;
	}
	
	if (commander.output === null) {
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


