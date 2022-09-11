import { Component, NgZone, OnInit } from '@angular/core';
import { QuarantineComponent } from './pages/quarantine/quarantine.component';
import { BsModalService } from 'ngx-bootstrap/modal';
import { IpcRenderer } from 'electron';
import { HistoryScan, SessionService } from './session.service';
import * as moment from 'moment';

// declare var electron: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'nuah-tool';
  isDownloaded: boolean = false; // init = false
  isDisableActive: boolean = true;
  private _ipc: IpcRenderer | undefined;
  moment = moment;

  // Scan
  progressScan: number = 0;
  isAutoScan: boolean = false;
  isRealTimeDetection: boolean = true;
  isDisableScan: boolean = false;

  // Clean
  progressClean: number = 0;
  updatedAtScan = new Date();
  isDisableClean: boolean = false;

  constructor(private bsModalService: BsModalService,
              public sessionService: SessionService,
              private zone: NgZone) {
  }

  ngOnInit(): void {
    if (window.require) {
      try {
        this._ipc = window.require('electron').ipcRenderer;

        this.loadableInstallSoftware();

      } catch (e) {
        throw e;
      }
    } else {
      console.warn('Electron\'s IPC was not loaded');
    }
  }

  loadableInstallSoftware() {
    this._ipc?.send('set-loadable-software', 'set-loadable-software');
    this._ipc?.on('loadable-software-reply', (_event, arg) => {
      this.zone.run(()=>{
        this.isDisableActive = false;
      });
    })
  }

  initScheduleDefault() {
    this.updateScheduleScanSixHours();
    this.updateScheduleScanRealTime()
  }

  onClickActive() {
    this.isDownloaded = true;
    this.initScheduleDefault();
  }

  onScan() {
    this.isDisableScan = true;
    let progressBar = document.querySelector('.progress-scan') as any;
    this.progressScan = 1;
    progressBar.style.width = this.progressScan + "%";
    progressBar.innerText = this.progressScan + "%";
    this._ipc?.send('scan-clamav', 'scan-clamav');
    this._ipc?.on('scan-clamav-reply', (_event, arg) => {
      this.zone.run(()=>{
        // todo update data scan
        // const files = arg.split('\n').filter((it: string) => it !== '');
        const response = JSON.parse(arg);
        if(response.status === 'close') {
          const files = response.infectedFiles;
          const date = new Date();
          let history: HistoryScan[] = [];
          files.forEach((it: string) => {
            const fields = it.split(' ');
            const isAllow = this.sessionService.allowFiles.find(it2 => it2.name === fields[0]);
            const isScaned = this.sessionService.historyScan.find(it3 => it3.name === fields[0]);
            !isAllow ? history.push({
              name: fields[0],
              reason: fields[1],
              status: isScaned ? '' : 'NEW',
              updatedAt: date,
            }) : ''
          })
          this.sessionService.historyScan = history;
          this.sessionService.countNewFiles = this.sessionService.historyScan.filter(it4 => it4.status === 'NEW').length;
          console.log('RESPONSE SCAN', files);
          this.isDisableScan = false;
        }

        let bar = document.querySelector('.progress-scan') as any;
        this.progressScan = parseInt(`${response.process * 100}`);
        bar.style.width = this.progressScan + "%";
        bar.innerText = this.progressScan + "%";
      });
    })
  }

  onClean() {
    this.isDisableClean = true;
    this._ipc?.send('clean-system', 'clean-system');
    this._ipc?.on('clean-system-reply', (_event, arg) => {
      console.log('RESPONSE CLEAN 1', arg);
      this.zone.run(()=>{
        // todo update data clean
        this.sessionService.dateClean = new Date();
        console.log('RESPONSE CLEAN 2', arg);

      });
    })

    let bar = document.querySelector('.progress-clean') as any;
    let counter = 0
    let timmer = setInterval(() => {
      this.progressClean = parseInt(`${counter / 5 * 100}`);
      bar.style.width = this.progressClean + "%";
      bar.innerText = this.progressClean + "%";

      if(counter === 5) {
        this.isDisableClean = false;
        clearInterval(timmer);
      } else {
        counter++;
      }
    }, 200)
  }

  updateScheduleScanSixHours() {
    this._ipc?.send('schedule-six-hours', JSON.stringify({
      isScheduleSixHours: this.sessionService.isScheduleSixHours
    }));
  }

  updateScheduleScanRealTime() {
    this._ipc?.send('schedule-real-time', JSON.stringify({
      isScheduleRealTime: this.sessionService.isScheduleRealTime
    }));
  }

  showQuarantine() {
    const modalRef = this.bsModalService.show(QuarantineComponent, {
      class: 'modal-lg modal-dialog-centered',
      keyboard: true,
      ignoreBackdropClick: false
    });
    modalRef.onHide?.subscribe(data => {
      this.sessionService.countNewFiles = 0;
    })
    const data = {};
    modalRef.content?.onRevice(data);
  }

}
