'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const reporters_1 = require('@jest/reporters');
class CustomCIReporter extends reporters_1.DefaultReporter {
  constructor(globalConfig) {
    super(globalConfig);
  }
  onTestResult(test, testResult, aggregatedResults) {
    this.testFinished(test.context.config, testResult, aggregatedResults);
    if (testResult.numFailingTests !== 0 || testResult.testExecError) {
      this.printTestFileHeader(testResult.testFilePath, test.context.config, testResult);
      this.printTestFileFailureMessage(testResult.testFilePath, test.context.config, testResult);
    }
    this.forceFlushBufferedOutput();
  }
}
module.exports = CustomCIReporter;
