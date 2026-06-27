"use client";

import { cn } from "@/lib/utils";
import type { BookBlock, BookPage } from "@/types/content-metadata";

import { isChapterStartPage } from "./chapter-utils";

interface BookPageViewProps {
  page: BookPage;
  assets: Record<string, string>;
  bookTitle?: string;
  coverUrl?: string;
  chapterNumber?: number | null;
  lineHeightClass?: string;
  className?: string;
}

function IllustrationBlock({
  block,
  url,
  hero,
}: {
  block: Extract<BookBlock, { type: "illustration" }>;
  url: string;
  hero?: boolean;
}) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-xl",
        hero || block.placement === "hero" ? "my-8" : "my-6",
      )}
    >
      <img src={url} alt={block.altText} className="w-full object-cover" />
      {block.caption && (
        <figcaption className="mt-2 text-center text-sm opacity-70">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

function TitlePage({
  page,
  bookTitle,
  coverUrl,
  assets,
}: {
  page: BookPage;
  bookTitle: string;
  coverUrl?: string;
  assets: Record<string, string>;
}) {
  const headingBlock = page.blocks.find((b) => b.type === "heading");
  const subtitle =
    headingBlock?.type === "heading" ? headingBlock.text : undefined;

  const heroBlock = page.blocks.find(
    (b) => b.type === "illustration" && b.placement === "hero",
  );
  const heroUrl =
    heroBlock?.type === "illustration"
      ? assets[heroBlock.assetId]
      : coverUrl;

  return (
    <div className="reader-title-page">
      {heroUrl && (
        <img
          src={heroUrl}
          alt=""
          className="reader-title-cover aspect-[3/4] object-cover"
        />
      )}
      <h1>{bookTitle}</h1>
      {subtitle && subtitle !== bookTitle && (
        <p className="reader-title-subtitle">{subtitle}</p>
      )}
    </div>
  );
}

function ChapterHeader({
  chapterNumber,
  title,
}: {
  chapterNumber: number;
  title: string;
}) {
  return (
    <header className="mb-8">
      <p className="reader-chapter-label">Chapter {chapterNumber}</p>
      <h2 className="reader-chapter-title">{title}</h2>
      <div className="reader-chapter-divider" aria-hidden />
    </header>
  );
}

export function BookPageView({
  page,
  assets,
  bookTitle,
  coverUrl,
  chapterNumber,
  lineHeightClass = "reader-leading-relaxed",
  className,
}: BookPageViewProps) {
  if (page.layout === "title" && bookTitle) {
    return (
      <article className={cn("reader-prose", lineHeightClass, className)}>
        <TitlePage
          page={page}
          bookTitle={bookTitle}
          coverUrl={coverUrl}
          assets={assets}
        />
      </article>
    );
  }

  const hasChapterHeader =
    isChapterStartPage(page) && chapterNumber != null;
  const headingBlock = page.blocks.find((b) => b.type === "heading");
  const headingText =
    headingBlock?.type === "heading" ? headingBlock.text : null;

  const heroFirst = page.layout === "text_with_hero";
  const heroBlock = page.blocks.find(
    (b) => b.type === "illustration" && b.placement === "hero",
  );
  const heroUrl =
    heroBlock?.type === "illustration" ? assets[heroBlock.assetId] : undefined;

  let dropCapUsed = false;

  const renderBlock = (block: BookBlock, index: number) => {
    if (block.type === "heading") {
      if (hasChapterHeader && headingText === block.text) {
        return null;
      }
      return (
        <h2
          key={`${page.pageNumber}-h-${index}`}
          className="reader-chapter-title mb-6"
        >
          {block.text}
        </h2>
      );
    }

    if (block.type === "paragraph") {
      const useDropCap =
        !dropCapUsed &&
        (hasChapterHeader ||
          (index === 0 && page.blocks[0]?.type === "paragraph"));
      if (useDropCap) dropCapUsed = true;

      return (
        <p
          key={`${page.pageNumber}-p-${index}`}
          className={cn(useDropCap && "reader-dropcap")}
        >
          {block.text}
        </p>
      );
    }

    if (heroFirst && block === heroBlock) {
      return null;
    }

    const url = assets[block.assetId];
    if (!url || block.status === "failed") return null;

    return (
      <IllustrationBlock
        key={block.slotId}
        block={block}
        url={url}
        hero={block.placement === "hero"}
      />
    );
  };

  return (
    <article className={cn("reader-prose", lineHeightClass, className)}>
      {heroFirst && heroUrl && heroBlock?.type === "illustration" && (
        <IllustrationBlock block={heroBlock} url={heroUrl} hero />
      )}

      {hasChapterHeader && headingText && chapterNumber != null && (
        <ChapterHeader chapterNumber={chapterNumber} title={headingText} />
      )}

      {page.blocks.map((block, index) => renderBlock(block, index))}
    </article>
  );
}
