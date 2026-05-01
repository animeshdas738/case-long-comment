import { LightningElement, api } from 'lwc';

export default class EnhancedCommentItem extends LightningElement {
  @api comment;

  get isDraft() {
    return this.comment && this.comment.Is_Draft__c === true;
  }

  get formattedDate() {
    if (!this.comment || !this.comment.CreatedDate) return '';
    try {
      const created = new Date(this.comment.CreatedDate);
      const now = new Date();
      const diff = Math.floor((now - created) / 1000); // seconds
      if (diff < 60) return `${diff}s`;
      const mins = Math.floor(diff / 60);
      if (mins < 60) return `${mins}m`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d`;
      // older than a week -> localized date
      return created.toLocaleDateString();
    } catch (e) {
      return this.comment.CreatedDate;
    }
  }

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

  handlePublish() {
    // Parent should handle the actual publish (Apex update). We emit an event so parent can call the controller.
    this.dispatchEvent(new CustomEvent('publish', { detail: { commentId: this.comment.Id }, bubbles: true }));
  }
}
