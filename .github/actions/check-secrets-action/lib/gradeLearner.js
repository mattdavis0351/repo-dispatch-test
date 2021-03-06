const core = require("@actions/core");
const github = require("@actions/github");

module.exports = async (owner, repo, token) => {
  // if it has less than 1 secret... set the payload artifact to incorrect, no secret exists
  // return
  try {
    const secretsContext = core.getInput("secrets-context");
    const keysFromCtx = Object.keys(JSON.parse(secretsContext));

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

    const secretValueStatusCode = await properSecretValue(token, owner, repo);

    if (secretValueStatusCode !== 204) {
      return {
        reports: [
          {
            filename: ".github/workflows/use-secrets.yml",
            isCorrect: false,
            display_type: "actions",
            level: "warning",
            msg: "Solution COULD be incorrect",
            error: {
              expected: "HTTP response of 204",
              got: `HTTP response of ${secretValueStatusCode} which could indicate an internal error.  Please open an issue at: https://github.com/githubtraining/lab-use-secrets and let us know!  Thank you`,
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
    console.log(`thrown error prior to return\n${JSON.stringify(error)}`);
    console.log("returning error now to main");
    // if err.message is bad creds, then return with bad creds
    // else return with internal error
    return error;
  }
};

function repoHasExtraSecrets(keysFromCtx) {
  return keysFromCtx.length > 1;
}

async function properSecretValue(token, owner, repo) {
  try {
    const octokit = github.getOctokit(token);
    const response = await octokit.rest.repos.createDispatchEvent({
      owner,
      repo,
      event_type: "token_check",
    });
    // we don't get resp with bad token because createDisEvent throws error with bad creds
    return response.status;
  } catch (error) {
    console.log(error.message);
    if (
      error.message !== "Bad credentials" &&
      error.message !== "Parameter token or opts.auth is required"
    ) {
      throw {
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
    } else if (error.message === "Parameter token or opts.auth is required") {
      throw {
        reports: [
          {
            filename: ".github/workflows/use-secrets.yml",
            isCorrect: false,
            display_type: "actions",
            level: "fatal",
            msg: "Incorrect solution",
            error: {
              expected: "We expected your secret to contain a value",
              got: `A null value for the secret supplied at your-secret, which most likely means the secret doesn't exist.`,
            },
          },
        ],
      };
    } else {
      throw {
        reports: [
          {
            filename: ".github/workflows/use-secrets.yml",
            isCorrect: false,
            display_type: "actions",
            level: "fatal",
            msg: "Incorrect Solution",
            error: {
              expected:
                "Your secret to contain a Personal Access Token with the repo scope.",
              got: `${error.message}`,
            },
          },
        ],
      };
    }
  }
}
