import path from "path";
import ChildProcess from "child_process";
import { JudgeChecker, JudgeScript } from "common/types/judge";
import { CheckerKind, Verdict } from "common/types/constants";
import { UnreachableError } from "common/errors";
import { FORWARD_CHILD_STDERR } from "server/secrets";
import { ISOLATE_BIN, IsolateInstance, IsolateUtils, runChildProcess } from "./judge_utils";
import { LANGUAGE_SPECS } from "./judge_compile";
import { CheckerResult } from "./types";
import {
  LIMITS_JUDGE_MEMORY_LIMIT_BYTE,
  LIMITS_JUDGE_TIME_LIMIT_MS,
  MemoryLimitKilobytes,
  TimeLimitSeconds,
  WallTimeLimitSeconds,
} from "./judge_constants";

export async function checkSubmissionOutput(opts: {
  checker: JudgeChecker;
  task_root: string;
  input_file_name: string;
  judge_file_name: string;
  output_root: string;
  output_file_name: string;
}): Promise<CheckerResult> {
  const { checker } = opts;
  if (checker.kind === CheckerKind.Custom) {
    return runCustomChecker({
      ...opts,
      checker: checker.script,
    });
  }

  const judgePath = path.join(opts.task_root, opts.judge_file_name);
  const outputPath = path.join(opts.output_root, opts.output_file_name);
  switch (checker.kind) {
    case CheckerKind.LenientDiff: {
      const diffStatus = await runChildProcess(["diff", "-q", "-b", "-B", judgePath, outputPath]);
      if (diffStatus == 0) {
        return {
          verdict: Verdict.Accepted,
          score_raw: 1,
        };
      } else {
        return {
          verdict: Verdict.WrongAnswer,
          score_raw: 0,
        };
      }
    }
    default:
      throw new UnreachableError(checker);
  }
}

async function runCustomChecker(opts: {
  checker: JudgeScript;
  task_root: string;
  input_file_name: string;
  judge_file_name: string;
  output_root: string;
  output_file_name: string;
}): Promise<CheckerResult> {
  return IsolateUtils.with(async (isolate) => {
    const argv = makeCheckerArgv({
      ...opts,
      isolate,
    });
    const pCheckerOut = new Promise<CheckerResult>((resolve) => {
      const chunks: string[] = [];
      const child = ChildProcess.spawn(ISOLATE_BIN, argv, {
        stdio: ["ignore", "pipe", FORWARD_CHILD_STDERR ? process.stderr : "ignore"],
      });

      child.stdout.on("data", (chunk: string) => {
        chunks.push(chunk);
      });

      child.on("close", async () => {
        try {
          // Need this await so the catch block can catch exceptions
          const result = await IsolateUtils.readResult(isolate);
          if (result.verdict === Verdict.Accepted) {
            const combined = chunks.join("");
            const parsed = parseCheckerOutput(combined);
            resolve(parsed);
          } else {
            resolve({
              verdict: Verdict.JudgeFailed,
              score_raw: 0,
            });
          }
        } catch (e) {
          console.error("Failed to parse isolate result", e);
          resolve({
            verdict: Verdict.JudgeFailed,
            score_raw: 0,
          });
        }
      });
    });
    return pCheckerOut;
  });
}

function makeCheckerArgv(opts: {
  checker: JudgeScript;
  isolate: IsolateInstance;
  task_root: string;
  input_file_name: string;
  judge_file_name: string;
  output_root: string;
  output_file_name: string;
}): string[] {
  const {
    checker,
    isolate,
    task_root,
    input_file_name,
    judge_file_name,
    output_root,
    output_file_name,
  } = opts;

  const spec = LANGUAGE_SPECS[checker.language];
  const timeLimit = TimeLimitSeconds(LIMITS_JUDGE_TIME_LIMIT_MS);
  const wallTimeLimit = WallTimeLimitSeconds(LIMITS_JUDGE_TIME_LIMIT_MS);
  const memLimit = MemoryLimitKilobytes(
    LIMITS_JUDGE_MEMORY_LIMIT_BYTE + spec.runtimeBonusMemoryByte
  );
  const procLimit = spec.runtimeProcessLimit ?? 1;

  const argv: string[] = [
    `--box-id=${isolate.name}`,
    "--dir=/opt/lang=/opt/lang",
    `--dir=/task=${task_root}`,
    `--dir=/output=${output_root}`,
    "--chdir=/task",
    `--meta=${isolate.meta}`,
    `--time=${timeLimit}`,
    `--wall-time=${wallTimeLimit}`,
    `--mem=${memLimit}`,
    `--processes=${procLimit}`,
    "--run",
    "--",
  ];

  if (checker.exe_name != null) {
    if (spec.getInterpreterCommand == null) {
      argv.push(`/task/${checker.exe_name}`);
    } else {
      argv.push(
        ...spec.getInterpreterCommand(
          checker.exe_name,
          LIMITS_JUDGE_TIME_LIMIT_MS,
          LIMITS_JUDGE_MEMORY_LIMIT_BYTE
        )
      );
    }
  } else {
    throw new Error("Missing communicator exe_name");
  }

  const inputPath = path.join("/task", input_file_name);
  const judgePath = path.join("/task", judge_file_name);
  const outputPath = path.join("/output", output_file_name);

  argv.push(inputPath);
  argv.push(judgePath);
  argv.push(outputPath);

  return argv;
}

function parseCheckerOutput(output: string): CheckerResult {
  const split = output.split("\n");
  // We only care about the raw score, from the first line
  // Consistent with CMS
  const line2 = split[0];

  const score = parseScore(line2);
  if (score == 1) {
    return {
      verdict: Verdict.Accepted,
      score_raw: 1,
    };
  } else if (score == 0) {
    return {
      verdict: Verdict.WrongAnswer,
      score_raw: 0,
    };
  } else {
    return {
      verdict: Verdict.Partial,
      score_raw: score,
    };
  }
}

function parseScore(line: string): number {
  if (isNaN(+line)) {
    return 0;
  }
  return Math.max(0, Math.min(1, +line));
}
