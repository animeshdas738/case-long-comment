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

  get formattedDateTitle() {
    if (!this.comment || !this.comment.CreatedDate) return '';
    try {
      const created = new Date(this.comment.CreatedDate);
      return created.toLocaleString();
    } catch (e) {
      return this.comment.CreatedDate;
    }
  }

  get channelStyle() {
    const color = this.comment && this.comment.Color_Class__c ? this.comment.Color_Class__c : '#e0e0e0';
    return `background: ${color}; padding: 0.25rem 0.5rem; border-radius: 0.25rem;`;
  }

  get isPublic() {
    return this.comment && this.comment.Is_Public__c === true;
  }

  get isPublished() {
    return this.isPublic && !this.isDraft;
  }

  get isPrivate() {
    return !this.isPublic && !this.isDraft;
  }

  get publicLabel() {
    return this.isPublic ? 'Make Private' : 'Make Public';
  }

  get publicIconName() {
    // Show lock icon for private comments (isPublic=false), and share for public
    return this.isPublic ? 'utility:share' : 'utility:lock';
  }

  get publishedLabel() {
    return 'PUBLISHED';
  }

  get roleBadge() {
    // example: show a short role; fallback null
    return this.comment && this.comment.AuthorRole ? this.comment.AuthorRole : null;
  }

  get statusLabel() {
    if (this.isDraft) return 'DRAFT';
    return this.isPublic ? 'PUBLISHED' : 'PRIVATE';
  }

  get statusClass() {
    if (this.isDraft) return 'status-draft';
    return this.isPublic ? 'status-published' : 'status-private';
  }

  get statusClassName() {
    return `status-badge ${this.statusClass}`;
  }

  get commentAuthorInitials() {
    const name = this.comment && (this.comment.AuthorName || (this.comment.CreatedBy && this.comment.CreatedBy.Name)) ? (this.comment.AuthorName || this.comment.CreatedBy.Name) : '';
    if (!name) return '';
    const parts = name.split(/\s+/).filter(p => p.length);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  get commentAuthorPhotoUrl() {
    // Prefer explicit AuthorPhotoUrl, then CreatedBy.SmallPhotoUrl if available.
    if (!this.comment) return null;
    if (this.comment.AuthorPhotoUrl) return this.comment.AuthorPhotoUrl;
    if (this.comment.CreatedBy && this.comment.CreatedBy.SmallPhotoUrl) return this.comment.CreatedBy.SmallPhotoUrl;
    return null;
  }

  get attachmentSummary() {
    const a = this.comment && this.comment.Attachments ? this.comment.Attachments.length : 0;
    if (a === 0) return null;
    return `${a} ${a === 1 ? 'file' : 'files'}`;
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
    this.dispatchEvent(new CustomEvent('reply', { detail: { commentId: this.comment.Id }, bubbles: true, composed: true }));
  }

  handleEdit() {
    this.dispatchEvent(new CustomEvent('edit', { detail: { commentId: this.comment.Id }, bubbles: true, composed: true }));
  }

  handlePublish() {
    // Parent should handle the actual publish (Apex update). We emit an event so parent can call the controller.
    this.dispatchEvent(new CustomEvent('publish', { detail: { commentId: this.comment.Id }, bubbles: true, composed: true }));
  }

  handleTogglePublic() {
    const newValue = !this.isPublic;
    this.dispatchEvent(new CustomEvent('togglepublic', { detail: { commentId: this.comment.Id, isPublic: newValue }, bubbles: true, composed: true }));
  }

  handleArchive() {
    this.dispatchEvent(new CustomEvent('archive', { detail: { commentId: this.comment.Id }, bubbles: true, composed: true }));
  }

  handleMore() {
    this.dispatchEvent(new CustomEvent('more', { detail: { commentId: this.comment.Id }, bubbles: true, composed: true }));
  }
}
