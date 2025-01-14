import { ReactNode } from "react";
import katex from "katex";
import { getParser } from "@unified-latex/unified-latex-util-parse";
import { UnreachableCheck } from "common/errors";
import {
  LatexArgument,
  LatexNode,
  LatexNodeDisplayMath,
  LatexNodeEnvironment,
  LatexNodeGroup,
  LatexNodeInlineMath,
  LatexNodeMacro,
  LatexNodeProps,
  LatexNodeRoot,
  LatexNodeVerbatim,
} from "./latex_types";
import { LATEX_ENVIRONMENTS, LATEX_MACROS } from "./latex_macros";
import { mergeLatexNodeStrings } from "./latex_strings";
import 'katex/dist/katex.css';
import { LatexBulletOrdered, latexEnvironmentList, LatexMacroBulletOrdered, LatexNodeList } from "./latex_list";
import { latexBrokenBlock, latexBrokenInline, latexPositionalString } from "./latex_utils";
import { LatexSyntaxHighlight } from "./latex_syntax_highlight";

const LatexParser = getParser({
  macros: LATEX_MACROS,
  environments: LATEX_ENVIRONMENTS,
});

type RenderLatexResult = { node: ReactNode } | { error: unknown };

export function renderLatex(source: string): RenderLatexResult {
  const parsed = LatexParser.parse(source) as unknown as LatexNode;
  try {
    const merged = mergeLatexNodeStrings(parsed);
    const node = <LatexNodeAnyX node={merged} source={source} />;
    return { node };
  } catch (e) {
    return { error: e };
  }
}

export function LatexNodeAnyX({ node, source }: LatexNodeProps<LatexNode>): React.ReactNode {
  switch (node.type) {
    case "whitespace":
      return " ";
    case "string":
      return node.content;
    case "inlinemath":
      return <LatexNodeInlineMathX node={node} source={source} />;
    case "displaymath":
      return <LatexNodeDisplayMathX node={node} source={source} />;
    case "parbreak":
      return <div className="block mb-3.5" />;
    case "macro":
      return <LatexNodeMacroX node={node} source={source} />;
    case "environment":
      return <LatexNodeEnvironmentX node={node} source={source} />;
    case "verbatim":
      return <LatexNodeVerbatimX node={node} source={source} />;
    case "group":
      return <LatexNodeGroupX node={node} source={source} />;
    case "comment":
      return null;
    case "root":
      return <LatexNodeGroupX node={node} source={source} />;
    default:
      UnreachableCheck(node);
      return null;
  }
}

