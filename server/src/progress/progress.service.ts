import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

interface ProgressState {
  percent: number;
  message: string;
  subject: Subject<{ data: { percent: number; message: string } }>;
}

@Injectable()
export class ProgressService {
  private store = new Map<string, ProgressState>();

  create(jobId: string) {
    const subject = new Subject<{ data: { percent: number; message: string } }>();
    this.store.set(jobId, { percent: 0, message: '시작 중...', subject });
    return subject.asObservable();
  }

  update(jobId: string, percent: number, message: string) {
    const state = this.store.get(jobId);
    if (!state) return;
    state.percent = percent;
    state.message = message;
    state.subject.next({ data: { percent, message } });
  }

  complete(jobId: string) {
    const state = this.store.get(jobId);
    if (state) {
      state.subject.complete();
      this.store.delete(jobId);
    }
  }

  error(jobId: string, message: string) {
    const state = this.store.get(jobId);
    if (state) {
      state.subject.error({ data: { percent: -1, message } });
      this.store.delete(jobId);
    }
  }
}
