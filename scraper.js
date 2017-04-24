/*jslint browser: true*/
/*global console,require*/

//-----------------------------------------------------------------------

function getLivePZTable(html) {
	'use strict';

	var header = html.indexOf('LivePZ-Anpassung');

	return html.substring(html.indexOf('<table', header), html.indexOf('</table>', header) + 8);
}

//-----------------------------------------------------------------------

function getLivePZ(html) {
	'use strict';

	var livePZ = [],
		table = getLivePZTable(html),
		rows = table.split('<tr'),
		r = 0,
		cols,
		date,
		points,
		arr = [],
		key;

	++r; // table
	++r; // empty row

	cols = rows[r].split('<td');
	if ('>Datum</td>' !== cols[2]) {
		console.error('HTML table format changed!');
		return livePZ;
	}

	for (++r; r < rows.length; ++r) {
		cols = rows[r].split('<td');
		date = cols[2].split('>')[1].split('<')[0];

		if (date !== '') {
			if (cols.length === 7) {
				points = cols[4].split('>')[1].split('<')[0];
			} else if (cols.length === 8) {
				points = cols[5].split('>')[1].split('<')[0];
			} else {
				points = cols[7].split('>')[1].split('<')[0];
			}
			points = points.split(' ')[0];
			livePZ[date] = parseInt(points, 10);
		}
	}

	for (key in livePZ) {
		if (livePZ.hasOwnProperty(key)) {
			arr.push({date: key, points: livePZ[key]});
		}
	}
	return arr;
}

//-----------------------------------------------------------------------

function getContent(uri, callback) {
	'use strict';

	var request = require('request'),
		options = {
			uri: uri,
			headers: {
				'Connection': 'keep-alive',
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:52.0) Gecko/20100101 Firefox/52.0'
			}
		};

	request(options, function (error, response, page) {
		if (!error && response.statusCode === 200) {
			callback(page);
		}
	});
}

//-----------------------------------------------------------------------

function scrapePlayer(num, callback) {
	'use strict';

	var base = 'http://bettv.tischtennislive.de/default.aspx?L1=Public',
		level = '&L2=Kontakt',
		levelP = '&L2P=114792', // ??? 114784 // 114792
		member = '&MID=' + num, // 93671
		page = '&Page1=Bilanz',
		subPage = '&Page=EntwicklungTTR',
		sa = '&SA=96', // ???
		uri = base + level + levelP + member + page + subPage + sa;

	getContent(uri, function (html) {
		var filePath = './harvest/member' + num + '.json',
			fs = require('fs'),
			livePZ = getLivePZ(html);

		fs.writeFileSync(filePath, JSON.stringify(livePZ));
		callback();
	});
}

//-----------------------------------------------------------------------

function start() {
	'use strict';

	var filePath = './harvest',
		fs = require('fs');

	if (!fs.existsSync(filePath)) {
		fs.mkdirSync(filePath);
	}

	scrapePlayer(93671, function () {
		console.log('finish');
	});
}

//-----------------------------------------------------------------------

try {
	console.log();

	start();
} catch (e) {
	console.error(e);
}

//-----------------------------------------------------------------------
//eof
