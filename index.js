let http = require('http');
let fs = require('fs');
let request = require('request');
let argv = require('yargs').argv;

let logStream = argv.log ? fs.createWriteStream(argv.log) : process.stdout;

let localhost = '127.0.0.1';
let scheme = 'http://';
let host = argv.host || localhost;
let port = argv.port || (host === localhost ? 8000 : 80);
let destinationUrl = scheme + host + ':' + port;

http.createServer((req, res) => {
  logStream.write(`Request received at; ${req.url}\n`);
  logStream.write(JSON.stringify(req.headers));
  logStream.write('\n');

  for (let header in req.headers) {
    res.setHeader(header, req.headers[header])
  }

  req.pipe(logStream, { end: false });
  req.pipe(res);
}).listen(8000);

http.createServer((req, res) => {
  logStream.write(`Proxying request to ${ destinationUrl }${ req.url }\n`);
  // logStream.write(JSON.stringify(req.headers));

  let url = (req.headers['x-destination-url']) ? (scheme + req.headers['x-destination-url']) : destinationUrl;

  // Proxy code
  let options = {
    headers: req.headers,
    url: `${ url }${ req.url }`
  };

  options.method = req.method;

  // req.pipe(request(options)).pipe(res);
  let downstreamResponse = req.pipe(request(options));
  // logStream.write(`Proxying request to ${ destinationUrl }${ req.url }\n`);
  logStream.write(JSON.stringify(downstreamResponse.headers));
  logStream.write('\n');
  downstreamResponse.pipe(logStream, { end: false });
  downstreamResponse.pipe(res);
}).listen(9000);