import { Component, EventEmitter, OnInit } from '@angular/core';
import { HistoryScan, SessionService } from '../../session.service';
import { IpcRenderer } from 'electron';
import { NgZone } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-quarantine',
  templateUrl: './quarantine.component.html',
  styleUrls: ['./quarantine.component.scss']
})
export class QuarantineComponent implements OnInit {

  private _ipc: IpcRenderer | undefined;

  moment = moment;

  onRevice = (data: any) => {
  }
  constructor(public sessionService: SessionService,
              private zone: NgZone) { }

  ngOnInit(): void {
    if (window.require) {
      try {
        this._ipc = window.require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    } else {
      console.warn('Electron\'s IPC was not loaded');
    }
  }

  allowFile(item: HistoryScan) {
    this.sessionService.allowFiles.push(item);
    this.sessionService.historyScan.splice(this.sessionService.historyScan.indexOf(item), 1)
  }

  burnFile(item: HistoryScan) {
    this._ipc?.send('burn-file', JSON.stringify(item));
    this._ipc?.on('burn-file-reply', (_event, arg) => {
      this.zone.run(()=>{
        // todo update data scan
        console.log('RESPONSE BURN');
      });
    })
  }

  cancel() {
  }
}
