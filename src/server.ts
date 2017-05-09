import * as express            from 'express';
import * as proxy              from 'express-http-proxy';
import { DegradationStrategy } from './degradation';

export default class EpoxyServer {

  private server: express.Application;
  private proxyUrl: string;
  private strategy: DegradationStrategy;

  public constructor(proxyUrl, strategy: DegradationStrategy) {
    this.server = express();
    this.strategy = strategy;
    this.proxyUrl = proxyUrl;
  }

  /**
   * Starts the server on the passed in port
   */
  public start(port: number) {
    this.server.use(this.strategy.degradeBefore.bind(this.strategy));

    this.server.use((req, res, next) => {
      proxy(this.proxyUrl, {
        userResDecorator: (proxyRes, proxyResData) => {
          return this.strategy.degradeAfter.bind(this.strategy)(req, proxyRes, proxyResData);
        }
      })(req, res, next);
    });

    this.server.listen(port);
  }

}
