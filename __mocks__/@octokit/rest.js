module.exports = {
  Octokit: jest.fn().mockImplementation(() => ({
    issues: {
      create: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      listForRepo: jest.fn(),
      createComment: jest.fn(),
      listComments: jest.fn(),
      addLabels: jest.fn(),
      removeLabel: jest.fn(),
    },
    search: {
      issuesAndPullRequests: jest.fn(),
    },
  }))
};