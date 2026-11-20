import { ArticleList } from './articleList';
import { BasePage, ElementChain } from './basePage';

// /profile/:username and /profile/:username/favorites.
export class ProfilePage extends BasePage {
  constructor(private username = '') {
    super();
  }

  protected get path(): string {
    return `/profile/${this.username}`;
  }

  readonly articleList = new ArticleList();

  // Waits for the "My Posts" list so absence checks can't pass before it loads.
  open(username: string): this {
    this.username = username;
    cy.intercept({ method: 'GET', pathname: '/api/articles', query: { author: username } }).as(
      'getAuthorArticles'
    );
    this.visit();
    cy.wait('@getAuthorArticles').its('response.statusCode').should('eq', 200);
    return this;
  }

  get usernameHeading(): ElementChain {
    return cy.get('.user-info h4');
  }

  // Text is "Follow <username>" / "Unfollow <username>"; absent on your own profile.
  get followButton(): ElementChain {
    return cy.contains('.user-info button', /Follow|Unfollow/);
  }

  get myPostsTab(): ElementChain {
    return cy.contains('.articles-toggle a.nav-link', 'My Posts');
  }

  get favoritedPostsTab(): ElementChain {
    return cy.contains('.articles-toggle a.nav-link', 'Favorited Posts');
  }

  openFavoritedPosts(): this {
    cy.intercept({
      method: 'GET',
      pathname: '/api/articles',
      query: { favorited: this.username },
    }).as('getFavoritedArticles');
    this.favoritedPostsTab.click();
    this.favoritedPostsTab.should('have.class', 'active');
    cy.wait('@getFavoritedArticles').its('response.statusCode').should('eq', 200);
    return this;
  }
}
