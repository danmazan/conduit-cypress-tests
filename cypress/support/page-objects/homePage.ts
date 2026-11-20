import { ArticleList } from './articleList';
import { BasePage, ElementChain } from './basePage';

// / (Global Feed, or Your Feed when logged in) and /tag/:tag.
export class HomePage extends BasePage {
  private tag = '';

  protected get path(): string {
    return this.tag ? `/tag/${this.tag}` : '/';
  }

  readonly articleList = new ArticleList();

  get yourFeedTab(): ElementChain {
    return cy.contains('.feed-toggle a.nav-link', 'Your Feed');
  }

  get globalFeedTab(): ElementChain {
    return cy.contains('.feed-toggle a.nav-link', 'Global Feed');
  }

  // Loads the home page fresh and waits for the feed request, so list assertions
  // (especially absence checks) run against the loaded personalized feed.
  openYourFeed(): this {
    this.visit();
    cy.intercept({ method: 'GET', pathname: '/api/articles/feed' }).as('getFeed');
    this.yourFeedTab.click();
    this.yourFeedTab.should('have.class', 'active');
    cy.wait('@getFeed').its('response.statusCode').should('eq', 200);
    return this;
  }

  openGlobalFeed(): this {
    this.globalFeedTab.click();
    this.globalFeedTab.should('have.class', 'active');
    return this;
  }

  // Articles filtered by tag. randomArticle() gives every article a unique tag,
  // so this list only holds the test's own article — unlike the Global Feed,
  // whose first page depends on what every other demo user has published.
  openTag(tag: string): this {
    this.tag = tag;
    cy.intercept({ method: 'GET', pathname: '/api/articles', query: { tag } }).as('getTagArticles');
    this.visit();
    cy.wait('@getTagArticles').its('response.statusCode').should('eq', 200);
    this.tag = '';
    return this;
  }
}
