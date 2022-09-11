const {app, BrowserWindow, ipcMain} = require('electron')
const url = require("url");
const path = require("path");
const util = require("util");
const exec = util.promisify(require('child_process').exec);
const spawn = util.promisify(require('child_process').spawn);
const { fork } = require('child_process');
const request = require("request");
const schedule = require('node-schedule');
const  randf = require('randomstring');

let mainWindow
let isScanning = false;
let jobNameScheduleSixHours = '';
let jobNameRealTime = '';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true,
      webSecurity: false
    },
    icon: path.join(__dirname, 'src/assets/icons/64x64.png')
  })

  ipcMain.on('set-loadable-software', async (event, title) => {
    await initPiecesofSoftware()
    event.reply('loadable-software-reply', 'done')
  })

  ipcMain.on('scan-clamav', async (event, title) => {
    isScanning = true
    // await exec('> tmp.log');
    await scanClamav(event);
    // const readdata = await exec('cat tmp.log');
    // console.log('scan-clamav log', readdata);
    // isScanning = false;
    // event.reply('scan-clamav-reply', readdata.stdout)
  })

  ipcMain.on('burn-file', async (event, args) => {
    const item = JSON.parse(args);
    const readdata = await exec(`rm ${item.name.slice(0, -1)}`);
    event.reply('burn-file-reply', readdata.stdout)
  })

  ipcMain.on('schedule-six-hours', async (event, args) => {
    const isScheduleSixHours = JSON.parse(args).isScheduleSixHours;
    if(isScheduleSixHours && jobNameScheduleSixHours === '') {
      jobNameScheduleSixHours = randf.generate(10);
      schedule.scheduleJob(jobNameScheduleSixHours, "*/6 * * *", async function() {
        //function Do stuff every 6 hours
        if(isScheduleSixHours && !isScanning) {
          isScanning = true;
          await exec('> tmp.log');
          await scanClamav();
          const readdata = await exec('cat tmp.log');
          console.log('scan-clamav log', readdata);
          isScanning = false
          event.reply('scan-clamav-reply', readdata.stdout)
        }
      });
    } else if (!isScheduleSixHours && jobNameScheduleSixHours !== '') {
      const my_job = schedule.scheduledJobs[jobNameScheduleSixHours];
      my_job.cancel();
    }

  })

  ipcMain.on('schedule-real-time', async (event, args) => {
    console.log('schedule-real-time start', args);
    const isScheduleRealTime = JSON.parse(args).isScheduleRealTime;
    if(isScheduleRealTime && jobNameRealTime === '') {
      jobNameRealTime = randf.generate(10);
      console.log('schedule-real-time', jobNameRealTime);
      schedule.scheduleJob(jobNameRealTime, "*/1 * * * *", async function() {
        //function Do stuff every 5 minutes
        if(isScheduleRealTime && !isScanning) {
          isScanning = true;
          await exec('> tmp.log');
          await scanClamav();
          const readdata = await exec('cat tmp.log');
          const date = new Date()
          console.log('scan-clamav log', date , readdata);
          isScanning = false;
          event.reply('scan-clamav-reply', readdata.stdout)
        }
      });
    } else if (!isScheduleRealTime && jobNameRealTime !== '') {
      const my_job = schedule.scheduledJobs[jobNameRealTime];
      my_job.cancel();
    }
  })

  ipcMain.on('clean-system', async (event, title) => {
    await cleanByBeachBit()
    event.reply('clean-system-reply', 'done')
  })

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `/dist/nuah-tool/index.html`),
      protocol: "file:",
      slashes: true
    })
  );
  mainWindow.webContents.openDevTools() // for debug

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', () =>{
  createWindow()
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})

async function initPiecesofSoftware() {
  await new Promise(r => setTimeout(r, 500));
  console.log('START install clamav--------------', __dirname)
  const hasBrew =  await isIntallBrew();
  !hasBrew ? await execCmd('brew install clamav') : '';
  await execCmd('cp /opt/homebrew/etc/clamav/freshclam.conf.sample /opt/homebrew/etc/clamav/freshclam.conf');
  await execCmd('sed -ie \'s/^Example/#Example/g\' /opt/homebrew/etc/clamav/freshclam.conf');
  await execCmd('freshclam');
  await execCmd('cp /opt/homebrew/etc/clamav/clamd.conf.sample /opt/homebrew/etc/clamav/clamd.conf');
  await execCmd('sed -ie \'s/^Example/#Example/g\' /opt/homebrew/etc/clamav/clamd.conf');
  await execCmd('sed -ie \'s/^#LocalSocket/LocalSocket/g\' /opt/homebrew/etc/clamav/clamd.conf');
  console.log('END install clamav-------------');


  console.log('START install BleachBit--------------', __dirname)
  const exitsBleachBit = await isExitsBleachBit();
  if(!exitsBleachBit) {
    await execCmd('git clone https://github.com/bleachbit/bleachbit.git');
  }
  await execCmd('cd bleachbit');
  await execCmd('pipenv --python 3');
  await execCmd('pipenv install pycairo');
  await execCmd('pipenv install pygobject');

  console.log('END install BleachBit-------------');
}

async function execCmd(cmd) {
  const {stdout, stderr} = await exec(cmd);
  console.log(`RUN ${cmd} stdout:`, stdout);
  console.log(`RUN ${cmd} stderr:`, stderr);
}

async function isExitsBleachBit() {
  const {stdout, stderr} = await exec('if [ -d bleachbit ]; then echo \'Exists\'; else echo \'Not found\'; fi\n');
  return stdout.includes('Exists');
}

async function isIntallBrew() {
  const {stdout, stderr} = await exec('which brew');
  return !stdout.includes('not found');
}


async function scanClamav(event) {
  try {
    const totalFile = await exec('ls -1 -s /Users/hungnv/Desktop/ | wc -l ');
    const forked = fork('clamcan.js');
    forked.on('message', (msg) => {
      event.reply('scan-clamav-reply', msg);
    });
    forked.send(totalFile);
  } catch (error) {
    return error;
  }
}

async function cleanByBeachBit() {
  try {
    await execCmd('pipenv shell &');
    await execCmd('python3 /bleachbit/bleachbit.py -c --preset &');
  } catch (error) {
    return error
  }
}
