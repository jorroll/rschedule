import { DefaultReporter } from '@jest/reporters';
import { AggregatedResult, TestResult } from '@jest/test-result';
import { Test } from 'jest-runner';

/**
 * This is the reporter for Gitlab CI.
 *
 * This reporter only prints failed tests to the console.
 * This is necessary because the test suits standard output is often too large
 * for Gitlab.
 */

// Need to manually change exports in generated output to
// `module.exports = CustomCIReporter;`
export default class CustomCIReporter extends DefaultReporter {
  constructor(globalConfig: any) {
    super(globalConfig);
  }

  onTestResult(test: Test, testResult: TestResult, aggregatedResults: AggregatedResult) {
    this.testFinished(test.context.config, testResult, aggregatedResults);

    // we only want to show failing tests
    if (testResult.numFailingTests !== 0 || testResult.testExecError) {
      this.printTestFileHeader(testResult.testFilePath, test.context.config, testResult);
      this.printTestFileFailureMessage(testResult.testFilePath, test.context.config, testResult);
    }

    this.forceFlushBufferedOutput();
  }
}