function LatexNodeInlineMathX({ node, source }: LatexNodeProps<LatexNodeInlineMath>) {
  const start = node.position.start.offset;
  const end = node.position.end.offset;
  let subsource = source.substring(start, end);
  if (subsource.startsWith("$")) {
    subsource = subsource.substring(1, subsource.length - 1);
  } else if (subsource.startsWith("\\(")) {
    subsource = subsource.substring(2, subsource.length - 2);
  }
  try {
    const html = katex.renderToString(subsource, {
      displayMode: false,
    });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (e: any) {
    if ("message" in e) {
      return <span className="font-mono text-red-500">{e.message}</span>;
    } else {
      return latexBrokenBlock(node, source);
    }
  }
}

function LatexNodeDisplayMathX({ node, source }: LatexNodeProps<LatexNodeDisplayMath>) {
  const start = node.position.start.offset;
  const end = node.position.end.offset;
  let subsource = source.substring(start, end);
  if (subsource.startsWith("$$") || subsource.startsWith("\\[")) {
    subsource = subsource.substring(2, subsource.length - 2);
  }
  try {
    const html = katex.renderToString(subsource, {
      displayMode: true,
    });
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (e: any) {
    if ("message" in e) {
      return <div className="font-mono text-red-500">{e.message}</div>;
    } else {
      return latexBrokenBlock(node, source);
    }
  }
}

function LatexNodeMacroX({ node, source }: LatexNodeProps<LatexNodeMacro>): React.ReactNode {
  switch (node.content) {
    case "bf":
    case "textbf":
      return <strong>{renderArgumentContent(node.args, source)}</strong>;
    case "it":
    case "textit":
      return <span className="italic">{renderArgumentContent(node.args, source)}</span>;
    case "tt":
    case "texttt":
      return <span className="font-mono">{renderArgumentContent(node.args, source)}</span>;
    case "emph":
    case "underline":
      return <span className="underline">{renderArgumentContent(node.args, source)}</span>;
    case "sout":
      return <span className="line-through">{renderArgumentContent(node.args, source)}</span>;
    case "textsc":
      return <span className="uppercase">{renderArgumentContent(node.args, source)}</span>;
    case "tiny":
      return <span className="text-xs">{renderArgumentContent(node.args, source)}</span>;
    case "scriptsize":
      return <span className="text-xs">{renderArgumentContent(node.args, source)}</span>;
    case "small":
      return <span className="text-sm">{renderArgumentContent(node.args, source)}</span>;
    case "normalsize":
      return <span className="text-base">{renderArgumentContent(node.args, source)}</span>;
    case "large":
      return <span className="text-lg">{renderArgumentContent(node.args, source)}</span>;
    case "Large":
      return <span className="text-xl">{renderArgumentContent(node.args, source)}</span>;
    case "LARGE":
      return <span className="text-2xl">{renderArgumentContent(node.args, source)}</span>;
    case "huge":
      return <span className="text-3xl">{renderArgumentContent(node.args, source)}</span>;
    case "Huge":
      return <span className="text-4xl">{renderArgumentContent(node.args, source)}</span>;
    case "HUGE":
      return <span className="text-5xl">{renderArgumentContent(node.args, source)}</span>;
    case "url": {
      const href = latexPositionalString(node.args, 0);
      if (href == null) {
        return latexBrokenInline(node, source);
      }
      return (
        <a className="text-blue-500 hover:text-blue-400" target="_blank" href={href}>
          {href}
        </a>
      );
    }
    case "href": {
      const href = latexPositionalString(node.args, 0);
      if (href == null) {
        return latexBrokenInline(node, source);
      }
      return (
        <a className="text-blue-500 hover:text-blue-400" target="_blank" href={href}>
          {renderArgumentContent(node.args, source, 1)}
        </a>
      );
    }
    case "section": {
      const maybeStar = latexPositionalString(node.args, 0);
      if (maybeStar == '*') {
        return <h3 className="text-3xl font-bold">{renderArgumentContent(node.args, source, 1)}</h3>;
      } else if (maybeStar == null) {
        return <h3 className="text-3xl font-bold">1. {renderArgumentContent(node.args, source, 1)}</h3>;
      }
      return latexBrokenInline(node, source);
    }
    case "subsection": {
      const maybeStar = latexPositionalString(node.args, 0);
      if (maybeStar == '*') {
        return <h4 className="text-2xl font-bold">{renderArgumentContent(node.args, source, 1)}</h4>;
      } else if (maybeStar == null) {
        return <h4 className="text-2xl font-bold">1. {renderArgumentContent(node.args, source, 1)}</h4>;
      }
      return latexBrokenInline(node, source);
    }
    case "subsubsection": {
      const maybeStar = latexPositionalString(node.args, 0);
      if (maybeStar == '*') {
        return <h5 className="text-xl font-bold">{renderArgumentContent(node.args, source, 1)}</h5>;
      } else if (maybeStar == null) {
        return <h5 className="text-xl font-bold">1. {renderArgumentContent(node.args, source, 1)}</h5>;
      }
      return latexBrokenInline(node, source);
    }
    case "includegraphics": {
      // Don't use the second arg yet
      const src = latexPositionalString(node.args, 1);
      if (src == null) {
        return latexBrokenInline(node, source);
      }
      return <img className="max-w-full mx-auto" src={src} />;
    }
    case "$":
    case "%":
      return node.content;
    case "item":
      return null;
    case "arabic":
    case "alph":
    case "Alph":
    case "roman":
    case "Roman":
      return <LatexBulletOrdered node={node as LatexMacroBulletOrdered} />;
    default:
      // Functionally useless type assertion
      UnreachableCheck(node.content)
      return node.content;
  }
}

function LatexNodeEnvironmentX({ node, source }: LatexNodeProps<LatexNodeEnvironment>) {
  switch (node.env) {
    case "center":
      return <div className="text-center">{renderEnvironmentContent(node, source)}</div>;
    case "enumerate":
    case "itemize":
      return latexEnvironmentList(node as LatexNodeList, source);
    default:
      UnreachableCheck(node.env);
      return latexBrokenBlock(node, source);
  }
}

function LatexNodeVerbatimX({ node, source }: LatexNodeProps<LatexNodeVerbatim>) {
  switch (node.env) {
    case "verbatim": {
      const trimmed = node.content.replace(/^\s*\n/, "");
      return (
        <pre className="text-sm bg-gray-150 border border-gray-250 rounded-md p-2.5 [letter-spacing:0.001em]">{trimmed}</pre>
      );
    }
    case "lstlisting":
      return <LatexSyntaxHighlight node={node} source={source} />;
    default:
      UnreachableCheck(node.env);
      return latexBrokenBlock(node, source);
  }
}

function LatexNodeGroupX({ node, source }: LatexNodeProps<LatexNodeGroup | LatexNodeRoot>) {
  return node.content.map((child, idx) => <LatexNodeAnyX key={idx} node={child} source={source} />);
}

function renderEnvironmentContent(node: LatexNodeEnvironment, source: string): ReactNode {
  return node.content.map((child, idx) => <LatexNodeAnyX key={idx} node={child} source={source} />);
}

function renderArgumentContent(
  args: LatexArgument[] | undefined,
  source: string,
  index: number = 0
): ReactNode {
  if (args == null || args.length <= index) {
    return null;
  }
  return args[index].content.map((child, idx) => (
    <LatexNodeAnyX key={idx} node={child} source={source} />
  ));
}
