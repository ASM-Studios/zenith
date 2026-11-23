import { describe, expect, it } from 'vitest';
import { closingRefsFromText, issueRefsFromBranch, refsFromText, uniqueRefs } from './refs.mjs';

describe('issueRefsFromBranch', () => {
  it('reads the issue number of a branch named trigram, issue, description', () => {
    expect(issueRefsFromBranch('cma/#82/project-sync')).toEqual([82]);
    expect(issueRefsFromBranch('refs/heads/mbo/#15/redis')).toEqual([15]);
  });

  it('ignores branches without an issue number', () => {
    expect(issueRefsFromBranch('mbo/feat-env')).toEqual([]);
    expect(issueRefsFromBranch('dev')).toEqual([]);
  });
});

describe('refsFromText', () => {
  it('finds every issue or PR mention', () => {
    expect(refsFromText('Closes #76\n- See #80 and #82.')).toEqual([76, 80, 82]);
  });

  it('ignores URL fragments and words glued to a hash', () => {
    expect(refsFromText('https://github.com/a/b/pull/3#12 and abc#4')).toEqual([]);
  });

  it('handles an empty body', () => {
    expect(refsFromText(null)).toEqual([]);
  });
});

describe('closingRefsFromText', () => {
  it('finds the issues a closing keyword links, in any case and with an optional colon', () => {
    expect(closingRefsFromText('Closes #76\nfixes: #80, Resolved #82')).toEqual([76, 80, 82]);
  });

  it('ignores plain mentions and empty bodies', () => {
    expect(closingRefsFromText('Part of #19, see #20, prefix#21')).toEqual([]);
    expect(closingRefsFromText(null)).toEqual([]);
  });
});

describe('uniqueRefs', () => {
  it('merges lists without duplicates', () => {
    expect(uniqueRefs([82, 76], [76])).toEqual([82, 76]);
  });
});
