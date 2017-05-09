import * as commander from 'commander';
import Server from './server';
import * as degradation from './degradation';

export default class Main {

  private process: NodeJS.Process;
  private options: ProgramOptions;

  public constructor(process: NodeJS.Process) {
    this.process = process;
    this.options = this.configure();
  }

  private configure(): ProgramOptions {
    const program = commander;
    program
      .version('0.0.1')
      .option('-p --proxy-url [url]', 'Proxy URL')
      .option('-s --strategy [name]', 'Strategy')
      .option('-b --percent-before [number]', 'Percent failed before')
      .option('-a --percent-after [number]', 'Percent failed after')
      .option('-t --attempts [count]', 'Succeed after attempts')
      .parse(this.process.argv);

    if (!program.proxy || !program.strategy) {
      program.outputHelp();
      process.exit(1);
    }

    return {
      proxy: program.proxyUrl,
      port: process.env.PORT || 3000,
      strategy: program.strategy || 'percent',
      attempts: parseInt(program.attempts, 10) || 0,
      percentBefore: parseInt(program.percentBefore, 10) || 0,
      percentAfter: parseInt(program.percentAfter, 10) || 0,
    };
  }

  public start() {
    const server = new Server(
      this.options.proxy,
      this.getStrategy()
    );

    server.start(this.options.port);
    console.log(`Listening on port ${this.options.port}`);
    console.log(`Forwarding traffic to ${this.options.proxy}`);
  }

  private getStrategy(): degradation.DegradationStrategy {
    if (this.options.strategy === 'percent') {
      return new degradation.PercentFailedStrategy(
        this.options.percentBefore,
        this.options.percentAfter
      );
    }

    if (this.options.strategy === 'attempts') {
      return new degradation.SucceedAfterAttemptsStrategy(
        this.options.attempts
      );
    }
  }
}

interface ProgramOptions {
  port: number;
  proxy: string;
  strategy: string;
  percentBefore?: number;
  percentAfter?: number;
  attempts?: number;
}
