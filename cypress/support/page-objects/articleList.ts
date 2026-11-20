import type { ElementChain } from './basePage';

// Article preview list shared by HomePage (feeds) and ProfilePage (tabs).
// Not a page itself — composed into those pages as `articleList`.
export class ArticleList {
  get previews(): ElementChain {
    return cy.get('app-article-preview');
  }

  get emptyMessage(): ElementChain {
    return cy.contains('.article-preview', 'No articles are here... yet.');
  }

  // Empty state of the personalized "Your Feed" tab. It differs from
  // `emptyMessage`: "Your feed is empty. Follow some users to see their articles here...".
  get emptyFeedMessage(): ElementChain {
    return cy.contains<HTMLElement>('Your feed is empty');
  }

  previewByTitle(title: string): ElementChain {
    return cy.contains('app-article-preview', title);
  }

  // Heart button in a preview; its text is the favorites count.
  favoriteButtonFor(title: string): ElementChain {
    return this.previewByTitle(title).find('app-favorite-button button');
  }

  assertFavoriteCount(title: string, count: number): void {
    this.favoriteButtonFor(title)
      .invoke('text')
      .should('match', new RegExp(`^\\s*${count}\\s*$`));
  }

  assertContains(title: string): void {
    this.previewByTitle(title).should('be.visible');
  }

  // Callers must have waited for the list request (the page objects' open* methods
  // do). The render guard below additionally covers Angular's render after the
  // response; both empty states (profile tabs and Your Feed) carry .empty-feed-message.
  assertNotContains(title: string): void {
    cy.get('app-article-preview, .empty-feed-message').should('exist');
    cy.contains('app-article-preview', title).should('not.exist');
  }

  openArticle(title: string): void {
    this.previewByTitle(title).find('a.preview-link').click();
  }
}
