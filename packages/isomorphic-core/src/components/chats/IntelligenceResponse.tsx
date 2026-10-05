"use client";

import { BarChart3, CheckCircle2, FileText, ShieldCheck } from "lucide-react";

type ParsedBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

const normalizeLine = (line: string) => line.replace(/\r/g, "").trim();

const stripBold = (value: string) =>
  value.replace(/^\*\*(.*)\*\*$/, "$1").trim();

const isHeadingLine = (line: string) =>
  /^\*\*[^*].*[^*]\*\*$/.test(line.trim());

const isBulletLine = (line: string) => /^[-*]\s+/.test(line.trim());

const isOrderedLine = (line: string) => /^\d+\.\s+/.test(line.trim());

const isTableLine = (line: string) => {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("|") &&
    trimmed.endsWith("|") &&
    trimmed.split("|").length >= 4
  );
};

const isTableDivider = (line: string) =>
  /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());

const splitTableRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

function parseResponse(content: string): ParsedBlock[] {
  const lines = content.split("\n").map(normalizeLine);
  const blocks: ParsedBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line) {
      index += 1;
      continue;
    }

    if (isHeadingLine(line)) {
      blocks.push({ type: "heading", text: stripBold(line) });
      index += 1;
      continue;
    }

    if (isTableLine(line)) {
      const tableLines: string[] = [];
      while (index < lines.length && isTableLine(lines[index])) {
        tableLines.push(lines[index]);
        index += 1;
      }
      const rows = tableLines
        .filter((row) => !isTableDivider(row))
        .map(splitTableRow);
      if (rows.length) {
        blocks.push({ type: "table", headers: rows[0], rows: rows.slice(1) });
      }
      continue;
    }

    if (isBulletLine(line) || isOrderedLine(line)) {
      const ordered = isOrderedLine(line);
      const items: string[] = [];
      while (
        index < lines.length &&
        (ordered ? isOrderedLine(lines[index]) : isBulletLine(lines[index]))
      ) {
        items.push(
          lines[index].replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, "").trim(),
        );
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index] &&
      !isHeadingLine(lines[index]) &&
      !isTableLine(lines[index]) &&
      !isBulletLine(lines[index]) &&
      !isOrderedLine(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "paragraph", lines: paragraphLines });
  }

  return blocks;
}

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={`${part}-${index}`}
              className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] text-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong
              key={`${part}-${index}`}
              className="font-semibold text-slate-950 dark:text-white"
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

const parseKeyValue = (item: string) => {
  const cleaned = item.trim();
  const boldMatch = cleaned.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
  if (boldMatch)
    return { key: boldMatch[1].trim(), value: boldMatch[2].trim() };
  const normalMatch = cleaned.match(/^([^:]{2,80}):\s*(.+)$/);
  if (normalMatch)
    return { key: normalMatch[1].trim(), value: normalMatch[2].trim() };
  return null;
};

function SectionIcon({ title }: { title: string }) {
  const normalized = title.toLowerCase();
  if (normalized.includes("metric") || normalized.includes("aggregation"))
    return <BarChart3 className="h-4 w-4" />;
  if (normalized.includes("evidence") || normalized.includes("sandbox"))
    return <ShieldCheck className="h-4 w-4" />;
  if (normalized.includes("follow") || normalized.includes("next"))
    return <CheckCircle2 className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function MetricGrid({ items }: { items: string[] }) {
  const rows = items.map(parseKeyValue).filter(Boolean) as Array<{
    key: string;
    value: string;
  }>;
  if (!rows.length) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div
          key={`${row.key}:${row.value}`}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {row.key}
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
            <InlineText text={row.value} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ResponseTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-900/70 dark:text-slate-400">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-3 py-2 font-semibold"
                >
                  <InlineText text={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950/30">
            {rows.map((row, rowIndex) => (
              <tr key={`${rowIndex}-${row.join("|")}`}>
                {headers.map((_, cellIndex) => (
                  <td
                    key={`${rowIndex}-${cellIndex}`}
                    className="whitespace-nowrap px-3 py-2 text-slate-700 dark:text-slate-200"
                  >
                    <InlineText text={row[cellIndex] || ""} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResponseList({
  ordered,
  items,
  sectionTitle,
}: {
  ordered: boolean;
  items: string[];
  sectionTitle?: string;
}) {
  const normalizedTitle = String(sectionTitle || "").toLowerCase();
  const allKeyValues =
    items.length > 0 && items.every((item) => parseKeyValue(item));
  if (
    allKeyValues &&
    (normalizedTitle.includes("metric") ||
      normalizedTitle.includes("evidence") ||
      normalizedTitle.includes("key") ||
      normalizedTitle.includes("summary"))
  ) {
    return <MetricGrid items={items} />;
  }

  const ListTag = ordered ? "ol" : "ul";
  return (
    <ListTag
      className={
        ordered ? "space-y-2 pl-5 list-decimal" : "space-y-2 pl-5 list-disc"
      }
    >
      {items.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="pl-1 text-sm leading-6 text-slate-700 dark:text-slate-200"
        >
          <InlineText text={item} />
        </li>
      ))}
    </ListTag>
  );
}

export default function IntelligenceResponse({ content }: { content: string }) {
  const blocks = parseResponse(content);
  let currentSection = "";

  if (!content.trim()) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
        Thinking...
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          currentSection = block.text;
          const isTitle = index === 0;
          return (
            <div
              key={`${block.text}-${index}`}
              className={isTitle ? "pb-1" : "pt-2"}
            >
              <div className="flex items-center gap-2">
                {!isTitle && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <SectionIcon title={block.text} />
                  </span>
                )}
                <h3
                  className={
                    isTitle
                      ? "text-lg font-semibold tracking-tight text-slate-950 dark:text-white"
                      : "text-sm font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300"
                  }
                >
                  {block.text}
                </h3>
              </div>
            </div>
          );
        }

        if (block.type === "table") {
          return (
            <ResponseTable
              key={`table-${index}`}
              headers={block.headers}
              rows={block.rows}
            />
          );
        }

        if (block.type === "list") {
          return (
            <ResponseList
              key={`list-${index}`}
              ordered={block.ordered}
              items={block.items}
              sectionTitle={currentSection}
            />
          );
        }

        return (
          <div key={`paragraph-${index}`} className="space-y-2">
            {block.lines.map((line, lineIndex) => (
              <p
                key={`${line}-${lineIndex}`}
                className="text-sm leading-6 text-slate-700 dark:text-slate-200"
              >
                <InlineText text={line} />
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}
