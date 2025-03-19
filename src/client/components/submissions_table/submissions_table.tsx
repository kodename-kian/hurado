import classNames from "classnames";
import Link from "next/link";
import { memo, ReactNode, useEffect } from "react";
import { SubmissionSummaryDTO } from "common/types";
import { humanizeLanguage, humanizeVerdict, Verdict } from "common/types/constants";
import { uuidToHuradoID } from "common/utils/uuid";
import { humanizeTimeAgo } from "common/utils/dates";
import { getPath, Path } from "client/paths";
import { getVerdictColorClass } from "client/verdicts";
import { OverallVerdictDisplayDTO } from "common/types/verdicts";
import styles from "./submission_table.module.css";

type SubmissionTableProps = {
  loaded: boolean;
  submissions: SubmissionSummaryDTO[];
  loadSubmissions(): Promise<SubmissionSummaryDTO[]>;
  showUser: boolean;
};

export const SubmissionsTable = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- pre-existing error before eslint inclusion
  loaded,
  submissions,
  loadSubmissions,
  showUser,
}: SubmissionTableProps) => {
  useEffect(() => {
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pre-existing error before eslint inclusion
  }, []);

  return (
    <div className={classNames(styles.submissions, showUser && styles.showUser)}>
      <SubmissionHeader>#</SubmissionHeader>
      {showUser && <SubmissionHeader>Who</SubmissionHeader>}
      <SubmissionHeader>When</SubmissionHeader>
      <SubmissionHeader>Language</SubmissionHeader>
      <SubmissionHeader>Score</SubmissionHeader>
      {submissions.map((sub) => (
        <SubmissionRow key={sub.id} submission={sub} showUser={showUser} />
      ))}
    </div>
  );
};

type SubmissionRowProps = {
  submission: SubmissionSummaryDTO;
  showUser: boolean;
};

// eslint-disable-next-line react/display-name -- pre-existing error before eslint inclusion
const SubmissionRow = memo(({ submission, showUser }: SubmissionRowProps) => {
  const textVerdict =
    submission.verdict_id == null
      ? "In Queue"
      : submission.verdict == null
        ? "In Progress"
        : humanizeVerdict(submission.verdict, submission.score);

  return (
    <>
      <SubmissionCell className="whitespace-nowrap">
        <Link
          className="text-blue-400 hover:text-blue-500"
          href={getPath({ kind: Path.Submission, uuid: submission.id })}
        >
          {uuidToHuradoID(submission.id)}
        </Link>
      </SubmissionCell>
      {showUser && (
        <SubmissionCell className="whitespace-nowrap">{submission.username}</SubmissionCell>
      )}
      <SubmissionCell className="whitespace-nowrap">
        {humanizeTimeAgo(submission.created_at)}
      </SubmissionCell>
      <SubmissionCell>{humanizeLanguage(submission.language)}</SubmissionCell>
      <SubmissionCell
        className={classNames("whitespace-nowrap", getVerdictColorClass(submission.verdict))}
      >
        {textVerdict}
      </SubmissionCell>
    </>
  );
});

type SubmissionCellProps = {
  className?: string;
  children?: ReactNode;
};

// eslint-disable-next-line react/display-name -- pre-existing error before eslint inclusion
const SubmissionHeader = memo(({ className, children }: SubmissionCellProps) => {
  return (
    <div
      className={classNames(
        "font-mono font-medium text-xl text-center w-full px-4 py-3 bg-blue-400 text-white",
        className
      )}
    >
      {children}
    </div>
  );
});

// eslint-disable-next-line react/display-name -- pre-existing error before eslint inclusion
const SubmissionCell = memo(({ className, children }: SubmissionCellProps) => {
  return (
    <div
      className={classNames(
        "font-mono text-black text-center w-full px-4 py-3 border-b border-b-black",
        className
      )}
    >
      {children}
    </div>
  );
});

type OverallScoreProps = {
  overallVerdict: OverallVerdictDisplayDTO | undefined;
  className?: string;
};

// eslint-disable-next-line react/display-name -- pre-existing error before eslint inclusion
export const OverallScoreDisplay = memo(({ overallVerdict, className }: OverallScoreProps) => {
  if (overallVerdict == undefined) {
    return null;
  }
  const { score_overall, score_max } = overallVerdict;
  // purely for recycling style code
  let verdict;
  if (score_overall == 0) {
    verdict = Verdict.WrongAnswer;
  } else if (score_overall < score_max) {
    verdict = Verdict.Partial;
  } else {
    verdict = Verdict.Accepted;
  }
  return (
    <div
      className={classNames(
        "font-sans font-bold text-4xl mt-2 mb-4",
        getVerdictColorClass(verdict),
        className
      )}
    >
      {score_overall == 0 ? "" : `${score_overall}/${score_max}`}
    </div>
  );
});
