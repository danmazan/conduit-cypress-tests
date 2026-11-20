import users from '../../fixtures/users.json';
import { ArticleEditorPage } from '../../support/page-objects/articleEditorPage';
import { ArticlePage } from '../../support/page-objects/articlePage';
import { HomePage } from '../../support/page-objects/homePage';
import { ProfilePage } from '../../support/page-objects/profilePage';
import { randomArticle } from '../../support/test-data';

// Articles created via apiCreateArticle are deleted by the global afterEach; ones
// created through the editor are tracked by uiPublishArticle / uiWaitForArticlePublish.
describe('Article CRUD - UI', () => {
  const author = users.poolUser1;
  const reader = users.poolUser2;
  const editorPage = new ArticleEditorPage();
  const articlePage = new ArticlePage();
  const homePage = new HomePage();
  const profilePage = new ProfilePage();

  context('as the author', () => {
    beforeEach(() => {
      cy.loginBySession(author);
    });

    it('UI-ART-001: publishes a new article and shows it on its own page', () => {
      const article = randomArticle({ body: '## Markdown heading\n\nPlain paragraph' });

      cy.uiPublishArticle(author, article).then((slug) => {
        cy.location('pathname').should('eq', `/article/${slug}`);
      });
      articlePage.title.should('have.text', article.title);
      articlePage.authorLink.should('contain.text', author.username);
      articlePage.content.find('h2').should('have.text', 'Markdown heading');
      articlePage.content.should('contain.text', 'Plain paragraph');
      articlePage.tags.should('have.length', 1).and('contain.text', article.tagList![0]);
      articlePage.editButton.should('be.visible');
      articlePage.deleteButton.should('be.visible');
    });

    it("UI-ART-002: lists a newly published article in its tag feed and on the author's profile", () => {
      const article = randomArticle();
      cy.uiPublishArticle(author, article);

      // Tag feed of the article's unique tag: unlike the Global Feed, its first
      // page can't be filled by other users' newer articles.
      homePage.openTag(article.tagList![0]);
      homePage.articleList.assertContains(article.title);
      // The preview is the only place the UI shows the description.
      homePage.articleList
        .previewByTitle(article.title)
        .should('contain.text', article.description);

      profilePage.open(author.username);
      profilePage.articleList.assertContains(article.title);
    });

    it('UI-ART-003: shows a validation error and stays in the editor when the title is empty', () => {
      editorPage.interceptPublish().visit();
      editorPage.typeDescription('No title here').typeBody('Body without a title').publish();

      cy.uiWaitForArticlePublish(author, 422);
      editorPage.errorMessages.should('contain.text', "title can't be blank");
      cy.location('pathname').should('eq', '/editor');
    });

    // Backend deviation: slugs are "<title>-<authorId>", so uniqueness is per author
    // and the error is { title: ['must be unique'] } with 422.
    it('UI-ART-004: shows an error when the author already has an article with the same title', () => {
      cy.apiCreateArticle(author).then((existing) => {
        editorPage.interceptPublish().visit();
        editorPage.fillAndPublish(randomArticle({ title: existing.title }));
      });

      cy.uiWaitForArticlePublish(author, 422);
      editorPage.errorMessages.should('contain.text', 'title must be unique');
      cy.location('pathname').should('eq', '/editor');
    });

    it('UI-ART-005: edits an existing article and shows the updated content', () => {
      const updated = randomArticle();

      cy.apiCreateArticle(author).then((original) => {
        articlePage.open(original.slug);
        articlePage.clickEdit();
        cy.location('pathname').should('eq', `/editor/${original.slug}`);
        editorPage.titleInput.should('have.value', original.title);
        editorPage.descriptionInput.should('have.value', original.description);
        editorPage.bodyInput.should('have.value', original.body);
        editorPage.tags.should('contain.text', original.tagList[0]);

        editorPage
          .interceptUpdate(original.slug)
          .typeTitle(updated.title)
          .typeDescription(updated.description)
          .typeBody(updated.body)
          .publish();

        cy.uiWaitForArticleUpdate(original.slug, 200).then((newSlug) => {
          cy.location('pathname').should('eq', `/article/${newSlug}`);
          articlePage.title.should('have.text', updated.title);
          articlePage.content.should('contain.text', updated.body);
          // Backend clears tags on a PUT without tagList; the edit must keep them.
          articlePage.tags.should('have.length', 1).and('contain.text', original.tagList[0]);

          // The description isn't rendered on the article page.
          cy.apiGetArticle(newSlug!)
            .its('body.article.description')
            .should('eq', updated.description);
          // Backend deviation: the slug follows the title, so the old one is gone.
          cy.apiGetArticle(original.slug).its('status').should('eq', 404);
        });
      });
    });

    it('UI-ART-006: deletes an article and sends the author back to the home page', () => {
      cy.apiCreateArticle(author).then((article) => {
        articlePage.open(article.slug);
        articlePage.interceptDelete(article.slug).clickDelete();

        cy.uiWaitForArticleDelete(article.slug);
        cy.location('pathname').should('eq', '/');
        cy.apiGetArticle(article.slug).its('status').should('eq', 404);

        homePage.openTag(article.tagList[0]);
        homePage.articleList.assertNotContains(article.title);
      });
    });
  });

  context('as another user', () => {
    beforeEach(() => {
      cy.loginBySession(reader);
    });

    it("UI-ART-007: does not offer Edit or Delete on someone else's article", () => {
      cy.apiCreateArticle(author).then((article) => {
        articlePage.open(article.slug);
        articlePage.title.should('have.text', article.title);
      });

      articlePage.followButton.should('be.visible');
      articlePage.banner.contains('Edit Article').should('not.exist');
      articlePage.banner.contains('Delete Article').should('not.exist');
    });
  });
});
