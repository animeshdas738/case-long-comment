import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createCommentWithAttachments from '@salesforce/apex/EnhancedCommentController.createCommentWithAttachments';
import getCommentById from '@salesforce/apex/EnhancedCommentController.getCommentById';

export default class EnhancedCommentApp extends LightningElement {
  @api recordId;

  async handleSaveComment(event) {
    const payload = event.detail;
    try {
      const ecId = await createCommentWithAttachments({
        caseId: payload.recordId,
        parentCommentId: null,
        bodyHtml: payload.bodyHtml,
        bodyPlain: null,
        isPublic: true,
        isDraft: payload.isDraft || false,
        channel: 'Case Comment',
        type: null,
        contentDocumentIds: payload.uploadedContentDocumentIds
      });

      this.dispatchEvent(new ShowToastEvent({ title: 'Saved', message: 'Comment saved successfully', variant: 'success' }));
      // Fetch the single created comment and prepend it to the timeline for immediate visibility
      try {
        const ec = await getCommentById({ commentId: ecId });
        const timeline = this.template.querySelector('c-enhanced-comment-timeline');
        if (timeline && typeof timeline.prependComment === 'function') {
          // map server record into UI-friendly shape
          const mapped = {
            Id: ec.Id,
            Comment_Number__c: ec.Comment_Number__c,
            Is_Draft__c: ec.Is_Draft__c,
            Body__c: ec.Body__c,
            Plain_Body__c: ec.Plain_Body__c,
            Channel__c: ec.Channel__c,
            CreatedDate: ec.CreatedDate,
            Color_Class__c: ec.Color_Class__c,
            CreatedBy: ec.CreatedBy,
            AuthorName: ec.CreatedBy ? ec.CreatedBy.Name : null,
            Attachments: []
          };
          timeline.prependComment(mapped);
        } else {
          timeline.loadComments();
        }
      } catch (err2) {
        // fallback to full reload
        const timeline = this.template.querySelector('c-enhanced-comment-timeline');
        if (timeline && typeof timeline.loadComments === 'function') timeline.loadComments();
      }
    } catch (err) {
      this.dispatchEvent(new ShowToastEvent({ title: 'Error', message: err.body ? err.body.message : err.message, variant: 'error' }));
    }
  }

  handleRequestComments(event) {
    // This remains unimplemented; the timeline dispatches requestcomments that should be handled by Apex wiring.
    // For now, re-dispatch an empty response so the UI doesn't break.
    this.template.querySelector('c-enhanced-comment-timeline')?.dispatchEvent(new CustomEvent('commentsloaded', { detail: { comments: [], totalCount: 0 }, bubbles: true }));
  }
}
