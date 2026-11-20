import type { ApiArticleInput } from '../commands/article-commands';
import { BasePage, ElementChain } from './basePage';

// /editor (new article) and /editor/:slug (edit existing).
export class ArticleEditorPage extends BasePage {
  constructor(private slug = '') {
    super();
  }

  protected get path(): string {
    return this.slug ? `/editor/${this.slug}` : '/editor';
  }

  openForEdit(slug: string): this {
    this.slug = slug;
    return this.visit();
  }

  // Registers @createArticle; pair with cy.uiWaitForArticlePublish.
  interceptPublish(): this {
    cy.intercept('POST', '**/api/articles').as('createArticle');
    return this;
  }

  // Registers @updateArticle; pair with cy.uiWaitForArticleUpdate.
  interceptUpdate(slug: string): this {
    cy.intercept('PUT', `**/api/articles/${slug}`).as('updateArticle');
    return this;
  }

  get titleInput(): ElementChain {
    return cy.get('input[placeholder="Article Title"]');
  }

  get descriptionInput(): ElementChain {
    return cy.get(`input[placeholder="What's this article about?"]`);
  }

  get bodyInput(): ElementChain {
    return cy.get('textarea[placeholder="Write your article (in markdown)"]');
  }

  get tagInput(): ElementChain {
    return cy.get('input[placeholder="Enter tags"]');
  }

  // Tag pills already added in the editor; each has a close icon that removes it.
  get tags(): ElementChain {
    return this.tagInput.parent().find('.tag-list .tag-pill');
  }

  get publishButton(): ElementChain {
    return cy.contains<HTMLElement>('button', 'Publish Article');
  }

  typeTitle(title: string): this {
    this.titleInput.clear().type(title, { parseSpecialCharSequences: false });
    return this;
  }

  typeDescription(description: string): this {
    this.descriptionInput.clear().type(description, { parseSpecialCharSequences: false });
    return this;
  }

  typeBody(body: string): this {
    this.bodyInput.clear().type(body, { parseSpecialCharSequences: false });
    return this;
  }

  // Tags are committed with Enter, one at a time.
  addTags(tags: string[]): this {
    tags.forEach((tag) => this.tagInput.type(`${tag}{enter}`));
    return this;
  }

  publish(): void {
    this.publishButton.click();
  }

  fillAndPublish(article: ApiArticleInput): void {
    this.typeTitle(article.title).typeDescription(article.description).typeBody(article.body);
    if (article.tagList?.length) {
      this.addTags(article.tagList);
    }
    this.publish();
  }
}
