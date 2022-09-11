import { Injectable } from '@angular/core';

export interface HistoryScan {
  name: string;
  reason: string;
  status: string;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  // Scan
  historyScan: HistoryScan[] = [];
  allowFiles: HistoryScan[] = [];
  countNewFiles: number = 0;
  isScheduleSixHours: boolean = true;
  isScheduleRealTime: boolean = false;

  // Clean
  dateClean: Date = new Date();

  constructor() {
  }

  onActive() {
    // execTest()
  }
}
