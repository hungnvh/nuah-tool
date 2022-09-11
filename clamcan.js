let total = 0;
let counter = 0;
let infectedFiles = [];

process.on('message', (msg) => {
  total = parseInt(msg.stdout.trim());
  infectedFiles = [];
  console.log('Message from parent:', total);
});


// const path = `clamscan /Users/hungnv/Desktop/ | grep FOUND >> ${__dirname}/tmp.log`

const term = require('child_process')
  .spawn('clamscan', ['/Users/hungnv/Desktop/'], { stdio: [ 'inherit', 'pipe', 'pipe'] });
  // .spawn('clamscan', ['/Users/hungnv/Desktop/', `| grep FOUND >> ${__dirname}/tmp.log`], { stdio: [ 'inherit', 'pipe', 'pipe'] });

process.stdout.write('$ ');

term.stdout.on('data', (data) => {
  const log = data.toString();
  if(log.includes(': OK') || log.includes(' FOUND')) {
    counter++;
    log.includes(' FOUND') ? infectedFiles.push(log) : '';
  }
  const msg = {
    process: counter/total,
    infectedFiles: infectedFiles,
    status: 'running'
  }
  process.send(JSON.stringify(msg));
  process.stdout.write(`\n${data}$ `);
});

term.stderr.on('data', (data) => {
  const log = data.toString();
  if(log.includes(': OK') || log.includes(' FOUND')) {
    counter++;
    log.includes(' FOUND') ? infectedFiles.push(log) : '';
  }
  const msg = {
    process: counter/total,
    infectedFiles: infectedFiles,
    status: 'running'
  }
  process.send(JSON.stringify(msg));
  process.stderr.write(`\n${data}$ `);
});

term.on('close', (data) => {
  const msg = {
    process: 1,
    infectedFiles: infectedFiles,
    status: 'close'
  }
  process.send(JSON.stringify(msg));
  process.stderr.write(`\n${data}$ `);
});
