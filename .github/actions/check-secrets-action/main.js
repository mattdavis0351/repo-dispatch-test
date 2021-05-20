const core = require("@actions/core");
const github = require("@actions/github");
const gradeLearner = require("./lib/gradeLearner");

async function run() {
  try {
    const token = core.getInput("your-secret");
    const octokit = github.getOctokit("ksjaklfjaklsjfkldjsklajfkl");
    const { owner, repo } = github.context.repo;
    const results = await gradeLearner(octokit, owner, repo);
    // console.log(results);
    if (results.reports[0].level === "fatal") {
      throw results.reports.error;
    }
    const response = await octokit.rest.repos.createDispatchEvent({
      owner,
      repo,
      event_type: "grading",
      client_payload: results,
    });
    if (response.status !== 204) {
      throw `response status code was not 201\nreceieved code: ${response.status}`;
    }
  } catch (error) {
    core.setFailed(error);
  }
}

run();
