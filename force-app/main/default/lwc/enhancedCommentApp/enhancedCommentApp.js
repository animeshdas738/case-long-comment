import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class EnhancedCommentApp extends LightningElement {
  @api recordId;

  handleSaveComment(event) {
    // event.detail contains comment data; in future call Apex here
    const payload = event.detail;
    // For now, re-dispatch to timeline via DOM so timeline picks it up
    this.template.querySelector('c-enhanced-comment-timeline')?.dispatchEvent(new CustomEvent('savecomment', { detail: payload }));
    this.dispatchEvent(new ShowToastEvent({ title: 'Comment saved locally', message: 'Comment request dispatched to server', variant: 'success' }));
  }

  handleRequestComments(event) {
    // Placeholder: call Apex to fetch comments. Re-dispatch as a 'commentsloaded' with mock data
    const request = event.detail;
    // In a follow-up we'll wire this to Apex and populate comments via a new event
    this.template.querySelector('c-enhanced-comment-timeline')?.dispatchEvent(new CustomEvent('commentsloaded', { detail: { comments: [] } }));
  }
}
