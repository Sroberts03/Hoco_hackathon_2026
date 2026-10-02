"use client";

import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { Avatar } from "@/components/avatar";
import { deleteMessage } from "../server/actions";
import type { Participant, ThreadMessage } from "../lib/types";

/** Messages closer together than this, from the same sender, share one timestamp. */
const GROUP_GAP_MS = 5 * 60 * 1000;

/**
 * The scrolling message history. Groups consecutive messages, adds day
 * separators, and keeps the newest message in view.
 */
export function MessageList({ messages, other }: { messages: ThreadMessage[]; other: Participant }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Times render in UTC on the server and during hydration (so both match),
  // then switch to the viewer's own time zone.
  const timeZone = useIsClient() ? undefined : "UTC";

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted">
        No messages yet. Say hello to {other.name.split(" ")[0]}.
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
      <ol>
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const newDay = !prev || dayKey(prev.createdAt, timeZone) !== dayKey(m.createdAt, timeZone);
          const startsGroup = newDay || !sameGroup(prev, m);
          const endsGroup = !next || dayKey(next.createdAt, timeZone) !== dayKey(m.createdAt, timeZone) || !sameGroup(m, next);

          return (
            <li key={m.id}>
              {newDay ? (
                <div className="my-4 flex items-center gap-3 text-xs font-medium text-muted first:mt-0" role="separator">
                  <span className="h-px flex-1 bg-line" />
                  {dayLabel(m.createdAt, timeZone)}
                  <span className="h-px flex-1 bg-line" />
                </div>
              ) : null}

              <div className={`group flex items-end gap-2 ${m.fromMe ? "justify-end" : "justify-start"} ${startsGroup && !newDay ? "mt-4" : "mt-0.5"}`}>
                {!m.fromMe ? (
                  <span className="w-8 shrink-0">{endsGroup ? <Avatar name={other.name} src={other.avatarUrl} size="sm" /> : null}</span>
                ) : null}

                {m.fromMe && m.body !== null ? (
                  <form action={deleteMessage.bind(null, m.id)} className="self-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button type="submit" className="rounded px-1.5 py-0.5 text-xs text-muted hover:bg-danger-soft hover:text-danger">
                      Delete
                    </button>
                  </form>
                ) : null}

                <div className={`flex max-w-[80%] flex-col sm:max-w-[65%] ${m.fromMe ? "items-end" : "items-start"}`}>
                  <div
                    title={fullTime(m.createdAt, timeZone)}
                    className={`px-3.5 py-2 text-[15px] leading-relaxed ${bubbleShape(m.fromMe, startsGroup, endsGroup)} ${
                      m.body === null
                        ? "border border-dashed border-line italic text-muted"
                        : m.fromMe
                          ? "bg-accent text-accent-ink"
                          : "bg-surface-2 text-ink"
                    }`}
                  >
                    <p className="whitespace-pre-line break-words">{m.body ?? "Message deleted"}</p>
                  </div>
                  {endsGroup ? (
                    <time dateTime={m.createdAt} className="mt-1 px-1 text-[11px] text-muted">
                      {clockTime(m.createdAt, timeZone)}
                    </time>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function sameGroup(a: ThreadMessage, b: ThreadMessage): boolean {
  return a.fromMe === b.fromMe && Date.parse(b.createdAt) - Date.parse(a.createdAt) < GROUP_GAP_MS;
}

/** Rounded bubbles, with the corners between grouped messages tucked in on the sender's side. */
function bubbleShape(fromMe: boolean, starts: boolean, ends: boolean): string {
  const side = fromMe ? ["rounded-tr-md", "rounded-br-md"] : ["rounded-tl-md", "rounded-bl-md"];
  return ["rounded-2xl", starts ? "" : side[0], ends ? "" : side[1]].join(" ");
}

const subscribe = () => () => {};
function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

function dayKey(iso: string, timeZone?: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone });
}

function dayLabel(iso: string, timeZone?: string): string {
  const key = dayKey(iso, timeZone);
  const now = Date.now();
  if (key === dayKey(new Date(now).toISOString(), timeZone)) return "Today";
  if (key === dayKey(new Date(now - 86_400_000).toISOString(), timeZone)) return "Yesterday";
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: sameYear ? undefined : "numeric", timeZone });
}

function clockTime(iso: string, timeZone?: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone });
}

function fullTime(iso: string, timeZone?: string): string {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone });
}
