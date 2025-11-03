/**
 * Portfolio Performance Testing Script
 *
 * This script measures the performance improvements of the optimized portfolio page
 * Run with: node scripts/test-portfolio-performance.js
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');

// Test configuration
const TEST_ADDRESS = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'; // Example address
const BASE_URL = 'http://localhost:3000';
const RUNS_PER_TEST = 3;

// Performance metrics to track
const metrics = {
  original: [],
  optimized: [],
};

/**
 * Measure page load performance
 */
async function measurePageLoad(browser, url, label) {
  const results = [];

  for (let i = 0; i < RUNS_PER_TEST; i++) {
    const page = await browser.newPage();

    // Enable performance tracking
    await page.evaluateOnNewDocument(() => {
      window.performanceMarks = {};
    });

    // Start timing
    const startTime = Date.now();

    // Navigate and wait for network idle
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for content to be visible
    await page.waitForSelector('[data-testid="portfolio-header"]', {
      timeout: 10000,
    }).catch(() => {
      // Fallback selector if test ID not present
      return page.waitForSelector('.container-fluid', { timeout: 10000 });
    });

    const loadTime = Date.now() - startTime;

    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      };
    });

    // Get resource timing
    const resourceMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const apiCalls = resources.filter(r => r.name.includes('/api/') || r.name.includes('graphql'));
      return {
        totalResources: resources.length,
        apiCalls: apiCalls.length,
        totalResourceTime: resources.reduce((acc, r) => acc + r.duration, 0),
        apiCallTime: apiCalls.reduce((acc, r) => acc + r.duration, 0),
      };
    });

    results.push({
      run: i + 1,
      totalLoadTime: loadTime,
      ...performanceMetrics,
      ...resourceMetrics,
    });

    await page.close();

    // Wait between runs
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

/**
 * Calculate average metrics
 */
function calculateAverages(results) {
  const avg = {};
  const keys = Object.keys(results[0]).filter(k => k !== 'run');

  keys.forEach(key => {
    const values = results.map(r => r[key]);
    avg[key] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  });

  return avg;
}

/**
 * Print comparison results
 */
function printResults(original, optimized) {
  console.log('\n' + chalk.bold('='.repeat(50)));
  console.log(chalk.bold.cyan('Portfolio Page Performance Comparison'));
  console.log(chalk.bold('='.repeat(50)) + '\n');

  const originalAvg = calculateAverages(original);
  const optimizedAvg = calculateAverages(optimized);

  const metrics = [
    { name: 'Total Load Time', key: 'totalLoadTime', unit: 'ms' },
    { name: 'First Paint', key: 'firstPaint', unit: 'ms' },
    { name: 'First Contentful Paint', key: 'firstContentfulPaint', unit: 'ms' },
    { name: 'DOM Content Loaded', key: 'domContentLoaded', unit: 'ms' },
    { name: 'API Calls', key: 'apiCalls', unit: '' },
    { name: 'Total Resources', key: 'totalResources', unit: '' },
    { name: 'API Call Time', key: 'apiCallTime', unit: 'ms' },
  ];

  console.log(chalk.bold('Metric'.padEnd(25)) + chalk.bold('Original'.padEnd(15)) + chalk.bold('Optimized'.padEnd(15)) + chalk.bold('Improvement'));
  console.log('-'.repeat(70));

  metrics.forEach(({ name, key, unit }) => {
    const origValue = originalAvg[key];
    const optValue = optimizedAvg[key];
    const improvement = origValue > 0 ? ((origValue - optValue) / origValue * 100).toFixed(1) : 0;
    const improvementColor = improvement > 0 ? chalk.green : improvement < 0 ? chalk.red : chalk.yellow;

    console.log(
      name.padEnd(25) +
      `${origValue}${unit}`.padEnd(15) +
      `${optValue}${unit}`.padEnd(15) +
      improvementColor(`${improvement > 0 ? '-' : '+'}${Math.abs(improvement)}%`)
    );
  });

  console.log('\n' + chalk.bold('Summary:'));
  const overallImprovement = ((originalAvg.totalLoadTime - optimizedAvg.totalLoadTime) / originalAvg.totalLoadTime * 100).toFixed(1);

  if (overallImprovement > 0) {
    console.log(chalk.green.bold(`✓ Optimized version is ${overallImprovement}% faster!`));
  } else {
    console.log(chalk.red.bold(`✗ Optimized version is ${Math.abs(overallImprovement)}% slower`));
  }

  const apiReduction = ((originalAvg.apiCalls - optimizedAvg.apiCalls) / originalAvg.apiCalls * 100).toFixed(1);
  if (apiReduction > 0) {
    console.log(chalk.green(`✓ API calls reduced by ${apiReduction}%`));
  }

  console.log('\n' + chalk.bold('Raw Data:'));
  console.log(chalk.gray('Original runs:'), original);
  console.log(chalk.gray('Optimized runs:'), optimized);
}

/**
 * Main test runner
 */
async function runPerformanceTest() {
  console.log(chalk.bold.cyan('\n🚀 Portfolio Performance Testing\n'));
  console.log(`Testing address: ${TEST_ADDRESS}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Runs per test: ${RUNS_PER_TEST}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // Test original implementation
    console.log(chalk.yellow('Testing original implementation...'));
    const originalUrl = `${BASE_URL}/portfolio/${TEST_ADDRESS}?version=original`;
    metrics.original = await measurePageLoad(browser, originalUrl, 'Original');
    console.log(chalk.green('✓ Original implementation tested\n'));

    // Test optimized implementation
    console.log(chalk.yellow('Testing optimized implementation...'));
    const optimizedUrl = `${BASE_URL}/portfolio/${TEST_ADDRESS}`;
    metrics.optimized = await measurePageLoad(browser, optimizedUrl, 'Optimized');
    console.log(chalk.green('✓ Optimized implementation tested\n'));

    // Print results
    printResults(metrics.original, metrics.optimized);

  } catch (error) {
    console.error(chalk.red('Error during testing:'), error);
  } finally {
    await browser.close();
  }
}

// Check if required dependencies are installed
try {
  require.resolve('puppeteer');
  require.resolve('chalk');
} catch (e) {
  console.log(chalk.yellow('Installing required dependencies...'));
  require('child_process').execSync('yarn add -D puppeteer chalk', { stdio: 'inherit' });
}

// Run the test
runPerformanceTest().catch(console.error);