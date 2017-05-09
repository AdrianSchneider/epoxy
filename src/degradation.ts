import * as express    from 'express';
import { Application } from 'express';

export interface DegradationStrategy {
  degradeBefore(req: express.Request, res: express.Response, next: Function): void;
  degradeAfter(req, res, data): Promise<any>;
}

/**
 * Strategy that will force requests to fail
 * x% percent of the time before hitting the backend
 * y% percent of the time after hitting the backend
 */
export class PercentFailedStrategy implements DegradationStrategy {

  private beforeDropRate: number;
  private afterDropRate: number;
  public constructor(beforeDropRate: number, afterDropRate: number) {
    this.beforeDropRate = beforeDropRate / 100;
    this.afterDropRate = afterDropRate / 100;
  }

  /**
   * Degrades traffic for an express server
   */
  public degradeBefore(req: express.Request, res: express.Response, next: Function) {
    if (this.checkRandomRate(this.beforeDropRate)) {
      return next(new Error('pre fail'));
    }

    return next();
  }

  public degradeAfter(req, res, data): Promise<any> {
    if (this.checkRandomRate(this.afterDropRate)) {
      return Promise.reject(new Error('post fail'));
    }

    return Promise.resolve(data);
  }

  private checkRandomRate(percent: number) {
    return percent >= Math.random();
  }
}

/**
 * Strategy that forces requests to fail n times before suceeding
 */
export class SucceedAfterAttemptsStrategy implements DegradationStrategy {
  private attempts: number;
  private counts: RequestCounts;

  public constructor(attempts: number) {
    this.attempts = attempts;
    this.counts = {};
  }

  public degradeBefore(req: express.Request, res: express.Response, next: Function) {
    this.increment(req);
    next();
  }

  private increment(req: express.Request): void {
    const key = this.hashRequest(req);
    if (typeof this.counts[key] === 'undefined') {
      this.counts[key] = 1;
    } else {
      this.counts[key]++;
    }
  }

  private getCount(req: express.Request): number {
    const key = this.hashRequest(req);
    return this.counts[key] || 0;
  }

  private resetCounter(req: express.Request): void {
    const key = this.hashRequest(req);
    this.counts[key] = 0;
  }

  public degradeAfter(req, res, data): Promise<any> {
    if (this.getCount(req) <= this.attempts) {
      return Promise.reject(new Error('fail'));
    }

    this.resetCounter(req);
    return Promise.resolve(data);
  }

  /**
   * Calculate a unique string key for a given request
   */
  private hashRequest(req: express.Request): string {
    return req.path + req.method;
  }
}

interface RequestCounts {
  [key: string]: number;
}
