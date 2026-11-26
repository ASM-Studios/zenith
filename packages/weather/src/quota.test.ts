import { describe, expect, it } from 'vitest';
import { DEFAULT_BLOCK_SECONDS, createQuotaGuard } from './quota.ts';
import { weatherSetup } from './testing/weather-setup.ts';

function guardWith(dailyCallWarning?: number) {
  const setup = weatherSetup();
  const quota = createQuotaGuard(setup.cache, { logger: setup.logger, now: setup.clock.now, dailyCallWarning });
  return { ...setup, quota };
}

describe('quota guard', () => {
  it('reports a provider that was never blocked as open', async () => {
    const { quota } = guardWith();

    await expect(quota.blockedFor('stub')).resolves.toBeNull();
  });

  it('blocks a provider for the retry delay and counts it down', async () => {
    const { quota, clock } = guardWith();

    await quota.block('stub', 120);
    clock.advanceSeconds(20);

    await expect(quota.blockedFor('stub')).resolves.toBe(100);
  });

  it('opens the provider again once the delay has passed', async () => {
    const { quota, clock } = guardWith();

    await quota.block('stub', 30);
    clock.advanceSeconds(31);

    await expect(quota.blockedFor('stub')).resolves.toBeNull();
  });

  it('blocks for the default delay when the provider gave none', async () => {
    const { quota } = guardWith();

    await quota.block('stub', null);

    await expect(quota.blockedFor('stub')).resolves.toBe(DEFAULT_BLOCK_SECONDS);
  });

  it('blocks for at least one second', async () => {
    const { quota } = guardWith();

    await quota.block('stub', 0);

    await expect(quota.blockedFor('stub')).resolves.toBe(1);
  });

  it('keeps the block of one provider off the others', async () => {
    const { quota } = guardWith();

    await quota.block('stub', 60);

    await expect(quota.blockedFor('other')).resolves.toBeNull();
  });

  it('warns once when the daily call count reaches the threshold', async () => {
    const { quota, logger } = guardWith(3);

    await quota.recordCall('stub');
    await quota.recordCall('stub');
    await quota.recordCall('stub');
    await quota.recordCall('stub');
    await quota.recordCall('stub');

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      { providerId: 'stub', calls: 3 },
      'weather provider reached its daily call warning threshold',
    );
  });

  it('restarts the call count on the next day', async () => {
    const { quota, logger, clock } = guardWith(2);

    await quota.recordCall('stub');
    clock.advanceSeconds(24 * 60 * 60);
    await quota.recordCall('stub');

    expect(logger.warn).not.toHaveBeenCalled();
  });
});
