"use client";

import { useState } from "react";
import type { Dictionary, FileId, Mode } from "@/content/types";
import { FILE_IDS, FILES, DOC_IDS, DOCS, SOURCES } from "@/lib/demo";
import { outcome } from "@/lib/playground";
import { TRANSCRIPTS } from "@/content/transcripts";
import { PRODUCT } from "@/lib/site";
import s from "../Experience.module.css";

export function OptionalDemo({
  t,
  lang,
}: {
  t: Dictionary;
  lang: "ko" | "en";
}) {
  const [file, setFile] = useState<FileId>("invoice");
  const [mode, setMode] = useState<Mode>("standard");
  const [applied, setApplied] = useState(false);
  const [notice, setNotice] = useState("");
  const result = outcome(file, applied, mode);
  const raw = TRANSCRIPTS.impact[file][mode];
  const ko = lang === "ko";
  const why = !applied
    ? "idle"
    : mode === "lite"
      ? "lite"
      : !result.cites.length
        ? "none"
        : mode;
  const ci = !applied
    ? t.playground.ci.idle
    : !result.checked
      ? t.playground.ci.off
      : result.result === "warning"
        ? t.playground.ci.warn.replace("{n}", String(result.flagged.length))
        : result.result === "fail"
          ? t.playground.ci.fail
          : t.playground.ci.pass;
  return (
    <div className={s.demo} data-demo data-file={file} data-applied={applied}>
      <p>{t.playground.disclaimer}</p>
      <div className={s.demoControls}>
        <label>
          {t.playground.fileLabel}
          <select
            value={file}
            onChange={(e) => {
              setFile(e.target.value as FileId);
              setApplied(false);
              setNotice(
                t.playground.switched.replace(
                  "{file}",
                  FILES[e.target.value as FileId].path,
                ),
              );
            }}
          >
            {FILE_IDS.map((id) => (
              <option key={id} value={id}>
                {FILES[id].path}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.playground.modeLabel}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
          >
            {(["lite", "standard", "strict"] as Mode[]).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          aria-pressed={applied}
          onClick={() => {
            setApplied(!applied);
            setNotice("");
          }}
        >
          {applied ? t.playground.undo : t.playground.apply}{" "}
          {applied ? "↶" : "↗"}
        </button>
      </div>
      <p className={s.demoNote}>{t.playground.resetNote}</p>
      <pre className={s.sourceExample}>
        <code>
          {applied ? SOURCES[file].after.trim() : SOURCES[file].before.trim()}
        </code>
      </pre>
      <div className={s.demoResult} data-result={result.result}>
        {DOC_IDS.map((id) => (
          <div
            key={id}
            data-doc={id}
            data-flagged={result.flagged.includes(id)}
          >
            <span>{result.flagged.includes(id) ? "↗" : "—"}</span>
            <b>{DOCS[id].name}</b>
            <span>
              {!applied
                ? t.cards.unchanged
                : !result.checked
                  ? t.cards.unchecked
                  : result.flagged.includes(id)
                    ? t.cards.flagged
                    : t.cards.unaffected}
            </span>
            <small>● verified</small>
          </div>
        ))}
      </div>
      <p role="status" aria-live="polite" aria-atomic="true">
        {notice}{" "}
        {applied
          ? `${result.result} · ${result.flagged.map((d) => DOCS[d].name).join(", ") || t.playground.result.none} · CI: ${ci}.`
          : t.playground.result.idle}
      </p>
      <p>{t.playground.why[why]}</p>
      {applied &&
        (mode === "lite" ? (
          <button
            type="button"
            className={s.textButton}
            onClick={() => setMode("standard")}
          >
            {t.playground.next.liteAction} →
          </button>
        ) : result.flagged.length ? (
          <a href={ko ? PRODUCT.readmeKo : PRODUCT.readmeEn}>
            {ko
              ? `${result.flagged.map((d) => DOCS[d].name).join(", ")} 재검토: CLI 안내 읽기`
              : `Re-review ${result.flagged.map((d) => DOCS[d].name).join(", ")}: read the CLI guide`}{" "}
            ↗
          </a>
        ) : (
          <button
            type="button"
            className={s.textButton}
            onClick={() => {
              setFile("invoice");
              setApplied(false);
              setNotice(
                t.playground.switched.replace("{file}", FILES.invoice.path),
              );
            }}
          >
            {ko ? "인용된 파일로 다시 시도" : "Try a cited source"} →
          </button>
        ))}
      <details key={`${file}-${mode}-${applied}`}>
        <summary>{t.playground.terminal}</summary>
        <p>
          {ko
            ? "실제 v1.42.0 캡처 · 이 파일 변경 적용 후의 출력"
            : "Captured from v1.42.0, after applying this file change"}
        </p>
        <pre>
          <code>
            $ {raw.cmd}
            {"\n"}
            {raw.lines.join("\n")}
            {"\n"}exit {raw.exit}
          </code>
        </pre>
      </details>
    </div>
  );
}
