import { LightningElement, api } from 'lwc';

export default class EnhancedCommentItem extends LightningElement {
  @api comment;

  get channelStyle() {
    const color = this.comment && this.comment.Color_Class__c ? this.comment.Color_Class__c : '#e0e0e0';
    return `background: ${color}; padding: 0.25rem 0.5rem; border-radius: 0.25rem;`;
  }

  get commentAttachments() {
    return this.comment && this.comment.Attachments ? this.comment.Attachments : null;
  }

  renderedCallback() {
    // Render rich HTML body into the lwc:dom manual container
    if (this.comment && this.comment.Id) {
      const container = this.template.querySelector(`.comment-body[data-id="${this.comment.Id}"]`);
      if (container) {
        container.innerHTML = this.comment.Body__c || this.comment.Plain_Body__c || '';
      }
    }
    // Style channel badge
    try {
      const badge = this.template.querySelector(`.channel-badge[data-channel-id="${this.comment?.Id}"]`);
      if (badge) {
        const color = this.comment && this.comment.Color_Class__c ? this.comment.Color_Class__c : '#e0e0e0';
        badge.style.background = color;
        badge.style.padding = '0.25rem 0.5rem';
        badge.style.borderRadius = '0.25rem';
      }
    } catch (e) {
      // ignore
    }
  }

  handleReply() {
    this.dispatchEvent(new CustomEvent('reply', { detail: { commentId: this.comment.Id } }));
  }

  handleEdit() {
    this.dispatchEvent(new CustomEvent('edit', { detail: { commentId: this.comment.Id } }));
  }
}
