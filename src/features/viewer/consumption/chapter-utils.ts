import type { BookPage } from "@/types/content-metadata";

export function isChapterStartPage(page: BookPage): boolean {
  if (page.layout === "title") return false;
  const first = page.blocks[0];
  return first?.type === "heading";
}

export function resolveChapterNumber(
  pages: BookPage[],
  currentPageNumber: number,
): number | null {
  if (pages.find((p) => p.pageNumber === currentPageNumber)?.layout === "title") {
    return null;
  }

  let chapter = 0;
  for (const page of pages) {
    if (page.pageNumber > currentPageNumber) break;
    if (isChapterStartPage(page)) {
      chapter += 1;
    }
  }

  return chapter > 0 ? chapter : null;
}
