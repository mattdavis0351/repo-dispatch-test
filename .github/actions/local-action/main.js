const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
  try {
    const token = core.getInput("repo_token");
    const octokit = github.getOctokit(token);
    const ctx = github.context;

    const requestParams = {
      owner: ctx.repo.owner,
      repo: ctx.repo.repo,
      event_type: "oranges",
    };

    const res = await octokit.repos.createDispatchEvent(requestParams);
    if (res.status !== 204) {
      throw `response status code was not 204\ngot: ${res.status}`;
    }
    core.info("response is fine, check the other workflow");
    return;
  } catch (error) {
    core.setFailed(error);
  }
}

run();
