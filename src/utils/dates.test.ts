import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatHumanDate,
  formatHumanDateShort,
  formatHumanDateRange,
  formatExpiryStatus,
  formatDueStatus,
} from './dates';

describe('human date utilities', () => {
  it('formats full and short human dates', () => {
    assert.equal(formatHumanDate('2026-11-04'), '4 Nov 2026');
    assert.equal(formatHumanDate('2027-01-30'), '30 Jan 2027');
    assert.equal(formatHumanDateShort('2026-11-16'), '16 Nov');
  });

  it('formats date ranges cleanly without repeating months unnecessarily', () => {
    assert.equal(formatHumanDateRange('2026-11-04', '2026-11-12'), '4 to 12 Nov');
    assert.equal(formatHumanDateRange('2026-10-30', '2026-11-03'), '30 Oct to 3 Nov');
    assert.equal(
      formatHumanDateRange('2026-12-28', '2027-01-03'),
      '28 Dec 2026 to 3 Jan 2027'
    );
    assert.equal(formatHumanDateRange('2026-11-04', '2026-11-04'), '4 Nov');
  });

  it('computes expiry and overdue statuses accurately', () => {
    const expired = formatExpiryStatus('2026-03-12', '2026-11-16');
    assert.equal(expired.level, 'problem');
    assert.equal(expired.text, 'Expired 12 Mar 2026');

    const soon = formatExpiryStatus('2026-11-20', '2026-11-16');
    assert.equal(soon.level, 'attention');
    assert.equal(soon.text, 'Expires in 4 days');

    const valid = formatExpiryStatus('2027-01-30', '2026-11-16');
    assert.equal(valid.level, 'ok');
    assert.equal(valid.text, 'Valid to 30 Jan 2027');

    const lateTask = formatDueStatus('2026-11-14', '2026-11-16');
    assert.equal(lateTask.isLate, true);
    assert.equal(lateTask.text, 'Due 14 Nov, 2 days late');
  });
});
