const core = require("@actions/core");
const github = require("@actions/github");

module.exports = async (octokit, owner, repo) => {
  // if it has less than 1 secret... set the payload artifact to incorrect, no secret exists
  // return
  try {
    console.log("gradeLeaner Started");
    const secretsContext = core.getInput("secrets-context");
    const keysFromCtx = Object.keys(JSON.parse(secretsContext));

    console.log("calling repoHasExtraSecrets");
    if (!repoHasExtraSecrets(keysFromCtx)) {
      return {
        reports: [
          {
            filename: ".github/workflows/use-secrets.yml",
            isCorrect: false,
            display_type: "actions",
            level: "warning",
            msg: "Incorrect Solution",
            error: {
              expected: "Your repository should contain at least one secret.",
              got: "Your repository does not contain any secrets",
            },
          },
        ],
      };
    }

    // if the value is not the username... set the payload artifact to incorrect, wrong value
    // return00
    console.log("calling properSecretValue");
    const secretValue = await properSecretValue(octokit, owner, repo);
    console.log(`response from properSecretValue\n${secretValue}`);
    if (!secretValue) {
      return {
        reports: [
          {
            filename: ".github/workflows/use-secrets.yml",
            isCorrect: false,
            display_type: "actions",
            level: "warning",
            msg: "Incorrect Solution",
            error: {
              expected:
                "Your secret to contain a Personal Access Token with the repo scope.",
              got: "Invalid token value",
            },
          },
        ],
      };
    }

    // if all 3 things are right then set artifcat to success
    return {
      reports: [
        {
          filename: ".github/workflows/use-secrets.yml",
          isCorrect: true,
          display_type: "actions",
          level: "info",
          msg: "Correct Solution",
          error: {
            expected: "",
            got: "",
          },
        },
      ],
    };
  } catch (error) {
    console.log(`thrown error prior to return\n${error.message}`);
    // if err.message is bad creds, then return with bad creds
    // else return with internal error
    return {
      reports: [
        {
          filename: ".github/workflows/use-secrets.yml",
          isCorrect: false,
          display_type: "actions",
          level: "fatal",
          msg: "",
          error: {
            expected: "",
            got: "An internal error occurred.  Please open an issue at: https://github.com/githubtraining/lab-use-secrets and let us know!  Thank you",
          },
        },
      ],
    };
  }
};

function repoHasExtraSecrets(keysFromCtx) {
  return keysFromCtx.length > 1;
}

async function properSecretValue(octokit, owner, repo) {
  try {
    console.log("properSecretValue has started, calling dispatch");
    const response = await octokit.rest.repos.createDispatchEvent({
      owner,
      repo,
      event_type: "token_check",
    });
    console.log(response);
    return response.status === 204 ? true : false;
  } catch (error) {
    throw error;
  }
}
