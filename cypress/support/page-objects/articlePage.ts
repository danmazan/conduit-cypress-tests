import { BasePage, ElementChain } from './basePage';

// /article/:slug. The article meta block (author, follow/favorite or edit/delete
// buttons) is rendered twice — in the banner and under the body — so actions are
// scoped to the banner copy.
export class ArticlePage extends BasePage {
  constructor(private slug = '') {
    super();
  }

  protected get path(): string {
    return `/article/${this.slug}`;
  }

  open(slug: string): this {
    this.slug = slug;
    return this.visit();
  }

  // --- Article content ---

  get banner(): ElementChain {
    return cy.get('.article-page .banner');
  }

  get title(): ElementChain {
    return this.banner.find<HTMLElement>('h1');
  }

  get authorLink(): ElementChain {
    return this.banner.find('a.author');
  }

  get content(): ElementChain {
    return cy.get('.article-content');
  }

  get tags(): ElementChain {
    return this.content.find('.tag-list li');
  }

  // --- Author-only actions ---

  get editButton(): ElementChain {
    return this.banner.contains<HTMLElement>('a', 'Edit Article');
  }

  get deleteButton(): ElementChain {
    return this.banner.contains<HTMLElement>('button', 'Delete Article');
  }

  clickEdit(): void {
    this.editButton.click();
  }

  clickDelete(): void {
    this.deleteButton.click();
  }

  // Registers @deleteArticle; pair with cy.uiWaitForArticleDelete.
  interceptDelete(slug: string): this {
    cy.intercept('DELETE', `**/api/articles/${slug}`).as('deleteArticle');
    return this;
  }

  // --- Reader actions (visible on other authors' articles) ---

  // Text is "Favorite Article (n)" / "Unfavorite Article (n)".
  get favoriteButton(): ElementChain {
    return this.banner.contains<HTMLElement>('button', /Favorite Article|Unfavorite Article/);
  }

  assertFavoriteButton(state: 'Favorite' | 'Unfavorite', count: number): this {
    this.favoriteButton
      .invoke('text')
      .should('match', new RegExp(`^\\s*${state} Article\\s*\\(${count}\\)\\s*$`));
    return this;
  }

  // Text is "Follow <username>" / "Unfollow <username>".
  get followButton(): ElementChain {
    return this.banner.contains<HTMLElement>('button', /Follow|Unfollow/);
  }

  // --- Comments ---

  get commentInput(): ElementChain {
    return cy.get('textarea[placeholder="Write a comment..."]');
  }

  get postCommentButton(): ElementChain {
    return cy.contains<HTMLElement>('button', 'Post Comment');
  }

  get comments(): ElementChain {
    return cy.get('app-article-comment');
  }

  commentWithText(text: string): ElementChain {
    return cy.contains('app-article-comment', text);
  }

  // Posts through the UI and waits for the backend to accept it.
  addComment(text: string): this {
    cy.intercept('POST', '**/api/articles/*/comments').as('postComment');
    this.commentInput.type(text);
    this.postCommentButton.click();
    cy.wait('@postComment').its('response.statusCode').should('eq', 200);
    return this;
  }

  deleteComment(text: string): this {
    this.commentDeleteIcon(text).click();
    return this;
  }

  // Author links in a comment's footer (avatar + username); assert with contain.text.
  commentAuthor(text: string): ElementChain {
    return this.commentWithText(text).find('a.comment-author');
  }

  // Trash icon, rendered only when the viewer may delete the comment.
  commentDeleteIcon(text: string): ElementChain {
    return this.commentWithText(text).find('.mod-options .ion-trash-a');
  }
}
